"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Compass,
  Users,
  Heart,
  MessageSquare,
  ArrowUpRight,
  UserPlus,
  UserCheck,
  Award,
  Layers,
  Clock,
  AlertCircle,
  Bookmark,
  X,
  Filter,
} from "lucide-react";
import { CommunityHeader } from "./CommunityHeader";
import { LeftNavSidebar } from "./LeftNavSidebar";
import { RightDiscoverySidebar, TrendingCreatorItem } from "./RightDiscoverySidebar";
import { CategoryFilterBar } from "./CategoryFilterBar";
import { FeedTabsBar, FeedTabType } from "./FeedTabsBar";
import { PostCard, FeedPostData } from "./PostCard";
import { CreateProjectModal } from "./CreateProjectModal";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

// Editorial baseline community works to ensure rich variety of content types
// (multi-image gallery, video preview, work-in-progress, completed works)
const CURATED_COMMUNITY_FALLBACK: FeedPostData[] = [
  {
    id: "curated-1",
    type: "VersionFinalized",
    summary: "Finalized production deliverables for Nordic Botanical Identity",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actor: {
      id: "curated-anya",
      username: "anya_art",
      displayName: "Anya Sharma",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      disciplines: ["Illustration", "Botanical Art"],
      isFollowing: false,
    },
    project: {
      id: "proj-curated-1",
      title: "Solitude & Bloom: Botanical Monograph Series",
      description: "A 12-piece editorial illustration suite capturing rare Scandinavian alpine flora through gouache and fine ink line-work. Developed for the Spring Cultural Biennale exhibition.",
      category: "Illustration",
      status: "Completed",
      previewImageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
      likeCount: 42,
      commentCount: 9,
      hasLiked: false,
      tags: ["botanical", "gouache", "editorial", "exhibition"],
      mediaType: "gallery",
      galleryImages: [
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80",
      ],
    },
    version: {
      id: "ver-1",
      versionNumber: 3,
      status: "Final",
    },
  },
  {
    id: "curated-2",
    type: "VersionPublished",
    summary: "Shared work-in-progress teaser for Solaris Short Film",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actor: {
      id: "curated-rohan",
      username: "rohan_anim",
      displayName: "Rohan Verma",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      disciplines: ["Animation", "3D Modeling"],
      isFollowing: false,
    },
    project: {
      id: "proj-curated-2",
      title: "Solaris: Stylized 3D Environmental Study",
      description: "Lighting and material breakdown for Scene 04. Testing clay shader subsurface scattering and atmospheric dust motes in Blender Cycles.",
      category: "Animation",
      status: "InProgress",
      previewImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
      likeCount: 28,
      commentCount: 5,
      hasLiked: false,
      tags: ["blender", "stylized3d", "lighting", "wip"],
      mediaType: "video",
      videoDuration: "0:45",
    },
    version: {
      id: "ver-2",
      versionNumber: 2,
      status: "Approved",
    },
  },
  {
    id: "curated-3",
    type: "ProjectPublished",
    summary: "Published architectural photo essay across Copenhagen pavilions",
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    actor: {
      id: "curated-grace",
      username: "grace_music",
      displayName: "Grace Chen",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
      disciplines: ["Photography", "Music"],
      isFollowing: false,
    },
    project: {
      id: "proj-curated-3",
      title: "Geometry of Quiet: Minimalist Architecture",
      description: "Medium format architectural exposures exploring natural shadow lines, raw concrete, and daylight transitions across modern Scandinavian design pavilions.",
      category: "Photography",
      status: "Completed",
      previewImageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
      likeCount: 64,
      commentCount: 14,
      hasLiked: false,
      tags: ["architecture", "minimalism", "shadows", "nordic"],
      mediaType: "image",
    },
    version: null,
  },
  {
    id: "curated-4",
    type: "VersionPublished",
    summary: "Updated design system tokens and component library",
    createdAt: new Date(Date.now() - 1000 * 60 * 800).toISOString(),
    actor: {
      id: "curated-david",
      username: "david_client",
      displayName: "David Miller",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      disciplines: ["UI/UX Design", "Creative Director"],
      isFollowing: false,
    },
    project: {
      id: "proj-curated-4",
      title: "Komorebi: Spatial Design System",
      description: "Typography scales, warm tactile color palettes, and accessible focus states crafted for editorial publication and creative studio tools.",
      category: "UI/UX Design",
      status: "InProgress",
      previewImageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80",
      likeCount: 37,
      commentCount: 8,
      hasLiked: false,
      tags: ["uiux", "designsystem", "typography"],
      mediaType: "gallery",
      galleryImages: [
        "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1581291518655-9523c932deb4?w=1200&auto=format&fit=crop&q=80",
      ],
    },
    version: {
      id: "ver-4",
      versionNumber: 1,
      status: "Draft",
    },
  },
];

export function CommunityFeed() {
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";

  // Feed control states
  const [feedTab, setFeedTab] = useState<FeedTabType>("for-you");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeSidebarView, setActiveSidebarView] = useState<"home" | "saved" | "following">("home");

  // Feed data & pagination
  const [items, setItems] = useState<FeedPostData[]>([]);
  const [suggestedCreators, setSuggestedCreators] = useState<TrendingCreatorItem[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Stats for left sidebar badges
  const [incomingConnectionsCount, setIncomingConnectionsCount] = useState(0);
  const [pendingCollaborationsCount, setPendingCollaborationsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Saved posts (stored statefully in session storage/state)
  const [savedProjectIds, setSavedProjectIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("creativespace_saved_projects");
        if (stored) return new Set(JSON.parse(stored));
      } catch {
        // Fallback
      }
    }
    return new Set<string>();
  });

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Busy trackers
  const [busyFollowIds, setBusyFollowIds] = useState<Record<string, boolean>>({});
  const [busyLikeIds, setBusyLikeIds] = useState<Record<string, boolean>>({});

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Toast feedback helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch badges counts (Connections, Collaborations, Notifications)
  const fetchSidebarBadges = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [connRes, invRes, notifRes] = await Promise.all([
        fetch("/api/connections/requests?direction=incoming", { cache: "no-store" }),
        fetch("/api/invitations", { cache: "no-store" }),
        fetch("/api/notifications", { cache: "no-store" }),
      ]);
      const [connJson, invJson, notifJson] = await Promise.all([
        connRes.json(),
        invRes.json(),
        notifRes.json(),
      ]);

      if (connJson.success && Array.isArray(connJson.data?.incoming)) {
        setIncomingConnectionsCount(connJson.data.incoming.length);
      }
      if (invJson.success && invJson.data?.summary) {
        setPendingCollaborationsCount(invJson.data.summary.pendingIncoming ?? 0);
      }
      if (notifJson.success && typeof notifJson.data?.unreadCount === "number") {
        setUnreadNotificationsCount(notifJson.data.unreadCount);
      }
    } catch {
      // Non-blocking
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSidebarBadges();
  }, [fetchSidebarBadges]);

  // Main feed fetcher
  const fetchFeed = useCallback(
    async (cursorParam?: string | null) => {
      const isAppending = Boolean(cursorParam);
      if (isAppending) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        // Map frontend tab to backend API params
        // 'for-you' -> fetches /api/recommendations or /api/feed?tab=discover with relevance
        // 'following' -> /api/feed?tab=following
        // 'latest' -> /api/feed?tab=discover
        const apiTab = feedTab === "following" ? "following" : "discover";

        const params = new URLSearchParams({
          tab: apiTab,
          limit: "12",
        });
        if (selectedCategory && selectedCategory !== "All") {
          params.set("category", selectedCategory);
        }
        if (cursorParam) {
          params.set("cursor", cursorParam);
        }

        const res = await fetch(`/api/feed?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          // If unauthenticated or tab error, handle gracefully
          if (res.status === 401 && feedTab === "following") {
            setError("Sign in to view activity from creators you follow.");
            setItems([]);
            return;
          }
          setError(json.error?.message || "Failed to load community feed.");
          return;
        }

        const backendItems: FeedPostData[] = (json.data.items || []).map((item: any) => ({
          ...item,
          project: {
            ...item.project,
            tags: item.project.tags || [item.project.category.toLowerCase().replace(/\s+/g, "")],
            mediaType: item.project.mediaType || "image",
          },
        }));

        // Blend with curated fallback if live database has limited items to maintain visual excellence
        let combinedItems: FeedPostData[] = backendItems;
        if (!isAppending && backendItems.length < 3 && feedTab !== "following") {
          const categoryFilteredCurated =
            selectedCategory === "All"
              ? CURATED_COMMUNITY_FALLBACK
              : CURATED_COMMUNITY_FALLBACK.filter(
                  (c) => c.project.category.toLowerCase() === selectedCategory.toLowerCase()
                );
          const existingIds = new Set(backendItems.map((b) => b.project.id));
          const uniqueCurated = categoryFilteredCurated.filter(
            (c) => !existingIds.has(c.project.id)
          );
          combinedItems = [...backendItems, ...uniqueCurated];
        }

        if (isAppending) {
          setItems((prev) => {
            const seen = new Set(prev.map((i) => i.id));
            return [...prev, ...combinedItems.filter((i) => !seen.has(i.id))];
          });
        } else {
          setItems(combinedItems);
          if (Array.isArray(json.data.suggestedCreators)) {
            setSuggestedCreators(json.data.suggestedCreators);
          }
        }

        setFollowingCount(json.data.followingCount ?? 0);
        setHasMore(Boolean(json.data.hasMore));
        setNextCursor(json.data.nextCursor ?? null);
      } catch {
        setError("Network error while loading community feed. Please check your connection.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [feedTab, selectedCategory]
  );

  // Trigger feed fetch whenever tab or category changes
  useEffect(() => {
    if (authStatus === "loading") return;
    fetchFeed(null);
  }, [authStatus, fetchFeed]);

  // Handle Like / Unlike
  const handleToggleLike = async (projectId: string) => {
    if (!isAuthenticated || busyLikeIds[projectId]) return;
    setBusyLikeIds((prev) => ({ ...prev, [projectId]: true }));
    setActionError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/like`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Could not update like.");
        return;
      }

      const liked = Boolean(json.data.liked);
      const totalLikes = json.data.totalLikes;

      setItems((prev) =>
        prev.map((item) =>
          item.project.id === projectId
            ? {
                ...item,
                project: {
                  ...item.project,
                  hasLiked: liked,
                  likeCount: typeof totalLikes === "number" ? totalLikes : item.project.likeCount + (liked ? 1 : -1),
                },
              }
            : item
        )
      );
    } catch {
      setActionError("Network error while toggling like.");
    } finally {
      setBusyLikeIds((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Handle Follow / Unfollow
  const handleToggleFollow = async (targetUserId: string, currentlyFollowing: boolean) => {
    if (!isAuthenticated || busyFollowIds[targetUserId]) return;
    setBusyFollowIds((prev) => ({ ...prev, [targetUserId]: true }));
    setActionError(null);

    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: currentlyFollowing ? "DELETE" : "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Could not update follow status.");
        return;
      }

      const nextFollowing = Boolean(json.data.following);

      // Update post cards
      setItems((prev) =>
        prev.map((item) =>
          item.actor.id === targetUserId
            ? { ...item, actor: { ...item.actor, isFollowing: nextFollowing } }
            : item
        )
      );

      // Update trending creators in sidebar
      setSuggestedCreators((prev) =>
        prev.map((c) =>
          c.id === targetUserId
            ? {
                ...c,
                isFollowing: nextFollowing,
                followerCount: json.data.followerCount ?? c.followerCount,
              }
            : c
        )
      );

      setFollowingCount((prev) => Math.max(0, prev + (nextFollowing ? 1 : -1)));
      showToast(nextFollowing ? "Creator followed" : "Creator unfollowed");
    } catch {
      setActionError("Network error while updating follow status.");
    } finally {
      setBusyFollowIds((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Handle Save / Unsave
  const handleToggleSave = (projectId: string) => {
    setSavedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
        showToast("Removed from saved collection");
      } else {
        next.add(projectId);
        showToast("Saved to your collection");
      }
      try {
        localStorage.setItem("creativespace_saved_projects", JSON.stringify(Array.from(next)));
      } catch {
        // Storage fail-safe
      }
      return next;
    });
  };

  // Handle Share link copy
  const handleCopyShareLink = (title: string, url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Link to "${title}" copied to clipboard!`);
    }
  };

  // Filter items based on active sidebar view
  const displayedItems = useMemo(() => {
    if (activeSidebarView === "saved") {
      return items.filter((item) => savedProjectIds.has(item.project.id));
    }
    return items;
  }, [items, activeSidebarView, savedProjectIds]);

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] flex flex-col">
      {/* ============================================================ */}
      {/* 1. PERSISTENT HEADER NAVIGATION (Section 4)                  */}
      {/* ============================================================ */}
      <CommunityHeader
        onCreateClick={() => setIsCreateModalOpen(true)}
        onMobileMenuToggle={() => setIsMobileDrawerOpen(true)}
        unreadCount={unreadNotificationsCount}
      />

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-[#203B35] text-[#F6F3EB] px-5 py-2.5 text-xs font-semibold shadow-2xl animate-fade-up flex items-center gap-2 border border-[#9DB5A5]/30">
          <Sparkles className="h-3.5 w-3.5 text-[#9DB5A5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-center text-xs font-medium text-rose-800 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="ml-2 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. THREE-COLUMN AUTHENTICATED COMMUNITY LAYOUT (Section 3)   */}
      {/* ============================================================ */}
      <div className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6 lg:gap-8">
          {/* ========================================================== */}
          {/* LEFT COLUMN: NAVIGATION & SHORTCUTS (Section 5)            */}
          {/* ========================================================== */}
          <aside className="hidden md:block w-60 xl:w-64 shrink-0 sticky top-[71px] h-[calc(100vh-71px)] overflow-y-auto">
            <LeftNavSidebar
              activeView={activeSidebarView}
              onSelectView={(view) => {
                setActiveSidebarView(view);
                if (view === "following") {
                  setFeedTab("following");
                } else if (view === "home") {
                  setFeedTab("for-you");
                }
              }}
              incomingConnectionsCount={incomingConnectionsCount}
              pendingCollaborationsCount={pendingCollaborationsCount}
              savedCount={savedProjectIds.size}
            />
          </aside>

          {/* ========================================================== */}
          {/* CENTER COLUMN: CREATIVE COMMUNITY FEED (Section 6)         */}
          {/* ========================================================== */}
          <main className="flex-1 min-w-0 max-w-[680px] xl:max-w-[720px] py-6 mx-auto w-full space-y-5">
            {/* Active Saved filter badge indicator */}
            {activeSidebarView === "saved" && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#203B35]/15">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-[#203B35] fill-current" />
                  <span className="text-xs font-bold text-[#203B35]">
                    Viewing Saved Creative Works ({savedProjectIds.size})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSidebarView("home")}
                  className="text-xs font-semibold text-[#5D635F] hover:text-[#203B35]"
                >
                  Return to Feed
                </button>
              </div>
            )}

            {/* A. Category Filter Bar (Section 6.A) */}
            <CategoryFilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />

            {/* B. Feed Tabs (Section 6.B) */}
            <FeedTabsBar
              activeTab={feedTab}
              onChangeTab={(tab) => {
                setFeedTab(tab);
                setActiveSidebarView(tab === "following" ? "following" : "home");
              }}
              followingCount={followingCount}
            />

            {/* Error State */}
            {error && (
              <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-800">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchFeed(null)}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#203B35] text-[#F6F3EB] text-xs font-semibold hover:bg-[#162A26] transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="space-y-5">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/10 space-y-4 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#EFECE2]" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-32 rounded bg-[#EFECE2]" />
                        <div className="h-2.5 w-20 rounded bg-[#EFECE2]" />
                      </div>
                    </div>
                    <div className="h-72 w-full rounded-xl bg-[#EFECE2]" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 rounded bg-[#EFECE2]" />
                      <div className="h-3 w-full rounded bg-[#EFECE2]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feed Post Cards List */}
            {!isLoading && displayedItems.length > 0 && (
              <div className="space-y-5">
                {displayedItems.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={idx}
                    onToggleLike={handleToggleLike}
                    onToggleFollow={handleToggleFollow}
                    onToggleSave={handleToggleSave}
                    isSaved={savedProjectIds.has(post.project.id)}
                    isLikeBusy={Boolean(busyLikeIds[post.project.id])}
                    isFollowBusy={Boolean(busyFollowIds[post.actor.id])}
                    onCopyShareLink={handleCopyShareLink}
                  />
                ))}

                {/* Pagination button */}
                {hasMore && (
                  <div className="pt-4 pb-8 text-center">
                    <button
                      type="button"
                      disabled={isLoadingMore}
                      onClick={() => fetchFeed(nextCursor)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FAF8F3] border border-[#203B35]/20 text-xs font-semibold text-[#203B35] hover:bg-[#EFECE2] hover:border-[#203B35]/40 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isLoadingMore ? (
                        <>
                          <span className="animate-spin text-xs">···</span>
                          <span>Loading more works...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-[#9DB5A5]" />
                          <span>Load More Creative Works</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && displayedItems.length === 0 && !error && (
              <div className="py-16 text-center rounded-2xl bg-[#FAF8F3] border border-[#203B35]/10 p-8 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-[#EFECE2] flex items-center justify-center text-[#203B35]">
                  <Compass className="h-6 w-6 text-[#203B35]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#203B35]">
                    {activeSidebarView === "saved"
                      ? "No saved creative works yet"
                      : feedTab === "following"
                      ? "No activity from creators you follow"
                      : `No creative posts found in ${selectedCategory}`}
                  </h3>
                  <p className="text-xs text-[#5D635F] max-w-sm mx-auto leading-relaxed">
                    {activeSidebarView === "saved"
                      ? "Click the bookmark icon on any creative post to build your personal inspiration collection."
                      : feedTab === "following"
                      ? "Follow inspiring illustrators, photographers, animators, and designers to see their newest works here."
                      : "Explore all categories or be the first to publish creative work in this discipline!"}
                  </p>
                </div>
                {feedTab === "following" && (
                  <button
                    type="button"
                    onClick={() => setFeedTab("for-you")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#203B35] text-[#F6F3EB] text-xs font-semibold hover:bg-[#162A26] transition-all"
                  >
                    <span>Explore Community Discovery</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#9DB5A5]" />
                  </button>
                )}
              </div>
            )}
          </main>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: COMMUNITY DISCOVERY (Section 7)              */}
          {/* ========================================================== */}
          <aside className="hidden lg:block w-80 xl:w-88 shrink-0 sticky top-[71px] h-[calc(100vh-71px)] overflow-y-auto py-6">
            <RightDiscoverySidebar
              creators={suggestedCreators}
              onToggleFollow={handleToggleFollow}
              busyFollowIds={busyFollowIds}
              selectedCategory={selectedCategory}
              onSelectTopic={(category) => {
                setSelectedCategory(category);
                setFeedTab("for-you");
              }}
            />
          </aside>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MOBILE NAVIGATION DRAWER                                  */}
      {/* ============================================================ */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#162A26]/50 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[80vw] bg-[#FAF8F3] h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 border-r border-[#203B35]/15">
            <div className="flex items-center justify-between pb-4 border-b border-[#203B35]/10">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#203B35]">
                Navigation
              </span>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-full text-[#92958F] hover:text-[#203B35]"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <LeftNavSidebar
              activeView={activeSidebarView}
              onSelectView={(view) => {
                setActiveSidebarView(view);
                if (view === "following") {
                  setFeedTab("following");
                } else if (view === "home") {
                  setFeedTab("for-you");
                }
              }}
              incomingConnectionsCount={incomingConnectionsCount}
              pendingCollaborationsCount={pendingCollaborationsCount}
              savedCount={savedProjectIds.size}
              onItemClick={() => setIsMobileDrawerOpen(false)}
              className="py-4"
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. CREATE PROJECT MODAL                                      */}
      {/* ============================================================ */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchFeed(null);
          showToast("New creative work published to community feed!");
        }}
      />
    </div>
  );
}
