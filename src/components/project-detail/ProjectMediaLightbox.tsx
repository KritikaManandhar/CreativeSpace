"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize,
} from "lucide-react";
import { ProjectAsset, formatFileSize } from "./projectTypes";

interface ProjectMediaLightboxProps {
  assets: ProjectAsset[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
}

export function ProjectMediaLightbox({
  assets,
  initialIndex,
  isOpen,
  onClose,
  projectTitle,
}: ProjectMediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  // Handle keyboard events: Escape to close, ArrowLeft / ArrowRight to navigate
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : assets.length - 1));
        setIsZoomed(false);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < assets.length - 1 ? prev + 1 : 0));
        setIsZoomed(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, assets.length, onClose]);

  if (!isOpen || assets.length === 0) return null;

  const currentAsset = assets[currentIndex] || assets[0];
  const hasMultiple = assets.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : assets.length - 1));
    setIsZoomed(false);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < assets.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-300">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between text-white pointer-events-none">
        {/* Left: Asset info & counter */}
        <div className="pointer-events-auto flex items-center gap-3">
          <span className="font-mono text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
            {currentIndex + 1} / {assets.length}
          </span>
          <span className="hidden sm:inline text-xs font-medium text-white/90 truncate max-w-sm">
            {currentAsset.fileName}
          </span>
          {currentAsset.fileSize > 0 && (
            <span className="hidden md:inline font-mono text-[11px] text-white/50">
              ({formatFileSize(currentAsset.fileSize)})
            </span>
          )}
        </div>

        {/* Right: Actions (Zoom, Download, Close) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isZoomed ? "Zoom out" : "Zoom in"}
            aria-label="Zoom toggle"
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Download button if downloadUrl exists */}
          {currentAsset.downloadUrl && (
            <a
              href={currentAsset.downloadUrl}
              download={currentAsset.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download high-resolution file"
              aria-label="Download asset"
            >
              <Download className="w-5 h-5" />
            </a>
          )}

          {/* Close Lightbox */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors ml-2"
            title="Close viewer (Esc)"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        onClick={onClose}
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12 cursor-zoom-out select-none"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
          className={`relative transition-all duration-300 max-w-full max-h-full flex items-center justify-center ${
            isZoomed
              ? "scale-125 cursor-zoom-out sm:scale-150"
              : "cursor-zoom-in"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentAsset.downloadUrl}
            alt={currentAsset.fileName || projectTitle}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-transform"
          />
        </div>
      </div>

      {/* Prev / Next Navigation Controls */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10"
            aria-label="Previous artwork (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10"
            aria-label="Next artwork (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom Filmstrip for fast switching */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90vw] overflow-x-auto flex items-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 z-50">
          {assets.map((asset, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={asset.id || idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`relative h-12 w-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  isSelected
                    ? "border-white scale-105"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.downloadUrl}
                  alt={asset.fileName}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
