"use client";

import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Check,
  Star,
  FileText,
  Music,
  Video as VideoIcon,
  Plus,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { ProjectAsset, getCategoryArtwork, formatFileSize, formatRelativeDate } from "@/components/project-detail/projectTypes";
import { ConfirmationModal } from "./ConfirmationModal";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

export interface MediaManagementPanelProps {
  projectId: string;
  category: string;
  coverImageUrl: string;
  coverAssetId?: string;
  assets: ProjectAsset[];
  onCoverChange: (url: string, assetId?: string) => void;
  onAssetAdded: (newAsset: ProjectAsset) => void;
  onAssetRemoved: (assetId: string) => void;
  isBusy?: boolean;
}

export function MediaManagementPanel({
  projectId,
  category,
  coverImageUrl,
  coverAssetId,
  assets,
  onCoverChange,
  onAssetAdded,
  onAssetRemoved,
  isBusy = false,
}: MediaManagementPanelProps) {
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // URL input state
  const [isEnteringUrl, setIsEnteringUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");

  // Asset Deletion Confirmation State
  const [assetToDelete, setAssetToDelete] = useState<ProjectAsset | null>(null);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fallback category artwork
  const fallbackCoverUrl = getCategoryArtwork(category);
  const effectiveCover = coverImageUrl || fallbackCoverUrl;

  // Determine media category of an asset
  const getAssetType = (asset: ProjectAsset): "image" | "video" | "audio" | "document" => {
    const mime = asset.mimeType?.toLowerCase() || "";
    const name = asset.fileName?.toLowerCase() || "";
    if (mime.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(name)) return "video";
    if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(name)) return "audio";
    if (
      mime.includes("pdf") ||
      mime.includes("document") ||
      mime.includes("zip") ||
      /\.(pdf|doc|docx|ai|psd|fig|zip)$/i.test(name)
    ) {
      return "document";
    }
    return "image";
  };

  // 3-step secure Supabase asset upload
  const handleUploadAsset = async (file: File, makeCover = false) => {
    setIsUploading(true);
    setUploadProgress(15);
    setUploadError(null);

    try {
      // 1. Request signed upload URL and ownership token
      const urlRes = await fetch("/api/assets/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });

      const urlData = await urlRes.json();
      if (!urlRes.ok || !urlData.success) {
        throw new Error(urlData.error?.message || "Failed to generate upload URL");
      }

      const { uploadUrl, storagePath, uploadToken } = urlData.data;
      setUploadProgress(45);

      // 2. Direct transfer to Supabase Storage
      const storageRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!storageRes.ok) {
        throw new Error(`Storage transfer failed with status ${storageRes.status}`);
      }

      setUploadProgress(85);

      // 3. Atomically register asset in PostgreSQL
      const confirmRes = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          storagePath,
          uploadToken,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(confirmData.error?.message || "Could not register asset record");
      }

      const newAsset: ProjectAsset = confirmData.data;
      setUploadProgress(100);

      // Add to local assets state
      onAssetAdded(newAsset);

      // If requested or if file is an image and no cover is set, set as cover
      if (makeCover || (file.type?.startsWith("image/") && !coverImageUrl)) {
        onCoverChange(newAsset.downloadUrl || "", newAsset.id);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload asset");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  // Confirm and execute asset removal
  const executeDeleteAsset = async () => {
    if (!assetToDelete) return;

    setIsDeletingAsset(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/assets/${assetToDelete.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to remove asset");
      }

      // If removed asset was cover, reset cover
      if (coverAssetId === assetToDelete.id) {
        onCoverChange("", undefined);
      }

      onAssetRemoved(assetToDelete.id);
      setAssetToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to remove asset");
    } finally {
      setIsDeletingAsset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. COVER ARTWORK MANAGEMENT                                  */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-5 sm:p-6 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#203B35]" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              Exhibition Cover Artwork
            </h3>
          </div>
          {coverImageUrl && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-2.5 h-2.5" />
              <span>Custom Cover</span>
            </span>
          )}
        </div>

        {/* Visual Cover Preview Card */}
        <div className="relative aspect-[16/10] w-full rounded-2xl bg-[#162A26] overflow-hidden border border-[#203B35]/20 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={effectiveCover}
            alt="Project Cover Artwork"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

          {/* Overlay Tag */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3]/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10 shadow-sm">
              {coverImageUrl ? "Primary Cover" : "Default Discipline Artwork"}
            </span>
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading || isBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F3]/95 hover:bg-white text-[#203B35] text-xs font-semibold backdrop-blur-md border border-[#203B35]/15 shadow-sm transition-all hover:scale-105"
            >
              <Upload className="w-3.5 h-3.5 text-[#203B35]" />
              <span>Replace Artwork</span>
            </button>

            {coverImageUrl && (
              <button
                type="button"
                onClick={() => onCoverChange("", undefined)}
                disabled={isBusy}
                className="px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-rose-950/80 text-white text-[11px] font-medium backdrop-blur-md transition-colors"
                title="Reset to category fallback artwork"
              >
                Reset
              </button>
            )}
          </div>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadAsset(file, true);
            }}
          />
        </div>

        {/* Enter Custom URL Option */}
        <div className="pt-1">
          {!isEnteringUrl ? (
            <button
              type="button"
              onClick={() => setIsEnteringUrl(true)}
              className="text-[11px] font-medium text-[#203B35] hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3 text-[#5D635F]" />
              <span>Or set cover via image URL</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      onCoverChange(customUrlInput.trim(), undefined);
                      setCustomUrlInput("");
                      setIsEnteringUrl(false);
                    }
                  }}
                  className="px-3 h-9 rounded-xl bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26]"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setIsEnteringUrl(false)}
                  className="px-2 h-9 text-xs text-[#5D635F] hover:text-[#203B35]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ATTACHED MEDIA ASSETS GALLERY                             */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-5 sm:p-6 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#203B35]" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              Media Attachments ({assets.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#5D635F]">
            Workspace Files
          </span>
        </div>

        {/* Assets List */}
        {assets.length === 0 ? (
          <div className="py-6 text-center rounded-2xl bg-[#F6F3EB]/70 border border-dashed border-[#203B35]/15 space-y-1.5 p-4">
            <CelestialSpark className="w-6 h-6 text-[#203B35]/30 mx-auto" />
            <p className="text-xs font-semibold text-[#203B35]">
              No media attachments uploaded yet
            </p>
            <p className="text-[11px] text-[#5D635F]">
              Add artwork, audio tracks, videos, or source files below.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {assets.map((asset) => {
              const type = getAssetType(asset);
              const isCurrentCover =
                coverAssetId === asset.id || coverImageUrl === asset.downloadUrl;

              return (
                <div
                  key={asset.id}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border transition-all ${
                    isCurrentCover
                      ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200"
                      : "bg-white border-[#203B35]/10 hover:border-[#203B35]/25"
                  }`}
                >
                  {/* Left: Thumbnail & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-[#F6F3EB] border border-[#203B35]/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {type === "image" && asset.downloadUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.downloadUrl}
                          alt={asset.fileName}
                          className="h-full w-full object-cover"
                        />
                      ) : type === "video" ? (
                        <VideoIcon className="w-5 h-5 text-[#203B35]" />
                      ) : type === "audio" ? (
                        <Music className="w-5 h-5 text-[#203B35]" />
                      ) : (
                        <FileText className="w-5 h-5 text-[#203B35]" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-[#203B35] truncate">
                        {asset.fileName}
                      </p>
                      <p className="text-[10px] font-mono text-[#5D635F]">
                        {formatFileSize(asset.fileSize)} · {formatRelativeDate(asset.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Make Cover Button (if image) */}
                    {type === "image" && (
                      <button
                        type="button"
                        onClick={() =>
                          onCoverChange(asset.downloadUrl || "", asset.id)
                        }
                        disabled={isCurrentCover}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${
                          isCurrentCover
                            ? "bg-emerald-600 text-white font-bold cursor-default"
                            : "bg-[#EFECE2] text-[#203B35] hover:bg-[#203B35] hover:text-[#FAF8F3]"
                        }`}
                        title={
                          isCurrentCover
                            ? "Currently designated cover"
                            : "Set as exhibition cover artwork"
                        }
                      >
                        <Star className="w-3 h-3 fill-current" />
                        <span>{isCurrentCover ? "Cover" : "Set Cover"}</span>
                      </button>
                    )}

                    {/* Delete Asset */}
                    <button
                      type="button"
                      onClick={() => setAssetToDelete(asset)}
                      disabled={isBusy || isDeletingAsset}
                      className="p-1.5 rounded-full text-[#92958F] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Remove asset attachment"
                      aria-label="Remove asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. ADD NEW ATTACHMENT DROPZONE                               */}
        {/* ============================================================ */}
        <div className="pt-2">
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#203B35]/20 hover:border-[#203B35]/40 rounded-2xl p-4 sm:p-5 text-center cursor-pointer bg-[#F6F3EB]/40 hover:bg-[#F6F3EB] transition-colors space-y-1.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadAsset(file, false);
              }}
            />

            <Upload className="w-5 h-5 text-[#203B35] mx-auto" />
            <p className="text-xs font-semibold text-[#203B35]">
              Upload Media Attachment
            </p>
            <p className="text-[10px] font-mono text-[#92958F]">
              PNG, JPG, MP4, MP3, WAV, PDF up to 100MB
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-3 space-y-1">
              <div className="w-full bg-[#EFECE2] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#203B35] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-right text-[#5D635F]">
                Uploading securely... {uploadProgress}%
              </p>
            </div>
          )}

          {uploadError && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {deleteError && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Asset Deletion Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(assetToDelete)}
        onClose={() => setAssetToDelete(null)}
        onConfirm={executeDeleteAsset}
        title="Remove Media Asset?"
        message={`Are you sure you want to remove "${assetToDelete?.fileName}"? This will permanently unlink the asset from your project.`}
        confirmLabel="Remove Asset"
        cancelLabel="Keep Asset"
        variant="danger"
        isBusy={isDeletingAsset}
      />
    </div>
  );
}
