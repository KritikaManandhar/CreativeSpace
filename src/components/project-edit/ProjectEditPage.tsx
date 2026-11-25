"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  RotateCcw,
  Eye,
  Layers,
  FileBox,
} from "lucide-react";
import { ProjectDetailData, ProjectAsset, ProjectStatus, Visibility } from "@/components/project-detail/projectTypes";
import { EditProjectFormData } from "./editTypes";
import { ProjectEditNav } from "./ProjectEditNav";
import { MainContentEditor } from "./MainContentEditor";
import { MediaManagementPanel } from "./MediaManagementPanel";
import { PublishingSettingsPanel } from "./PublishingSettingsPanel";
import { ProjectLivePreviewModal } from "./ProjectLivePreviewModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

export function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const projectId = params.id as string;

  // Initial fetched data for reset and dirty-checking
  const [initialData, setInitialData] = useState<EditProjectFormData | null>(null);
  const [formData, setFormData] = useState<EditProjectFormData | null>(null);

  // Raw project data for metadata & creator attribution
  const [projectRecord, setProjectRecord] = useState<ProjectDetailData | null>(null);

  // Page state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Live Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Confirmation Modals State
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

  // Display Toast Helper
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch project record and assets
  const fetchProjectForEditing = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch project from backend API
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error?.message || "Failed to load project details");
      }

      const rawProj = json.data;
      setProjectRecord(rawProj);

      // 2. Fetch enriched assets with signed download URLs
      let enrichedAssets: ProjectAsset[] = rawProj.assets || [];
      try {
        const assetsRes = await fetch(`/api/projects/${projectId}/assets`);
        const assetsJson = await assetsRes.json();
        if (assetsRes.ok && assetsJson.success && Array.isArray(assetsJson.data)) {
          enrichedAssets = assetsJson.data;
        }
      } catch {
        // Fallback to assets from main query
      }

      // 3. Extract metadata fields
      const meta = (rawProj.metadata || {}) as Record<string, any>;
      const rawCoverUrl = meta.previewImageUrl || meta.coverImageUrl || "";
      const rawCoverAssetId = meta.coverAssetId || undefined;
      const rawCaption = meta.caption || meta.tagline || "";

      // Clean category metadata (exclude special keys)
      const {
        caption: _c,
        tagline: _t,
        previewImageUrl: _p,
        coverImageUrl: _ci,
        coverAssetId: _ca,
        ...categoryMetadata
      } = meta;

      const loadedForm: EditProjectFormData = {
        id: rawProj.id,
        title: rawProj.title || "",
        caption: rawCaption,
        description: rawProj.description || "",
        category: rawProj.category || "Illustration",
        status: rawProj.status as ProjectStatus,
        visibility: rawProj.visibility as Visibility,
        tags: rawProj.tags || (rawProj.projectTags?.map((pt: any) => pt.tag?.name || pt.tag) ?? []),
        coverImageUrl: rawCoverUrl,
        coverAssetId: rawCoverAssetId,
        metadata: categoryMetadata,
        assets: enrichedAssets,
      };

      setInitialData(loadedForm);
      setFormData(loadedForm);
    } catch (err: any) {
      setError(err.message || "Failed to load project information");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectForEditing();
  }, [fetchProjectForEditing]);

  // Compute if form has unsaved modifications
  const isDirty = useMemo(() => {
    if (!initialData || !formData) return false;

    // Check scalar fields
    if (formData.title !== initialData.title) return true;
    if (formData.caption !== initialData.caption) return true;
    if (formData.description !== initialData.description) return true;
    if (formData.category !== initialData.category) return true;
    if (formData.status !== initialData.status) return true;
    if (formData.visibility !== initialData.visibility) return true;
    if (formData.coverImageUrl !== initialData.coverImageUrl) return true;
    if (formData.coverAssetId !== initialData.coverAssetId) return true;

    // Check tags
    if (formData.tags.length !== initialData.tags.length) return true;
    if (!formData.tags.every((t) => initialData.tags.includes(t))) return true;

    // Check metadata
    const formMetaKeys = Object.keys(formData.metadata || {});
    const initMetaKeys = Object.keys(initialData.metadata || {});
    if (formMetaKeys.length !== initMetaKeys.length) return true;
    for (const key of formMetaKeys) {
      if (formData.metadata[key] !== initialData.metadata[key]) return true;
    }

    // Check assets count
    if (formData.assets.length !== initialData.assets.length) return true;

    return false;
  }, [initialData, formData]);

  // Window beforeunload safeguard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes that will be lost.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Authorization check
  const isAuthorizedToEdit = useMemo(() => {
    if (!session?.user) return false;
    if (session.user.isAdmin) return true;
    if (projectRecord?.creatorId && session.user.id === projectRecord.creatorId) return true;
    if (projectRecord?.userRole === "Owner") return true;
    return false;
  }, [session, projectRecord]);

  // Handle Form Change
  const handleFormChange = (fields: Partial<EditProjectFormData>) => {
    setFormData((prev) => (prev ? { ...prev, ...fields } : null));
    if (fields.title && fields.title.trim().length >= 2) {
      setTitleError(null);
    }
  };

  // Handle Metadata Field Change
  const handleMetadataChange = (key: string, value: any) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          [key]: value,
        },
      };
    });
  };

  // Handle Cover Change
  const handleCoverChange = (url: string, assetId?: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        coverImageUrl: url,
        coverAssetId: assetId,
      };
    });
    showToast(url ? "Cover artwork updated" : "Cover reset to category default", "info");
  };

  // Handle Asset Added
  const handleAssetAdded = (newAsset: ProjectAsset) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        assets: [newAsset, ...prev.assets],
      };
    });
    showToast(`Asset "${newAsset.fileName}" uploaded successfully`, "success");
  };

  // Handle Asset Removed
  const handleAssetRemoved = (assetId: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        assets: prev.assets.filter((a) => a.id !== assetId),
      };
    });
    showToast("Asset attachment removed", "info");
  };

  // Handle Cancel / Return
  const handleCancel = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true);
    } else {
      router.push(`/projects/${projectId}`);
    }
  };

  // Discard edits
  const handleConfirmDiscard = () => {
    setIsDiscardModalOpen(false);
    if (initialData) {
      setFormData(initialData);
    }
    router.push(`/projects/${projectId}`);
  };

  // Handle Save Changes
  const handleSaveChanges = async () => {
    if (!formData || isSubmitting) return;

    // Validate title
    const cleanTitle = formData.title.trim();
    if (!cleanTitle || cleanTitle.length < 2) {
      setTitleError("Title must be at least 2 characters long.");
      showToast("Please enter a valid title (minimum 2 characters).", "error");
      return;
    }
    if (cleanTitle.length > 120) {
      setTitleError("Title cannot exceed 120 characters.");
      showToast("Title is too long.", "error");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Assemble unified metadata object
      const mergedMetadata: Record<string, any> = {
        ...formData.metadata,
      };

      if (formData.caption.trim()) {
        mergedMetadata.caption = formData.caption.trim();
      } else {
        delete mergedMetadata.caption;
      }

      if (formData.coverImageUrl.trim()) {
        mergedMetadata.previewImageUrl = formData.coverImageUrl.trim();
        mergedMetadata.coverImageUrl = formData.coverImageUrl.trim();
      } else {
        delete mergedMetadata.previewImageUrl;
        delete mergedMetadata.coverImageUrl;
      }

      if (formData.coverAssetId) {
        mergedMetadata.coverAssetId = formData.coverAssetId;
      } else {
        delete mergedMetadata.coverAssetId;
      }

      // Execute PATCH to update the existing project record
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          description: formData.description.trim() || null,
          category: formData.category.trim(),
          status: formData.status,
          visibility: formData.visibility,
          tags: formData.tags,
          metadata: mergedMetadata,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update project settings");
      }

      // Update initial data to current to clear dirty state
      setInitialData(formData);

      showToast("Exhibition changes saved successfully!", "success");

      // Smoothly navigate back to the updated exhibition presentation
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save project updates");
      showToast(err.message || "Error saving changes. Please check inputs.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Project Deletion (Owner only)
  const handleDeleteProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to delete project");
      }

      showToast("Project deleted successfully.", "info");
      router.push("/dashboard");
    } catch (err: any) {
      showToast(err.message || "Failed to delete project.", "error");
    }
  };

  // 1. Loading State
  if (isLoading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-[#203B35] text-[#FAF8F3] flex items-center justify-center shadow-lg animate-pulse">
          <CelestialSpark className="w-6 h-6 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-serif italic text-[#203B35] font-semibold">
            Loading Creative Workspace...
          </h2>
          <p className="text-xs font-mono text-[#5D635F]">
            Prepopulating project details & media assets
          </p>
        </div>
      </div>
    );
  }

  // 2. Authentication Required State
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 p-8 text-center shadow-xl space-y-5">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-serif italic text-[#203B35] font-semibold">
              Authentication Required
            </h2>
            <p className="text-xs text-[#5D635F] leading-relaxed">
              Please sign in to modify previously published creative works.
            </p>
          </div>
          <Link
            href={`/login?callbackUrl=/projects/${projectId}/edit`}
            className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] transition-colors shadow-sm"
          >
            Sign In to Edit Work
          </Link>
        </div>
      </div>
    );
  }

  // 3. Unauthorized / Access Denied State
  if (projectRecord && !isAuthorizedToEdit) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 p-8 text-center shadow-xl space-y-5">
          <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-serif italic text-[#203B35] font-semibold">
              Access Restricted
            </h2>
            <p className="text-xs text-[#5D635F] leading-relaxed">
              Only the project owner (@{projectRecord.creator?.username}) or an authorized administrator can modify this creative work.
            </p>
          </div>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] transition-colors shadow-sm"
          >
            Return to Work Exhibition
          </Link>
        </div>
      </div>
    );
  }

  // 4. Project Not Found State
  if (!formData || !projectRecord) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 p-8 text-center shadow-xl space-y-5">
          <div className="h-12 w-12 rounded-2xl bg-[#EFECE2] text-[#5D635F] flex items-center justify-center mx-auto">
            <FileBox className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-serif italic text-[#203B35] font-semibold">
              Work Not Found
            </h2>
            <p className="text-xs text-[#5D635F]">
              The requested creative project could not be found or has been removed.
            </p>
          </div>
          <Link
            href="/feed"
            className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] transition-colors"
          >
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#282B2A] flex flex-col pb-28">
      {/* ============================================================ */}
      {/* 1. TOP STICKY NAVIGATION BAR                                 */}
      {/* ============================================================ */}
      <ProjectEditNav
        projectId={projectId}
        projectTitle={formData.title}
        category={formData.category}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onCancel={handleCancel}
        onSave={handleSaveChanges}
        onTogglePreview={() => setIsPreviewOpen(!isPreviewOpen)}
        isPreviewOpen={isPreviewOpen}
        canSave={formData.title.trim().length >= 2}
      />

      {/* Floating Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-medium border backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-950/90 text-emerald-100 border-emerald-500/30"
                : toast.type === "error"
                ? "bg-rose-950/90 text-rose-100 border-rose-500/30"
                : "bg-[#203B35]/95 text-[#FAF8F3] border-white/20"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#9DB5A5] shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Update Error</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Structured 2-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Main Content Editor (Title, Caption, Description, Specs, Tags) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <MainContentEditor
              formData={formData}
              onChange={handleFormChange}
              onMetadataChange={handleMetadataChange}
              titleError={titleError}
            />
          </div>

          {/* Right Column: Media Management & Publishing Settings Panels */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8">
            {/* Media Management Panel (Cover Image & Assets Gallery) */}
            <MediaManagementPanel
              projectId={projectId}
              category={formData.category}
              coverImageUrl={formData.coverImageUrl}
              coverAssetId={formData.coverAssetId}
              assets={formData.assets}
              onCoverChange={handleCoverChange}
              onAssetAdded={handleAssetAdded}
              onAssetRemoved={handleAssetRemoved}
              isBusy={isSubmitting}
            />

            {/* Publishing Settings Panel (Visibility & Stage) */}
            <PublishingSettingsPanel
              projectId={projectId}
              visibility={formData.visibility}
              status={formData.status}
              createdAt={projectRecord.createdAt}
              updatedAt={projectRecord.updatedAt}
              creatorName={projectRecord.creator?.displayName || "Creator"}
              creatorUsername={projectRecord.creator?.username || "creator"}
              isOwner={session?.user?.id === projectRecord.creatorId}
              onVisibilityChange={(v) => handleFormChange({ visibility: v })}
              onStatusChange={(s) => handleFormChange({ status: s })}
              onDeleteProject={session?.user?.id === projectRecord.creatorId ? handleDeleteProject : undefined}
              isBusy={isSubmitting}
            />
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 2. STICKY BOTTOM SAVE ACTION BAR                             */}
      {/* ============================================================ */}
      <aside
        aria-label="Save changes bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F3]/95 backdrop-blur-md border-t border-[#203B35]/12 p-3 sm:p-4 shadow-[0_-2px_12px_rgba(32,59,53,0.06)]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>You have unsaved edits</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ready & in sync</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full border border-[#203B35]/20 bg-white text-xs font-semibold text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#203B35] border border-[#203B35]/20 text-xs font-semibold hover:bg-[#F6F3EB] transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSubmitting || formData.title.trim().length < 2}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#203B35] hover:bg-[#162A26] text-xs font-semibold text-[#FAF8F3] shadow-md transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Work...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#9DB5A5]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 3. LIVE EXHIBITION PREVIEW MODAL                             */}
      {/* ============================================================ */}
      <ProjectLivePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        formData={formData}
        creator={{
          displayName: projectRecord.creator?.displayName || "Creator",
          username: projectRecord.creator?.username || "creator",
          avatarUrl: projectRecord.creator?.avatarUrl,
        }}
        onSave={handleSaveChanges}
        isSubmitting={isSubmitting}
      />

      {/* ============================================================ */}
      {/* 4. DISCARD CHANGES CONFIRMATION MODAL                        */}
      {/* ============================================================ */}
      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard Unsaved Changes?"
        message="You have modified project content, categories, tags, or media attachments. Leaving now will permanently discard these edits."
        confirmLabel="Discard & Leave"
        cancelLabel="Keep Editing"
        variant="warning"
      />
    </div>
  );
}
