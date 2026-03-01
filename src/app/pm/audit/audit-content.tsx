"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Plus, Pencil, Trash2, CheckCircle2, XCircle,
  FileText, LogIn, Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  actor_name: string;
  actor_role: string;
  description: string;
  created_at: string;
}

interface AuditContentProps {
  logs: AuditLog[];
}

const ACTION_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  create: { icon: Plus, color: "text-success", bg: "bg-success/10" },
  update: { icon: Pencil, color: "text-info", bg: "bg-info/10" },
  delete: { icon: Trash2, color: "text-danger", bg: "bg-danger/10" },
  approve: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  reject: { icon: XCircle, color: "text-danger", bg: "bg-danger/10" },
  publish: { icon: FileText, color: "text-accent", bg: "bg-accent/10" },
  login: { icon: LogIn, color: "text-text-muted", bg: "bg-bg-elevated" },
  export: { icon: Download, color: "text-warning", bg: "bg-warning/10" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function AuditContent({ logs }: AuditContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [actionFilter, setActionFilter] = useState(searchParams.get("action") || "all");

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/pm/audit?${params.toString()}`, { scroll: false });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.actor_name.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="w-full">
      <PageHeader
        title="Audit Log"
        description="Complete activity trail — who did what and when"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateURL({ q: e.target.value });
            }}
            placeholder="Search activity..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => {
          setActionFilter(v);
          updateURL({ action: v });
        }}>
          <SelectTrigger className="w-[160px] bg-bg-card border-border-primary">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Created</SelectItem>
            <SelectItem value="update">Updated</SelectItem>
            <SelectItem value="delete">Deleted</SelectItem>
            <SelectItem value="approve">Approved</SelectItem>
            <SelectItem value="publish">Published</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="export">Export</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {filteredLogs.map((log) => {
          const actionConfig = ACTION_ICONS[log.action] ?? ACTION_ICONS.create;
          const Icon = actionConfig.icon;
          return (
            <div
              key={log.id}
              className="flex gap-3 p-3 rounded-lg hover:bg-bg-card transition-colors"
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", actionConfig.bg)}>
                <Icon className={cn("h-4 w-4", actionConfig.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-text-primary">{log.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-caption text-text-muted">{log.actor_name}</span>
                  <span className="text-caption text-text-muted">·</span>
                  <span className="text-caption bg-bg-elevated px-1.5 py-0.5 rounded text-text-muted">
                    {log.actor_role}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-caption text-text-secondary">{formatDate(log.created_at)}</p>
                <p className="text-caption text-text-muted">{formatTime(log.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
