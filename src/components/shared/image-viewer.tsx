"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  images: { src: string; alt?: string }[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageViewer({ images, initialIndex = 0, open, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(z + 0.25, 3));
          break;
        case "-":
          setZoom((z) => Math.max(z - 0.25, 0.5));
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, goNext, goPrev]);

  if (!open || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 rounded-full px-4 py-2">
        <span className="text-white text-caption">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="w-px h-4 bg-white/30" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          className="h-10 w-10 text-white hover:bg-white/20"
          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
        >
          <ZoomOut className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="text-white text-caption min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          className="h-10 w-10 text-white hover:bg-white/20"
          onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
        >
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="w-px h-4 bg-white/30" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Download image"
          className="h-10 w-10 text-white hover:bg-white/20"
          asChild
        >
          <a href={current.src} download target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Close image viewer"
        className="absolute top-4 right-4 z-10 h-10 w-10 text-white hover:bg-white/20 rounded-full"
        onClick={onClose}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous image"
            className="absolute left-4 z-10 h-12 w-12 text-white hover:bg-white/20 rounded-full"
            onClick={goPrev}
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next image"
            className="absolute right-4 z-10 h-12 w-12 text-white hover:bg-white/20 rounded-full"
            onClick={goNext}
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </Button>
        </>
      )}

      {/* Image */}
      <div className="relative z-[1] max-w-[90vw] max-h-[85vh] overflow-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.alt || `Image ${currentIndex + 1}`}
          className="transition-transform duration-200 select-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
