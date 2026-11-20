"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FolderKanban,
  FileBox,
  GitBranch,
  MessageSquare,
  Users,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Download,
  Trash2,
  Send,
  Eye,
  Award,
  Heart,
  Plus,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Music as MusicIcon,
  Video as VideoIcon,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ThreadedCommentsSection } from "@/components/discussions/ThreadedCommentsSection";
import { ProjectStatus, Visibility, CollaboratorRole, VersionStatus } from "@prisma/client";

export default function ProjectWorkspacePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const tabParam = searchParams.get("tab");
  const versionIdParam = searchParams.get("versionId");
  const commentIdParam = searchParams.get("commentId");

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "versions" | "collaborators">(
    tabParam === "versions" || tabParam === "assets" || tabParam === "collaborators"
      ? tabParam
      : "overview"
  );

  // Assets Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Version Review State
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionNotes, setNewVersionNotes] = useState("");
  const [selectedAssetIdsForVersion, setSelectedAssetIdsForVersion] = useState<string[]>([]);
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);

  // Review (Approve/Reject) Modal State
  const [reviewAction, setReviewAction] = useState<"Approved" | "Rejected" | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Comment State
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Collaborator Invite State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>(CollaboratorRole.Collaborator);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Portfolio Publishing
  const [isPublishingPortfolio, setIsPublishingPortfolio] = useState(false);
  const [portfolioSuccessMsg, setPortfolioSuccessMsg] = useState<string | null>(null);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to load project");
        return;
      }

      setProject(data.data);
      if (data.data.versions && data.data.versions.length > 0 && !selectedVersionId) {
        const matchedParamVersion =
          versionIdParam &&
          data.data.versions.find((v: any) => v.id === versionIdParam);
        setSelectedVersionId(
          matchedParamVersion ? matchedParamVersion.id : data.data.versions[0].id
        );
      }
    } catch (e) {
      setError("Network error loading workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Toggle Like
  const handleToggleLike = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/projects/${projectId}`);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setProject((prev: any) => ({
          ...prev,
          hasLiked: data.data.liked,
          _count: {
            ...prev._count,
            likes: data.data.totalLikes,
          },
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Direct-to-Storage Upload Flow per TRD Section 10
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      // Step 1 & 2: Request signed upload URL from server
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
        throw new Error(urlData.error?.message || "Failed to obtain upload URL");
      }

      const { uploadUrl, storagePath, uploadToken } = urlData.data;
      setUploadProgress(40);

      // Step 3: Browser uploads directly to Supabase Storage using signed URL
      const storageUploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!storageUploadRes.ok) {
        throw new Error(`Direct storage upload failed (${storageUploadRes.status})`);
      }

      setUploadProgress(80);

      // Step 4: Record asset metadata in PostgreSQL with server-signed upload ownership proof
      const confirmRes = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          versionId: selectedVersionId || null,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          storagePath,
          uploadToken,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(confirmData.error?.message || "Failed to record asset metadata");
      }

      setUploadProgress(100);
      await fetchProject();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchProject();
      } else {
        alert(data.error?.message || "Failed to delete asset");
      }
    } catch (e) {
      alert("Error deleting asset");
    }
  };

  // Create New Version
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVersion(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetIds: selectedAssetIdsForVersion,
          notes: newVersionNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewVersionModalOpen(false);
        setNewVersionNotes("");
        setSelectedAssetIdsForVersion([]);
        await fetchProject();
        setSelectedVersionId(data.data.id);
      } else {
        alert(data.error?.message || "Failed to create draft version");
      }
    } catch (e) {
      alert("Error creating version");
    } finally {
      setIsSubmittingVersion(false);
    }
  };

  // Submit Version Review (Approve/Reject)
  const handleReviewVersion = async () => {
    if (!selectedVersionId || !reviewAction) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${selectedVersionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewAction,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewAction(null);
        setReviewComment("");
        await fetchProject();
      } else {
        alert(data.error?.message || "Failed to review version");
      }
    } catch (e) {
      alert("Error submitting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Post Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentContent,
          versionId: activeTab === "versions" ? selectedVersionId : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentContent("");
        await fetchProject();
      } else {
        alert(data.error?.message || "Failed to post comment");
      }
    } catch (e) {
      alert("Error posting comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Invite Collaborator
  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdentifier: inviteIdentifier,
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsInviteModalOpen(false);
        setInviteIdentifier("");
        await fetchProject();
      } else {
        setInviteError(data.error?.message || "Failed to invite user");
      }
    } catch (e) {
      setInviteError("Network error inviting collaborator");
    } finally {
      setIsInviting(false);
    }
  };

  // Remove Accepted Collaborator (or self-leave)
  const handleRemoveCollaborator = async (userId: string, isSelf = false) => {
    const promptMsg = isSelf
      ? "Are you sure you want to leave this project workspace?"
      : "Are you sure you want to remove this collaborator? Their workspace access will be revoked immediately.";
    if (!confirm(promptMsg)) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (isSelf) {
          router.push("/dashboard");
        } else {
          await fetchProject();
        }
      } else {
        alert(data.error?.message || "Failed to remove collaborator");
      }
    } catch {
      alert("Error removing collaborator");
    }
  };

  // Cancel Pending Invitation (Owner only; never removes accepted members)
  const handleCancelInvitation = async (userId: string) => {
    if (!confirm("Cancel this pending project invitation?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProject();
      } else {
        alert(data.error?.message || "Failed to cancel invitation");
      }
    } catch {
      alert("Error cancelling invitation");
    }
  };

  // Change Accepted Collaborator Role (Owner only; Collaborator <-> ClientReviewer)
  const handleChangeCollaboratorRole = async (
    userId: string,
    newRole: CollaboratorRole
  ) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProject();
      } else {
        alert(data.error?.message || "Failed to update collaborator role");
      }
    } catch {
      alert("Error updating collaborator role");
    }
  };

  // Add Project to Portfolio (BUS-R4, BUS-R5)
  const handlePublishToPortfolio = async () => {
    setIsPublishingPortfolio(true);
    setPortfolioSuccessMsg(null);
    try {
      const res = await fetch("/api/portfolio/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          featured: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPortfolioSuccessMsg("Project is now featured in your public Portfolio!");
        await fetchProject();
      } else {
        alert(data.error?.message || "Failed to add to portfolio");
      }
    } catch (e) {
      alert("Error publishing to portfolio");
    } finally {
      setIsPublishingPortfolio(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <LoadingSpinner className="w-10 h-10 text-violet-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex-1 max-w-xl mx-auto py-20 px-4">
        <ErrorState
          title="Project Workspace Inaccessible"
          message={error || "You do not have permission to view this project."}
          onRetry={fetchProject}
        />
      </div>
    );
  }

  const isOwner = project.userRole === "Owner";
  const isCollaborator = project.userRole === "Collaborator";
  const isReviewer = project.userRole === "ClientReviewer";
  const isMember = isOwner || isCollaborator || isReviewer;
  const isAuthenticated = Boolean(session?.user?.id);
  const canUploadAssets = isOwner || isCollaborator;
  const canCreateVersions = isOwner || isCollaborator;
  const canReviewVersions = isOwner || isReviewer;

  const currentVersion = project.versions?.find((v: any) => v.id === selectedVersionId) || project.versions?.[0];

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Workspace Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                {project.category} Workspace
              </span>
              <span className="text-slate-600">•</span>
              <Badge variant="role" role={project.userRole} />
              <Badge variant="status" status={project.status} />
              <Badge variant="visibility" visibility={project.visibility} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.title}
            </h1>

            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Created by{" "}
              <Link
                href={`/profile/${project.creator.username}`}
                className="text-slate-300 font-semibold hover:text-violet-400"
              >
                {project.creator.displayName} (@{project.creator.username})
              </Link>{" "}
              on {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleLike}
              className={`gap-1.5 ${project.hasLiked ? "text-rose-400 border-rose-800" : ""}`}
            >
              <Heart className={`w-4 h-4 ${project.hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>{project._count?.likes || 0}</span>
            </Button>

            {isOwner && project.status === "Completed" && project.visibility === "Public" && (
              <Button
                variant={project.isPortfolioFeatured ? "secondary" : "primary"}
                size="sm"
                className="gap-1.5"
                isLoading={isPublishingPortfolio}
                onClick={handlePublishToPortfolio}
                disabled={project.isPortfolioFeatured}
              >
                <Award className="w-4 h-4 text-amber-400" />
                {project.isPortfolioFeatured ? "Showcased in Portfolio" : "Publish to Portfolio"}
              </Button>
            )}

            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
                className="gap-1.5"
              >
                <Users className="w-4 h-4 text-indigo-400" />
                Invite
              </Button>
            )}
          </div>
        </div>

        {portfolioSuccessMsg && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-800 bg-emerald-950/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{portfolioSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Role-Adaptive Workspace Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-8 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "overview"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FolderKanban className="w-4 h-4 text-violet-400" />
          Overview & Metadata
        </button>

        <button
          onClick={() => setActiveTab("assets")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "assets"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileBox className="w-4 h-4 text-cyan-400" />
          Assets & Media ({project.assets?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("versions")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "versions"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitBranch className="w-4 h-4 text-purple-400" />
          Draft Versions & Review ({project.versions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("collaborators")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "collaborators"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          Collaborators ({project.collaborators?.length || 1})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & HYBRID METADATA */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Concept & Scope</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>{project.description || "No detailed description provided."}</p>

                {/* Project Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-slate-400 block mb-2">
                      Categorization Tags:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((t: string) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-300 font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discipline-Specific Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-violet-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  {project.category} Discipline Technical Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.metadata && Object.keys(project.metadata).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(project.metadata).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3 rounded-lg border border-slate-800 bg-slate-950/60"
                      >
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          {key}
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5 block truncate">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No custom metadata configured for this {project.category} project.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Internal Project-Level Discussion (Strictly Authorized Members Only) */}
            {isMember ? (
              <Card>
                <CardContent className="pt-6">
                  <ThreadedCommentsSection
                    projectId={projectId}
                    scope="project"
                    canPost={isAuthenticated && isMember}
                    isAuthenticated={isAuthenticated}
                    currentUserId={session?.user?.id || null}
                    isAdmin={Boolean(session?.user?.isAdmin)}
                    highlightedCommentId={activeTab === "overview" ? commentIdParam : null}
                    title="Workspace Discussion"
                    subtitle="Internal project-level discussion separated from version review feedback."
                    badgeText="Members Only"
                    emptyMessage="No project-level discussion threads yet. Start a conversation with your team below."
                    placeholder="Start a project-level discussion thread..."
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-violet-400" />
                      Community Feedback
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Internal workspace discussions are private to project members. Browse the versions tab to leave feedback on published or open drafts.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab("versions")}
                    className="shrink-0"
                  >
                    View Versions &amp; Feedback
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar / Quick Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-400">
                  Workspace Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                    {project.creator.displayName.charAt(0)}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-semibold text-white truncate">
                      {project.creator.displayName}
                    </p>
                    <p className="text-[11px] text-slate-400">@{project.creator.username}</p>
                  </div>
                  <Badge variant="role" role="Owner" />
                </div>

                {project.collaborators
                  ?.filter((c: any) => c.userId !== project.creatorId)
                  .map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {c.user.displayName.charAt(0)}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-semibold text-white truncate">
                          {c.user.displayName}
                        </p>
                        <p className="text-[11px] text-slate-400">@{c.user.username}</p>
                      </div>
                      <Badge variant="role" role={c.role} />
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: ASSETS & MEDIA */}
      {activeTab === "assets" && (
        <div className="space-y-6">
          {/* Uploader Section */}
          {canUploadAssets && (
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-8 text-center hover:border-violet-500/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-violet-950/60 flex items-center justify-center text-violet-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Upload Creative Asset
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Direct-to-storage signed uploads. Supported: Images, Audio, Video, Design Files, Archives up to 50MB.
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                  size="sm"
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Select File to Upload
                </Button>
              </div>

              {isUploading && (
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Uploading directly to storage... {uploadProgress}%
                  </span>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-rose-400 mt-3 font-medium">{uploadError}</p>
              )}
            </div>
          )}

          {/* Asset List Grid */}
          {project.assets?.length === 0 ? (
            <EmptyState
              icon={<FileBox className="w-10 h-10 text-slate-600" />}
              title="No assets uploaded yet"
              description="Upload reference sketches, audio stems, RAW images, or documents to store them in your project workspace."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {project.assets.map((asset: any) => {
                const isImage = asset.mimeType.startsWith("image/");
                const isAudio = asset.mimeType.startsWith("audio/");
                const isVideo = asset.mimeType.startsWith("video/");

                return (
                  <div
                    key={asset.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-violet-400">
                          {isImage && <ImageIcon className="w-4 h-4" />}
                          {isAudio && <MusicIcon className="w-4 h-4" />}
                          {isVideo && <VideoIcon className="w-4 h-4" />}
                          {!isImage && !isAudio && !isVideo && <FileText className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {(asset.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1 mb-1" title={asset.fileName}>
                        {asset.fileName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        Uploaded by @{asset.uploader.username}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-3">
                      <span className="text-[10px] text-slate-500">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        {canUploadAssets && (
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DRAFT VERSIONS & REVIEW FEEDBACK */}
      {activeTab === "versions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Draft Version History & Client Approvals</h3>
              <p className="text-xs text-slate-400">
                Track iterative deliverables, review feedback, and official approvals per PRD Section 19 & 20.
              </p>
            </div>

            {canCreateVersions && (
              <Button
                onClick={() => setIsNewVersionModalOpen(true)}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Draft Version
              </Button>
            )}
          </div>

          {project.versions?.length === 0 ? (
            <EmptyState
              icon={<GitBranch className="w-10 h-10 text-slate-600" />}
              title="No draft versions created yet"
              description="Bundle assets into a sequential draft (v1, v2) to initiate the client review and approval cycle."
              actionLabel={canCreateVersions ? "Create Version 1" : undefined}
              onAction={() => setIsNewVersionModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Version Selector List */}
              <div className="space-y-2 lg:col-span-1">
                {project.versions.map((ver: any) => (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedVersionId === ver.id
                        ? "border-violet-500 bg-violet-950/30 shadow-sm"
                        : "border-slate-800 bg-slate-900/40 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">
                        Version {ver.versionNumber}
                      </span>
                      <Badge variant="version" versionStatus={ver.status} />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      By @{ver.createdBy.username} • {new Date(ver.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>

              {/* Version Detail & Review Controls */}
              <div className="lg:col-span-3 space-y-6">
                {currentVersion ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">
                            Version {currentVersion.versionNumber} Deliverable
                          </h3>
                          <Badge variant="version" versionStatus={currentVersion.status} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Created on {new Date(currentVersion.createdAt).toLocaleString()} by @{currentVersion.createdBy.username}
                        </p>
                      </div>

                      {/* Client / Owner Review Controls (PR-013) */}
                      {canReviewVersions && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            className="gap-1"
                            onClick={() => setReviewAction("Approved")}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="gap-1"
                            onClick={() => setReviewAction("Rejected")}
                          >
                            <XCircle className="w-4 h-4" />
                            Request Revisions
                          </Button>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6">
                      {/* Assets tied to this version */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                          Assets in this Draft ({currentVersion.assets?.length || 0})
                        </h4>
                        {currentVersion.assets?.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No assets specifically assigned to this version.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentVersion.assets.map((a: any) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs"
                              >
                                <span className="font-medium text-white truncate max-w-[200px]">
                                  {a.fileName}
                                </span>
                                <span className="text-slate-500 text-[10px]">
                                  {(a.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Threaded Version Feedback Comments (strictly scoped to currentVersion.id) */}
                      <div className="border-t border-slate-800 pt-6">
                        <ThreadedCommentsSection
                          key={currentVersion.id}
                          projectId={projectId}
                          scope="version"
                          versionId={currentVersion.id}
                          canPost={
                            isAuthenticated &&
                            (isMember ||
                              (project.visibility === Visibility.Public &&
                                currentVersion.status !== VersionStatus.Rejected))
                          }
                          isAuthenticated={isAuthenticated}
                          currentUserId={session?.user?.id || null}
                          isAdmin={Boolean(session?.user?.isAdmin)}
                          highlightedCommentId={activeTab === "versions" ? commentIdParam : null}
                          title={`Version ${currentVersion.versionNumber} Feedback`}
                          subtitle="Threaded review feedback specific to this version."
                          emptyMessage="No feedback comments left on this version yet."
                          placeholder={`Leave review feedback on Version ${currentVersion.versionNumber}...`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COLLABORATORS & ROLES */}
      {activeTab === "collaborators" && (() => {
        const allNonOwnerRecords = (project.collaborators || []).filter(
          (c: any) => c.userId !== project.creatorId
        );
        const acceptedMembers = allNonOwnerRecords.filter(
          (c: any) => (c.status ? c.status === "Accepted" : c.acceptedAt !== null)
        );
        const pendingInvites = allNonOwnerRecords.filter(
          (c: any) => (c.status ? c.status === "Pending" : c.acceptedAt === null)
        );

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Project Members &amp; Access Matrix</h3>
                <p className="text-xs text-slate-400">
                  Manage active project roles (Owner, Collaborator, ClientReviewer). Pending invitees receive no workspace access until they accept.
                </p>
              </div>

              {isOwner && (
                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  size="sm"
                  className="gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Invite Collaborator
                </Button>
              )}
            </div>

            {/* Active Project Members Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Member</th>
                    <th className="px-6 py-3">Assigned Role</th>
                    <th className="px-6 py-3">Permissions Scope</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {/* Owner Row */}
                  <tr>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white shrink-0">
                          {project.creator.displayName.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={`/profile/${project.creator.username}`}
                            className="font-semibold text-white hover:text-violet-300"
                          >
                            {project.creator.displayName}
                          </Link>
                          <p className="text-slate-400 font-mono">@{project.creator.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="role" role="Owner" />
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      Full control (settings, delete, invite, upload, approve, designate FINAL, portfolio)
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">Primary Owner</td>
                  </tr>

                  {/* Accepted Collaborators Rows */}
                  {acceptedMembers.map((c: any) => {
                    const isSelfRow = Boolean(session?.user?.id && session.user.id === c.userId);
                    return (
                      <tr key={c.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white shrink-0">
                              {c.user.displayName.charAt(0)}
                            </div>
                            <div>
                              <Link
                                href={`/profile/${c.user.username}`}
                                className="font-semibold text-white hover:text-violet-300"
                              >
                                {c.user.displayName}
                              </Link>
                              <p className="text-slate-400 font-mono">@{c.user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isOwner ? (
                            <select
                              value={c.role}
                              onChange={(e) =>
                                handleChangeCollaboratorRole(
                                  c.userId,
                                  e.target.value as CollaboratorRole
                                )
                              }
                              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                            >
                              <option value={CollaboratorRole.Collaborator}>Collaborator</option>
                              <option value={CollaboratorRole.ClientReviewer}>ClientReviewer</option>
                            </select>
                          ) : (
                            <Badge variant="role" role={c.role} />
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {c.role === "Collaborator"
                            ? "Upload assets, create draft versions, project discussions & feedback"
                            : "View unpublished versions, approve/reject drafts, discussions & feedback"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isOwner ? (
                            <button
                              onClick={() => handleRemoveCollaborator(c.userId, false)}
                              className="text-rose-400 hover:text-rose-300 font-medium"
                            >
                              Remove
                            </button>
                          ) : isSelfRow ? (
                            <button
                              onClick={() => handleRemoveCollaborator(c.userId, true)}
                              className="text-rose-400 hover:text-rose-300 font-medium"
                            >
                              Leave Project
                            </button>
                          ) : (
                            <span className="text-slate-500">Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pending Invitations Section (Owner Only) */}
            {isOwner && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Pending Invitations ({pendingInvites.length})
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Invited users have zero access to private workspace data until they accept from their dashboard.
                    </p>
                  </div>
                </div>

                {pendingInvites.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    No pending invitations for this project.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {pendingInvites.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-950/70 border border-amber-800/60 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0">
                            {inv.user.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/profile/${inv.user.username}`}
                                className="text-xs font-semibold text-white hover:text-violet-300"
                              >
                                {inv.user.displayName}
                              </Link>
                              <span className="text-[11px] font-mono text-slate-500">
                                @{inv.user.username}
                              </span>
                              <Badge variant="role" role={inv.role} />
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60">
                                Pending
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Invited {new Date(inv.invitedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvitation(inv.userId)}
                          className="text-xs text-slate-300 hover:text-rose-300 hover:border-rose-500/40 self-end sm:self-center"
                        >
                          Cancel Invitation
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* New Draft Version Modal */}
      <Modal
        isOpen={isNewVersionModalOpen}
        onClose={() => setIsNewVersionModalOpen(false)}
        title="Create New Draft Version"
        description="Bundle project assets into an official sequential revision for client review."
      >
        <form onSubmit={handleCreateVersion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Assets to include in this draft
            </label>
            {project.assets?.length === 0 ? (
              <p className="text-xs text-slate-500">
                No assets uploaded yet. You can still create a draft version with revision notes.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-800 rounded-lg p-2 bg-slate-950/60">
                {project.assets.map((a: any) => {
                  const isChecked = selectedAssetIdsForVersion.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className="flex items-center gap-2 text-xs text-slate-300 p-1.5 hover:bg-slate-900 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedAssetIdsForVersion((prev) =>
                            isChecked ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                          );
                        }}
                        className="rounded border-slate-700 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="truncate">{a.fileName}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Revision Notes & Deliverable Changelog
            </label>
            <textarea
              rows={3}
              placeholder="E.g., Updated color palette, tightened rhythm stem, fixed character linework..."
              value={newVersionNotes}
              onChange={(e) => setNewVersionNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNewVersionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingVersion}>
              Publish Draft
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve / Reject Review Modal */}
      <Modal
        isOpen={!!reviewAction}
        onClose={() => setReviewAction(null)}
        title={reviewAction === "Approved" ? "Approve Draft Version" : "Request Revisions (Reject)"}
        description={
          reviewAction === "Approved"
            ? "Sign off on this deliverable. The creator will be notified of your approval."
            : "Specify changes needed before final sign-off. The creator will receive your revision feedback."
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Review Comments
            </label>
            <textarea
              rows={3}
              placeholder={
                reviewAction === "Approved"
                  ? "Great work! Colors and composition match the creative brief perfectly."
                  : "Please adjust the background contrast and re-export the master file..."
              }
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setReviewAction(null)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === "Approved" ? "success" : "danger"}
              onClick={handleReviewVersion}
              isLoading={isSubmittingReview}
            >
              Confirm {reviewAction}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Collaborator Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Collaborator to Workspace"
        description="Grant role-based access to creative peers or client reviewers."
      >
        <form onSubmit={handleInviteCollaborator} className="space-y-4">
          {inviteError && (
            <div className="p-3 rounded-lg border border-rose-800 bg-rose-950/40 text-xs text-rose-300">
              {inviteError}
            </div>
          )}

          <Input
            label="Email or Username"
            placeholder="collaborator@example.com or username"
            value={inviteIdentifier}
            onChange={(e) => setInviteIdentifier(e.target.value)}
            required
            helperText="The user must have an active CreativeSpace account."
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value={CollaboratorRole.Collaborator}>
                Collaborator (Can upload assets & create draft versions)
              </option>
              <option value={CollaboratorRole.ClientReviewer}>
                Client / Reviewer (Can view drafts, comment & Approve/Reject)
              </option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isInviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
