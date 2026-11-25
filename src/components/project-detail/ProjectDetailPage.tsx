"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Share2,
} from "lucide-react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { EXPLORE_PROJECTS } from "@/components/explore/exploreData";

import {
  ProjectDetailData,
  ProjectAsset,
  ProjectVersion,
  getCategoryArtwork,
} from "./projectTypes";
import { ProjectDetailNav } from "./ProjectDetailNav";
import { ProjectHeroPresentation } from "./ProjectHeroPresentation";
import { ProjectSocialActions } from "./ProjectSocialActions";
import { ProjectMetadataSection } from "./ProjectMetadataSection";
import { ProjectVersionTimeline } from "./ProjectVersionTimeline";
import { ProjectCreatorSection } from "./ProjectCreatorSection";
import { ProjectCollaborationSection } from "./ProjectCollaborationSection";
import { ProjectFeedbackSection } from "./ProjectFeedbackSection";
import { ProjectRelatedWorks } from "./ProjectRelatedWorks";
import { ProjectMediaLightbox } from "./ProjectMediaLightbox";
import { ProjectStudioModals } from "./ProjectStudioModals";

export function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const projectId = params.id as string;
  const versionIdParam = searchParams.get("versionId");

  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Version for exploration
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Social & Follow State
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowingCreator, setIsFollowingCreator] = useState(false);
  const [isFollowBusy, setIsFollowBusy] = useState(false);

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "accepted">("none");
  const [isConnectBusy, setIsConnectBusy] = useState(false);

  // Portfolio Publishing State
  const [isPublishingPortfolio, setIsPublishingPortfolio] = useState(false);

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Studio Modals State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("info");

  // Scrollspy for top nav follow bar
  const [showFollowInNav, setShowFollowInNav] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string, type: "success" | "info" = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Fetch Project Details with signed assets
  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch project from backend API
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const rawProj = json.data;

        // 2. Fetch enriched assets with signed download URLs
        let enrichedAssets: ProjectAsset[] = rawProj.assets || [];
        try {
          const assetsRes = await fetch(`/api/projects/${projectId}/assets`);
          const assetsJson = await assetsRes.json();
          if (assetsRes.ok && assetsJson.success && Array.isArray(assetsJson.data)) {
            enrichedAssets = assetsJson.data;
          }
        } catch {
          // Fallback to raw assets
        }

        // Merge signed URLs into versions
        const versionsWithSignedAssets: ProjectVersion[] = (rawProj.versions || []).map(
          (v: any) => ({
            ...v,
            assets: enrichedAssets.filter((a) => a.versionId === v.id),
          })
        );

        const projectData: ProjectDetailData = {
          ...rawProj,
          assets: enrichedAssets,
          versions: versionsWithSignedAssets,
          tags: rawProj.tags || (rawProj.projectTags?.map((pt: any) => pt.tag.name) ?? []),
          hasLiked: Boolean(rawProj.hasLiked),
          _count: {
            likes: rawProj._count?.likes ?? 0,
            comments: rawProj.comments?.length ?? 0,
          },
        };

        setProject(projectData);
        setHasLiked(Boolean(rawProj.hasLiked));
        setLikeCount(rawProj._count?.likes ?? 0);

        // Check if initial versionId is provided in URL
        if (versionIdParam) {
          const matched = projectData.versions.find((v) => v.id === versionIdParam);
          if (matched) {
            setSelectedVersionId(matched.id);
          }
        }

        // Fetch follow status of creator
        if (session?.user?.id && rawProj.creator?.id) {
          try {
            const followRes = await fetch(`/api/users/${rawProj.creator.id}/follow`);
            const followJson = await followRes.json();
            if (followRes.ok && followJson.success) {
              setIsFollowingCreator(Boolean(followJson.data?.isFollowing));
            }
          } catch {
            // Non-critical
          }
        }
      } else {
        // Fallback: If 404 or mock explore item was clicked (e.g. proj-1, proj-2, etc.)
        const exploreMatch = EXPLORE_PROJECTS.find((p) => p.id === projectId);
        if (exploreMatch) {
          const fallbackAssets: ProjectAsset[] = [
            {
              id: `asset-${exploreMatch.id}`,
              projectId: exploreMatch.id,
              versionId: `v1-${exploreMatch.id}`,
              fileName: `${exploreMatch.title}.jpg`,
              mimeType: "image/jpeg",
              fileSize: 3450000,
              downloadUrl: exploreMatch.coverImage,
              createdAt: new Date().toISOString(),
            },
          ];

          const fallbackVersions: ProjectVersion[] = [
            {
              id: `v1-${exploreMatch.id}`,
              projectId: exploreMatch.id,
              versionNumber: 1,
              status: "Final",
              createdAt: new Date().toISOString(),
              createdById: exploreMatch.creator.id,
              notes: exploreMatch.editionNote || "Exhibition Master Final",
              assets: fallbackAssets,
            },
          ];

          const synthesizedProject: ProjectDetailData = {
            id: exploreMatch.id,
            title: exploreMatch.title,
            description: exploreMatch.description || null,
            category: exploreMatch.category,
            status: "Completed",
            visibility: "Public",
            metadata: {
              edition: exploreMatch.editionNote,
              views: exploreMatch.views,
              published: exploreMatch.publishedAt,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            creatorId: exploreMatch.creator.id,
            creator: {
              id: exploreMatch.creator.id,
              username: exploreMatch.creator.username,
              displayName: exploreMatch.creator.displayName,
              avatarUrl: exploreMatch.creator.avatarUrl || null,
              bio: exploreMatch.creator.specialty || "Independent creative practitioner on CreativeSpace.",
              disciplines: [exploreMatch.category],
            },
            collaborators: [],
            assets: fallbackAssets,
            versions: fallbackVersions,
            tags: exploreMatch.tags || [],
            hasLiked: exploreMatch.hasLiked || false,
            _count: {
              likes: exploreMatch.likes || 0,
              comments: 0,
            },
          };

          setProject(synthesizedProject);
          setHasLiked(Boolean(exploreMatch.hasLiked));
          setLikeCount(exploreMatch.likes || 0);
          setIsBookmarked(Boolean(exploreMatch.hasBookmarked));
        } else {
          setError(json.error?.message || "Creative project not found or inaccessible.");
        }
      }
    } catch {
      setError("Network error loading creative project.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, versionIdParam, session?.user?.id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Check saved bookmarks from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && projectId) {
      try {
        const saved = JSON.parse(
          localStorage.getItem("creativespace_saved_projects") || "[]"
        );
        if (Array.isArray(saved) && saved.includes(projectId)) {
          setIsBookmarked(true);
        }
      } catch {
        // Safe ignore
      }
    }
  }, [projectId]);

  // Scrollspy to reveal follow bar in navigation
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        // If bottom of hero passes above header
        setShowFollowInNav(rect.bottom < 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/projects/${projectId}`);
      return;
    }

    const nextLiked = !hasLiked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    // Optimistic update
    setHasLiked(nextLiked);
    setLikeCount(nextCount);

    showToast(
      nextLiked ? "Appreciated work!" : "Removed appreciation",
      nextLiked ? "success" : "info"
    );

    // If real database project
    if (projectId && !projectId.startsWith("proj-")) {
      try {
        const res = await fetch(`/api/projects/${projectId}/like`, { method: "POST" });
        const json = await res.json();
        if (res.ok && json.success) {
          setHasLiked(json.data.liked);
          setLikeCount(json.data.totalLikes);
        }
      } catch {
        // Revert on error
        setHasLiked(!nextLiked);
        setLikeCount(likeCount);
      }
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = () => {
    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);

    if (typeof window !== "undefined" && projectId) {
      try {
        const saved: string[] = JSON.parse(
          localStorage.getItem("creativespace_saved_projects") || "[]"
        );
        const updated = nextBookmarked
          ? Array.from(new Set([...saved, projectId]))
          : saved.filter((id) => id !== projectId);
        localStorage.setItem("creativespace_saved_projects", JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }

    showToast(
      nextBookmarked ? "Saved to your inspiration collection" : "Removed from saved collection",
      "success"
    );
  };

  // Handle Creator Follow Toggle
  const handleToggleFollow = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/projects/${projectId}`);
      return;
    }

    if (!project?.creator?.id || isFollowBusy) return;
    setIsFollowBusy(true);

    const nextFollowing = !isFollowingCreator;
    setIsFollowingCreator(nextFollowing);

    showToast(
      nextFollowing
        ? `Now following ${project.creator.displayName}`
        : `Unfollowed ${project.creator.displayName}`,
      "success"
    );

    // Backend sync if real database user
    if (!project.creator.id.startsWith("creator-")) {
      try {
        const method = nextFollowing ? "POST" : "DELETE";
        await fetch(`/api/users/${project.creator.id}/follow`, { method });
      } catch {
        // Revert on error
        setIsFollowingCreator(!nextFollowing);
      } finally {
        setIsFollowBusy(false);
      }
    } else {
      setIsFollowBusy(false);
    }
  };

  // Handle Collaboration Connect Request
  const handleSendConnectRequest = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/projects/${projectId}`);
      return;
    }

    if (!project?.creator?.id || isConnectBusy) return;
    setIsConnectBusy(true);

    try {
      if (!project.creator.id.startsWith("creator-")) {
        const res = await fetch("/api/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId: project.creator.id }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setConnectionStatus("pending");
          showToast("Collaboration connection request sent!", "success");
        } else {
          showToast(json.error?.message || "Could not send connection request", "info");
        }
      } else {
        setConnectionStatus("pending");
        showToast("Collaboration request registered!", "success");
      }
    } catch {
      showToast("Network error sending collaboration request", "info");
    } finally {
      setIsConnectBusy(false);
    }
  };

  // Handle Publish / Feature to Portfolio
  const handlePublishToPortfolio = async () => {
    setIsPublishingPortfolio(true);
    try {
      const res = await fetch("/api/portfolio/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, featured: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Exhibited in your public portfolio showcase!", "success");
        await fetchProjectData();
      } else {
        showToast(data.error?.message || "Failed to feature in portfolio", "info");
      }
    } catch {
      showToast("Error updating portfolio", "info");
    } finally {
      setIsPublishingPortfolio(false);
    }
  };

  // Scroll to comments helper
  const handleScrollToComments = () => {
    const el = document.getElementById("feedback-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] text-[#203B35] flex flex-col">
        <div className="h-16 w-full border-b border-[#203B35]/10 bg-[#FAF8F3]" />
        <div className="flex-1 flex flex-col items-center justify-center py-28 px-4 text-center space-y-4">
          <div className="animate-spin inline-block w-8 h-8 border-3 border-[#203B35] border-t-transparent rounded-full" />
          <h2 className="text-xl font-serif italic text-[#203B35]">
            Opening Creative Exhibition...
          </h2>
          <p className="text-xs font-mono text-[#92958F]">
            Retrieving high-resolution assets and verified studio iterations
          </p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] text-[#203B35] flex flex-col">
        <ProjectDetailNav
          projectTitle="Creative Work"
          category="Exhibition"
          creator={{ id: "", username: "creativespace", displayName: "CreativeSpace" }}
        />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto space-y-4">
          <div className="h-14 w-14 rounded-full bg-[#EFECE2] text-[#203B35] flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-serif italic text-[#203B35]">
            Project Inaccessible
          </h2>
          <p className="text-xs sm:text-sm text-[#5D635F] leading-relaxed">
            {error || "This creative deliverable could not be loaded or is restricted to private studio collaborators."}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-semibold hover:bg-[#E5E1D5]"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={fetchProjectData}
              className="px-5 py-2 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26]"
            >
              Retry
            </button>
          </div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  // Determine which assets to display in Hero:
  // If selectedVersionId is chosen, filter assets for that version. Otherwise show project assets.
  const activeVersion = project.versions.find((v) => v.id === selectedVersionId);
  const displayedAssets =
    activeVersion && activeVersion.assets && activeVersion.assets.length > 0
      ? activeVersion.assets
      : project.assets.length > 0
      ? project.assets
      : [
          {
            id: `fallback-${project.id}`,
            projectId: project.id,
            versionId: null,
            fileName: project.title,
            mimeType: "image/jpeg",
            fileSize: 0,
            downloadUrl: getCategoryArtwork(project.category),
            createdAt: project.createdAt,
          },
        ];

  const isCurrentUserCreator = session?.user?.id === project.creatorId;

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#282B2A] flex flex-col selection:bg-[#203B35] selection:text-[#FAF8F3]">
      {/* 1. Main Navigation */}
      <ProjectDetailNav
        projectTitle={project.title}
        category={project.category}
        creator={project.creator}
        isFollowingCreator={isFollowingCreator}
        onToggleFollowCreator={handleToggleFollow}
        isFollowBusy={isFollowBusy}
        onShareClick={handleToggleLike}
        showFollowInNav={showFollowInNav}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#203B35] text-[#FAF8F3] text-xs font-medium shadow-2xl border border-white/10 animate-fade-up">
          <CheckCircle2 className="w-4 h-4 text-[#9DB5A5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* 2. Main Project Presentation Hero */}
        <div ref={heroRef}>
          <ProjectHeroPresentation
            title={project.title}
            description={project.description}
            category={project.category}
            status={project.status}
            visibility={project.visibility}
            createdAt={project.createdAt}
            creator={project.creator}
            assets={displayedAssets}
            selectedVersionNumber={activeVersion?.versionNumber}
            onOpenLightbox={(idx) => {
              setLightboxIndex(idx);
              setIsLightboxOpen(true);
            }}
          />
        </div>

        {/* 3. Social Interaction Bar */}
        <ProjectSocialActions
          projectId={project.id}
          projectTitle={project.title}
          hasLiked={hasLiked}
          likeCount={likeCount}
          commentCount={project._count?.comments ?? 0}
          isBookmarked={isBookmarked}
          userRole={project.userRole}
          status={project.status}
          visibility={project.visibility}
          isPortfolioFeatured={project.isPortfolioFeatured}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          onScrollToComments={handleScrollToComments}
          onOpenUploadModal={() => setIsUploadOpen(true)}
          onOpenNewVersionModal={() => setIsNewVersionOpen(true)}
          onOpenInviteModal={() => setIsInviteOpen(true)}
          onPublishToPortfolio={handlePublishToPortfolio}
          isPublishingPortfolio={isPublishingPortfolio}
        />

        {/* 4. Project Information & Metadata Specs */}
        <ProjectMetadataSection
          description={project.description}
          category={project.category}
          tags={project.tags}
          metadata={project.metadata}
          createdAt={project.createdAt}
          updatedAt={project.updatedAt}
        />

        {/* 5. Project Versions & Iteration Exploration */}
        <ProjectVersionTimeline
          versions={project.versions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={(vId) => setSelectedVersionId(vId)}
          canCreateVersion={project.userRole === "Owner" || project.userRole === "Collaborator"}
          onOpenNewVersionModal={() => setIsNewVersionOpen(true)}
          category={project.category}
        />

        {/* 6. Creator Information Section */}
        <ProjectCreatorSection
          creator={project.creator}
          isFollowing={isFollowingCreator}
          onToggleFollow={handleToggleFollow}
          isFollowBusy={isFollowBusy}
          isCurrentUser={isCurrentUserCreator}
          onSendConnectRequest={handleSendConnectRequest}
          connectionStatus={connectionStatus}
          isConnectBusy={isConnectBusy}
        />

        {/* 7. Collaboration and Team Contact */}
        <ProjectCollaborationSection
          collaborators={project.collaborators}
          creatorId={project.creatorId}
          isOwner={project.userRole === "Owner"}
          onOpenInviteModal={() => setIsInviteOpen(true)}
          onSendConnectRequest={handleSendConnectRequest}
          connectionStatus={connectionStatus}
          isConnectBusy={isConnectBusy}
          isCurrentUser={isCurrentUserCreator}
        />

        {/* 8. Constructive Feedback & Comments Section */}
        <ProjectFeedbackSection
          projectId={project.id}
          selectedVersionId={selectedVersionId}
          selectedVersionNumber={activeVersion?.versionNumber}
          isAuthenticated={authStatus === "authenticated"}
          currentUserId={session?.user?.id}
          isAdmin={Boolean(session?.user?.isAdmin)}
        />

        {/* 9. Related Works — "More to Explore" */}
        <ProjectRelatedWorks
          currentProjectId={project.id}
          category={project.category}
          tags={project.tags}
          creatorId={project.creatorId}
          creatorUsername={project.creator.username}
        />
      </main>

      {/* Media Lightbox */}
      <ProjectMediaLightbox
        assets={displayedAssets}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        projectTitle={project.title}
      />

      {/* Studio Modals (for Owners/Collaborators) */}
      <ProjectStudioModals
        projectId={project.id}
        isUploadOpen={isUploadOpen}
        onCloseUpload={() => setIsUploadOpen(false)}
        isNewVersionOpen={isNewVersionOpen}
        onCloseNewVersion={() => setIsNewVersionOpen(false)}
        isInviteOpen={isInviteOpen}
        onCloseInvite={() => setIsInviteOpen(false)}
        onSuccess={fetchProjectData}
        availableAssets={project.assets}
      />

      {/* 10. Editorial Footer */}
      <LandingFooter />
    </div>
  );
}
