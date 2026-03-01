"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { MessageSquare, Send, Lock } from "lucide-react";
import { addNote } from "@/lib/actions/notes";
import type { Note } from "@/lib/actions/notes";

interface NotesSectionProps {
  entityType: string;
  entityId: string;
  notes: Note[];
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function NotesSection({ entityType, entityId, notes }: NotesSectionProps) {
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setLoading(true);
    try {
      const result = await addNote({
        entity_type: entityType,
        entity_id: entityId,
        content: content.trim(),
        is_internal: isInternal,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to add note");
        return;
      }

      toast.success("Note added");
      setContent("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-text-muted" />
        <h3 className="text-h3 text-text-primary">Notes</h3>
        <span className="text-caption text-text-muted">({notes.length})</span>
      </div>

      {/* Add Note Form */}
      <div className="mb-6">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note..."
          rows={3}
          className="bg-bg-page border-border-primary mb-3"
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={isInternal}
              onCheckedChange={(checked) => setIsInternal(checked === true)}
            />
            <span className="text-body-sm text-text-secondary">
              Internal only (PM team)
            </span>
          </label>
          <Button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="bg-accent hover:bg-accent-light text-white"
            size="sm"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {loading ? "Adding..." : "Add Note"}
          </Button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-bg-elevated rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-caption text-text-muted font-medium">
                  {note.author_name}
                </span>
                <span className="text-[10px] text-text-muted">
                  {formatRelativeTime(note.created_at)}
                </span>
                {note.is_internal && (
                  <span className="inline-flex items-center gap-0.5 bg-warning/10 text-warning text-[10px] font-medium px-1.5 py-0.5 rounded">
                    <Lock className="h-2.5 w-2.5" />
                    Internal
                  </span>
                )}
              </div>
              <p className="text-body-sm text-text-primary whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-body-sm text-text-muted text-center py-4">
          No notes yet. Add one above.
        </p>
      )}
    </div>
  );
}
