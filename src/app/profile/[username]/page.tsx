"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Layers,
  Award,
  ArrowLeft,
  Compass,
  AlertCircle,
} from "lucide-react";
import { CreatorProfileNav } from "@/components/profile/CreatorProfileNav";
import { CreatorProfileHeader } from "@/components/profile/CreatorProfileHeader";
import { ProfileFeaturedShowcase } from "@/components/profile/ProfileFeaturedShowcase";
import { ProfileTabsBar, ProfileTabType } from "@/components/profile/ProfileTabsBar";
import { ProfilePostsTab } from "@/components/profile/ProfilePostsTab";
import { ProfileProjectsTab } from "@/components/profile/ProfileProjectsTab";
import { ProfileAboutTab } from "@/components/profile/ProfileAboutTab";
import { ProfileCollaborationsTab } from "@/components/profile/ProfileCollaborationsTab";
import { ProfileFooter } from "@/components/profile/ProfileFooter";
import { CollaborateModal } from "@/components/profile/CollaborateModal";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { ReportCreatorModal } from "@/components/profile/ReportCreatorModal";
import { ProfileToast } from "@/components/profile/ProfileToast";
import { PostCommentsDrawer } from "@/components/feed/PostCommentsDrawer";
import { CreateProjectModal } from "@/components/feed/CreateProjectModal";
import { FeedPostData } from "@/components/feed/PostCard";
import { Button } from "@/components/ui/Button";

interface ViewerConnectionState {
  id: string;
  status: "Pending" | "Accepted" | "Rejected";
  direction: "incoming" | "outgoing";
  acceptedAt: string | null;
  rejectedAt: string | null;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session, status: authStatus } = useSession();

  // Core profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile navigation active tab
  const [activeTab, setActiveTab] = useState<ProfileTabType>("posts");

  // Interaction loading states
  const [isFollowBusy, setIsFollowBusy] = useState(false);
  const [busyLikeIds, setBusyLikeIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [followModalType, setFollowModalType] = useState<"followers" | "following" | null>(null);
  const [isCollaborateOpen, setIsCollaborateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [commentsDrawer, setCommentsDrawer] = useState<{
    isOpen: boolean;
    projectId: string;
    versionId?: string | null;
  }>({
    isOpen: false,
    projectId: "",
    versionId: null,
  });

  // Toast feedback state
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  }, []);

  // Fetch creator profile and portfolio data
  const fetchProfile = useCallback(async (showSpinner = false) => {
    if (!username) return;
    if (showSpinner) setIsLoading(true);

    try {
      const res = await fetch(`/api/portfolio/${encodeURIComponent(username)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Creator profile not found");
        return;
      }

      setError(null);
      setProfileData(data.data);
    } catch {
      setError("Network error loading creator profile.");
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  // Load when auth status settles
  useEffect(() => {
    if (authStatus === "loading") return;
    fetchProfile(true);
  }, [authStatus, session?.user?.id, fetchProfile]);

  // Handle Follow / Unfollow toggle
  const handleToggleFollow = async () => {
    if (!profileData || isFollowBusy) return;
    const creator = profileData.creator;
    const currentlyFollowing = Boolean(profileData.isFollowing);

    setIsFollowBusy(true);
    try {
      const res = await fetch(`/api/users/${creator.id}/follow`, {
        method: currentlyFollowing ? "DELETE" : "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error?.message || "Could not update follow status", "error");
        return;
      }

      const nextFollowing = Boolean(json.data.following);
      const nextFollowerCount = json.data.followerCount ?? (creator.stats?.followers + (nextFollowing ? 1 : -1));

      // Optimistically update profileData
      setProfileData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          isFollowing: nextFollowing,
          creator: {
            ...prev.creator,
            stats: {
              ...prev.creator.stats,
              followers: nextFollowerCount,
            },
          },
        };
      });

      showToast(nextFollowing ? `Followed @${creator.username}` : `Unfollowed @${creator.username}`, "success");
    } catch {
      showToast("Network error updating follow status.", "error");
    } finally {
      setIsFollowBusy(false);
    }
  };

  // Handle Post / Project Like Toggle
  const handleToggleLike = async (projectId: string) => {
    if (authStatus !== "authenticated") {
      showToast("Please sign in to like creative works", "info");
      return;
    }
    if (busyLikeIds[projectId]) return;

    setBusyLikeIds((prev) => ({ ...prev, [projectId]: true }));

    // Find current like status in posts or allProjects
    const targetPost = profileData?.posts?.find((p: FeedPostData) => p.project.id === projectId);
    const currentlyLiked = targetPost ? targetPost.project.hasLiked : false;

    // Optimistic UI update
    setProfileData((prev: any) => {
      if (!prev) return prev;
      const updatedPosts = (prev.posts || []).map((p: FeedPostData) => {
        if (p.project.id === projectId) {
          return {
            ...p,
            project: {
              ...p.project,
              hasLiked: !currentlyLiked,
              likeCount: Math.max(0, p.project.likeCount + (currentlyLiked ? -1 : 1)),
            },
          };
        }
        return p;
      });

      const updatedProjects = (prev.allProjects || []).map((proj: any) => {
        if (proj.id === projectId) {
          return {
            ...proj,
            hasLiked: !currentlyLiked,
            likeCount: Math.max(0, (proj.likeCount || 0) + (currentlyLiked ? -1 : 1)),
          };
        }
        return proj;
      });

      return {
        ...prev,
        posts: updatedPosts,
        allProjects: updatedProjects,
      };
    });

    try {
      const res = await fetch(`/api/projects/${projectId}/like`, {
        method: currentlyLiked ? "DELETE" : "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error?.message || "Failed to update like", "error");
        // Revert on error
        await fetchProfile(false);
      }
    } catch {
      showToast("Network error while updating like", "error");
      await fetchProfile(false);
    } finally {
      setBusyLikeIds((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Handle Share Profile (copies URL to clipboard)
  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Profile link copied to clipboard!", "success");
    }
  };

  // Handle Share Post
  const handleSharePost = (title: string, url: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(url);
      showToast(`Link to "${title}" copied to clipboard!`, "success");
    }
  };

  // Open comments drawer for a project
  const handleOpenComments = (projectId: string, versionId?: string | null) => {
    setCommentsDrawer({
      isOpen: true,
      projectId,
      versionId: versionId ?? null,
    });
  };

  // =========================================================================
  // RENDER: LOADING SKELETON
  // =========================================================================
  if (isLoading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#F6F3EB] text-[#282B2A]">
        <CreatorProfileNav />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/10 p-8 sm:p-12 space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="w-32 h-32 rounded-3xl bg-[#EFECE2]" />
              <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                <div className="h-8 w-64 bg-[#EFECE2] rounded-xl mx-auto sm:mx-0" />
                <div className="h-4 w-32 bg-[#EFECE2] rounded-lg mx-auto sm:mx-0" />
                <div className="h-4 w-full max-w-lg bg-[#EFECE2] rounded-lg mx-auto sm:mx-0 pt-2" />
                <div className="h-4 w-3/4 max-w-md bg-[#EFECE2] rounded-lg mx-auto sm:mx-0" />
                <div className="flex justify-center sm:justify-start gap-3 pt-3">
                  <div className="h-8 w-24 bg-[#EFECE2] rounded-full" />
                  <div className="h-8 w-24 bg-[#EFECE2] rounded-full" />
                  <div className="h-8 w-24 bg-[#EFECE2] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Showcase Skeleton */}
          <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/10 p-6 sm:p-8 space-y-4">
            <div className="h-6 w-48 bg-[#EFECE2] rounded-lg" />
            <div className="aspect-[16/9] w-full bg-[#EFECE2] rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // RENDER: ERROR / NOT FOUND STATE
  // =========================================================================
  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] text-[#282B2A] flex flex-col justify-between">
        <CreatorProfileNav />
        <main className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EFECE2] flex items-center justify-center text-[#203B35]">
            <AlertCircle className="w-8 h-8 text-[#203B35]" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#203B35]">
            Creator Not Found
          </h2>
          <p className="text-sm text-[#5D635F] leading-relaxed">
            {error || `We could not find any creator with username @${username}. They may have updated their profile handle or the account does not exist.`}
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link href="/feed">
              <Button
                variant="primary"
                size="sm"
                className="bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] rounded-full px-5 text-xs"
              >
                Return to Community Feed
              </Button>
            </Link>
            <Link href="/discover">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-5 text-xs border-[#203B35]/20 text-[#203B35]"
              >
                Discover Creators
              </Button>
            </Link>
          </div>
        </main>
        <ProfileFooter />
      </div>
    );
  }

  // =========================================================================
  // EXTRACT DATA
  // =========================================================================
  const { creator, portfolio } = profileData;
  const connection: ViewerConnectionState | null = profileData.connection || null;
  const isFollowing: boolean = Boolean(profileData.isFollowing);
  const isOwner = Boolean(session?.user?.id && session.user.id === creator.id);

  // Projects list
  const showcaseProjects: any[] = portfolio?.projects || [];
  const allProjects: any[] = profileData.allProjects || [];
  const collaborations: any[] = profileData.collaborations || [];
  const posts: FeedPostData[] = profileData.posts || [];

  // Determine Featured Items:
  // Prefer explicitly curated portfolio projects; fallback to top allProjects if showcase is empty
  const featuredItems = showcaseProjects.length > 0
    ? showcaseProjects.map((sp: any) => ({
        id: sp.project.id,
        title: sp.project.title,
        description: sp.project.description,
        category: sp.project.category,
        status: sp.project.status,
        coverUrl: sp.project.coverUrl || sp.project.previewImageUrl || sp.project.assets?.[0]?.thumbnailPath || null,
        previewImageUrl: sp.project.previewImageUrl || sp.project.assets?.[0]?.thumbnailPath || null,
        tags: sp.project.tags,
        likeCount: sp.project._count?.likes ?? sp.project.likeCount ?? 0,
        commentCount: sp.project._count?.comments ?? sp.project.commentCount ?? 0,
        featured: sp.featured,
      }))
    : allProjects.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] flex flex-col justify-between">
      {/* 1. TOP EDITORIAL NAVIGATION BAR */}
      <CreatorProfileNav onCreateClick={() => setIsCreateOpen(true)} />

      {/* 2. MAIN CREATOR PROFILE CONTAINER */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* A & B: Creator Identity & Action Header */}
        <CreatorProfileHeader
          creator={creator}
          isOwner={isOwner}
          connection={connection}
          isFollowing={isFollowing}
          onToggleFollow={handleToggleFollow}
          isFollowBusy={isFollowBusy}
          onOpenFollowers={() => setFollowModalType("followers")}
          onOpenFollowing={() => setFollowModalType("following")}
          onOpenCollaborate={() => setIsCollaborateOpen(true)}
          onOpenReport={() => setIsReportOpen(true)}
          onShareProfile={handleShareProfile}
          onSwitchTab={(tab) => setActiveTab(tab)}
        />

        {/* C: Curated Featured Showcase Section */}
        {featuredItems.length > 0 && (
          <ProfileFeaturedShowcase
            items={featuredItems}
            creatorName={creator.displayName}
          />
        )}

        {/* D: Clean Profile Tabs Navigation */}
        <ProfileTabsBar
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          postsCount={posts.length}
          projectsCount={allProjects.length > 0 ? allProjects.length : showcaseProjects.length}
          collaborationsCount={collaborations.length}
        />

        {/* TAB 1: POSTS (Social activity & work in progress) */}
        {activeTab === "posts" && (
          <ProfilePostsTab
            posts={posts}
            creatorUsername={creator.username}
            onToggleLike={handleToggleLike}
            onOpenComments={handleOpenComments}
            onSharePost={handleSharePost}
            busyLikeIds={busyLikeIds}
          />
        )}

        {/* TAB 2: PROJECTS (Organized creative portfolio workspaces) */}
        {activeTab === "projects" && (
          <ProfileProjectsTab
            projects={allProjects.length > 0 ? allProjects : showcaseProjects.map((sp: any) => sp.project)}
            creatorUsername={creator.username}
          />
        )}

        {/* TAB 3: ABOUT (Creator story, disciplines, tools, skills) */}
        {activeTab === "about" && (
          <ProfileAboutTab
            creator={creator}
            projects={allProjects.length > 0 ? allProjects : showcaseProjects.map((sp: any) => sp.project)}
            isOwner={isOwner}
          />
        )}

        {/* TAB 4: COLLABORATIONS (Completed & active collaborative projects) */}
        {activeTab === "collaborations" && (
          <ProfileCollaborationsTab
            collaborations={collaborations}
            creatorUsername={creator.username}
          />
        )}
      </main>

      {/* 3. PROFILE FOOTER */}
      <ProfileFooter />

      {/* 4. MODALS & DRAWERS */}
      {/* Collaborate Modal (Project Invite or Peer Connection) */}
      <CollaborateModal
        isOpen={isCollaborateOpen}
        onClose={() => setIsCollaborateOpen(false)}
        targetCreator={{
          id: creator.id,
          username: creator.username,
          displayName: creator.displayName,
          avatarUrl: creator.avatarUrl,
          disciplines: creator.disciplines,
        }}
        connection={connection}
        onConnectionChange={() => fetchProfile(false)}
        onShowToast={showToast}
      />

      {/* Followers / Following List Modal */}
      <FollowersModal
        isOpen={followModalType !== null}
        onClose={() => setFollowModalType(null)}
        creatorId={creator.id}
        username={creator.username}
        type={followModalType || "followers"}
      />

      {/* Report Creator Modal */}
      <ReportCreatorModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        creatorId={creator.id}
        creatorUsername={creator.username}
        onSuccess={() => showToast("Report submitted for moderation review.", "success")}
      />

      {/* Post Comments Drawer */}
      <PostCommentsDrawer
        isOpen={commentsDrawer.isOpen}
        onClose={() => setCommentsDrawer({ isOpen: false, projectId: "", versionId: null })}
        projectId={commentsDrawer.projectId}
        versionId={commentsDrawer.versionId}
        onCommentAdded={() => fetchProfile(false)}
      />

      {/* Create Project Modal (When owner clicks Create Work) */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchProfile(false);
          showToast("New project published!", "success");
        }}
      />

      {/* Floating Action Toast Notification */}
      {toast && (
        <ProfileToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
