import imageCompression from "browser-image-compression";

interface CompressOptions {
  /** Max file size in KB (default: 200) */
  maxSizeKB?: number;
  /** Max width/height in pixels (default: 1920) */
  maxWidthOrHeight?: number;
}

/**
 * Compress an image file before upload.
 * Converts phone photos (5MB+) down to ~200KB.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxSizeKB = 200, maxWidthOrHeight = 1920 } = options;

  // Skip compression for non-image files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Skip if already small enough
  if (file.size <= maxSizeKB * 1024) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: maxSizeKB / 1024,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
  });

  return new File([compressed], file.name, { type: compressed.type });
}

/**
 * Compress multiple image files in parallel.
 */
export async function compressImages(
  files: File[],
  options: CompressOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Get a human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
