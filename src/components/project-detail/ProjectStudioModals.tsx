"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  GitBranch,
  Users,
  CheckCircle2,
  AlertCircle,
  FileBox,
} from "lucide-react";
import { CollaboratorRole, ProjectAsset } from "./projectTypes";

interface ProjectStudioModalsProps {
  projectId: string;
  isUploadOpen: boolean;
  onCloseUpload: () => void;
  isNewVersionOpen: boolean;
  onCloseNewVersion: () => void;
  isInviteOpen: boolean;
  onCloseInvite: () => void;
  onSuccess: () => Promise<void>;
  availableAssets: ProjectAsset[];
}

export function ProjectStudioModals({
  projectId,
  isUploadOpen,
  onCloseUpload,
  isNewVersionOpen,
  onCloseNewVersion,
  isInviteOpen,
  onCloseInvite,
  onSuccess,
  availableAssets,
}: ProjectStudioModalsProps) {
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New Version State
  const [versionNotes, setVersionNotes] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  // Invite Collaborator State
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("Collaborator");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Direct storage upload handler
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(15);
    setUploadError(null);

    try {
      // 1. Get signed upload URL
      const urlRes = await fetch("/api/assets/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
        }),
      });

      const urlData = await urlRes.json();
      if (!urlRes.ok || !urlData.success) {
        throw new Error(urlData.error?.message || "Failed to generate upload URL");
      }

      const { uploadUrl, storagePath, uploadToken } = urlData.data;
      setUploadProgress(45);

      // 2. Direct upload to Supabase Storage
      const storageRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!storageRes.ok) {
        throw new Error(`Storage transfer failed with status ${storageRes.status}`);
      }

      setUploadProgress(85);

      // 3. Confirm asset metadata in PostgreSQL
      const confirmRes = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
          storagePath,
          uploadToken,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(confirmData.error?.message || "Could not register asset metadata");
      }

      setUploadProgress(100);
      setSelectedFile(null);
      await onSuccess();
      onCloseUpload();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Submit New Version
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVersion(true);
    setVersionError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetIds: selectedAssetIds,
          notes: versionNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create new version");
      }

      setVersionNotes("");
      setSelectedAssetIds([]);
      await onSuccess();
      onCloseNewVersion();
    } catch (err: any) {
      setVersionError(err.message || "Failed to create version");
    } finally {
      setIsSubmittingVersion(false);
    }
  };

  // Submit Invite Collaborator
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdentifier: inviteIdentifier.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to invite collaborator");
      }

      setInviteIdentifier("");
      await onSuccess();
      onCloseInvite();
    } catch (err: any) {
      setInviteError(err.message || "Failed to invite collaborator");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      {/* 1. UPLOAD ASSET MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F3] border border-[#203B35]/20 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#203B35]" />
                <h3 className="text-base font-serif italic text-[#203B35] font-semibold">
                  Upload Creative Asset
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseUpload}
                className="p-1 rounded-full text-[#92958F] hover:text-[#203B35]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#203B35]/25 rounded-2xl p-8 text-center cursor-pointer hover:border-[#203B35]/50 bg-white/50 transition-colors space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Upload className="w-8 h-8 text-[#203B35] mx-auto" />
                <p className="text-xs sm:text-sm font-semibold text-[#203B35]">
                  {selectedFile ? selectedFile.name : "Click to select file or drop here"}
                </p>
                <p className="text-[11px] font-mono text-[#92958F]">
                  Supports PNG, JPG, MP4, MP3, WAV, PDF (up to 100MB)
                </p>
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="w-full bg-[#EFECE2] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#203B35] h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-right text-[#5D635F]">
                    {uploadProgress}%
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseUpload}
                  className="px-4 py-2 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. NEW VERSION MODAL */}
      {isNewVersionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F3] border border-[#203B35]/20 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[#203B35]" />
                <h3 className="text-base font-serif italic text-[#203B35] font-semibold">
                  Publish New Draft Iteration
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseNewVersion}
                className="p-1 rounded-full text-[#92958F] hover:text-[#203B35]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#5D635F] mb-1.5">
                  Change Notes / Milestone Summary
                </label>
                <textarea
                  rows={3}
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  placeholder="Describe what evolved in this iteration (e.g. refined color grading, revised typography, added motion)..."
                  className="w-full rounded-2xl border border-[#203B35]/15 bg-white p-3 text-xs text-[#282B2A] focus:outline-none"
                />
              </div>

              {availableAssets.length > 0 && (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#5D635F] mb-1.5">
                    Select Assets for This Iteration
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-[#203B35]/10 rounded-2xl p-2 bg-white/70">
                    {availableAssets.map((asset) => {
                      const isChecked = selectedAssetIds.includes(asset.id);
                      return (
                        <label
                          key={asset.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#EFECE2]/70 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssetIds((prev) => [...prev, asset.id]);
                              } else {
                                setSelectedAssetIds((prev) =>
                                  prev.filter((id) => id !== asset.id)
                                );
                              }
                            }}
                            className="rounded accent-[#203B35]"
                          />
                          <span className="truncate text-[#203B35] font-medium">
                            {asset.fileName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {versionError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{versionError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseNewVersion}
                  className="px-4 py-2 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVersion}
                  className="px-5 py-2 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] disabled:opacity-50"
                >
                  {isSubmittingVersion ? "Creating..." : "Create Iteration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. INVITE COLLABORATOR MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-[#FAF8F3] border border-[#203B35]/20 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#203B35]" />
                <h3 className="text-base font-serif italic text-[#203B35] font-semibold">
                  Invite Project Collaborator
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseInvite}
                className="p-1 rounded-full text-[#92958F] hover:text-[#203B35]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#5D635F] mb-1.5">
                  Creator Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  placeholder="e.g. grace_music or grace@creativespace.com"
                  className="w-full rounded-2xl border border-[#203B35]/15 bg-white p-3 text-xs text-[#282B2A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#5D635F] mb-1.5">
                  Collaborator Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
                  className="w-full rounded-2xl border border-[#203B35]/15 bg-white p-3 text-xs text-[#282B2A] focus:outline-none"
                >
                  <option value="Collaborator">Collaborator (Co-Creator / Can Upload & Iterate)</option>
                  <option value="ClientReviewer">Client Reviewer (Feedback & Sign-Off)</option>
                </select>
              </div>

              {inviteError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseInvite}
                  className="px-4 py-2 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inviteIdentifier.trim() || isInviting}
                  className="px-5 py-2 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] disabled:opacity-50"
                >
                  {isInviting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
