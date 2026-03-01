"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage, formatFileSize } from "@/lib/utils/image-compress";
import { toast } from "sonner";

interface FileUploadProps {
  /** Accepted file types (default: "image/*,.pdf") */
  accept?: string;
  /** Max number of files (default: 5) */
  maxFiles?: number;
  /** Max file size in MB before compression (default: 10) */
  maxSizeMB?: number;
  /** Compression target in KB for images (default: 200) */
  compressToKB?: number;
  /** Show thumbnail previews (default: true) */
  preview?: boolean;
  /** Callback when files change */
  onFilesChange?: (files: File[]) => void;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
}

interface FileItem {
  id: string;
  file: File;
  preview?: string;
  compressing: boolean;
  originalSize: number;
  compressedSize: number;
}

export function FileUpload({
  accept = "image/*,.pdf",
  maxFiles = 5,
  maxSizeMB = 10,
  compressToKB = 200,
  preview = true,
  onFilesChange,
  label = "Upload Files",
  helperText,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);

      // Check max files
      if (files.length + fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check max size
      const oversized = fileArray.filter((f) => f.size > maxSizeMB * 1024 * 1024);
      if (oversized.length > 0) {
        toast.error(`Files must be under ${maxSizeMB}MB`);
        return;
      }

      // Create file items with pending compression state
      const newItems: FileItem[] = fileArray.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        compressing: file.type.startsWith("image/") && file.size > compressToKB * 1024,
        originalSize: file.size,
        compressedSize: file.size,
      }));

      // Generate previews for images
      for (const item of newItems) {
        if (preview && item.file.type.startsWith("image/")) {
          item.preview = URL.createObjectURL(item.file);
        }
      }

      setFiles((prev) => {
        const updated = [...prev, ...newItems];
        return updated;
      });

      // Compress images in background
      const compressedItems: FileItem[] = [];
      for (const item of newItems) {
        if (item.file.type.startsWith("image/") && item.file.size > compressToKB * 1024) {
          try {
            const compressed = await compressImage(item.file, { maxSizeKB: compressToKB });
            const compressedItem = {
              ...item,
              file: compressed,
              compressing: false,
              compressedSize: compressed.size,
              preview: preview ? URL.createObjectURL(compressed) : undefined,
            };
            compressedItems.push(compressedItem);
          } catch {
            compressedItems.push({ ...item, compressing: false });
          }
        } else {
          compressedItems.push({ ...item, compressing: false });
        }
      }

      setFiles((prev) => {
        const updated = prev.map((f) => {
          const compressed = compressedItems.find((c) => c.id === f.id);
          return compressed ?? f;
        });
        onFilesChange?.(updated.map((f) => f.file));
        return updated;
      });
    },
    [files.length, maxFiles, maxSizeMB, compressToKB, preview, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      const updated = prev.filter((f) => f.id !== id);
      onFilesChange?.(updated.map((f) => f.file));
      return updated;
    });
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-body-sm text-text-primary font-medium">{label}</label>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-border-primary hover:border-accent/50 hover:bg-bg-hover"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? "text-accent" : "text-text-muted"}`} />
        <p className="text-body-sm text-text-primary">
          {isDragging ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-caption text-text-muted mt-1">
          or click to browse · max {maxFiles} files · {maxSizeMB}MB each
        </p>
        {helperText && (
          <p className="text-caption text-text-muted mt-1">{helperText}</p>
        )}
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((item) => (
            <div
              key={item.id}
              className="relative group bg-bg-elevated border border-border-primary rounded-lg overflow-hidden"
            >
              {/* Thumbnail or icon */}
              {item.preview ? (
                <div className="aspect-square relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                  {item.compressing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-bg-hover">
                  {item.file.type.includes("pdf") ? (
                    <FileText className="h-8 w-8 text-danger" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-text-muted" />
                  )}
                </div>
              )}

              {/* File info */}
              <div className="p-2">
                <p className="text-[11px] text-text-primary truncate">{item.file.name}</p>
                <p className="text-[10px] text-text-muted">
                  {formatFileSize(item.compressedSize)}
                  {item.originalSize !== item.compressedSize && (
                    <span className="text-success ml-1">
                      ({Math.round((1 - item.compressedSize / item.originalSize) * 100)}% smaller)
                    </span>
                  )}
                </p>
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove file"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(item.id);
                }}
                className="absolute top-1 right-1 h-7 w-7 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
