"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  GitBranch,
  Layers,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

const CATEGORIES = [
  "All",
  "Illustration",
  "Photography",
  "Music",
  "Writing",
  "Animation",
  "Video",
  "UI/UX",
];

interface FeedActor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  disciplines: string[];
  isFollowing: boolean;
}

interface FeedItem {
  id: string;
  type: "ProjectPublished" | "VersionPublished" | "VersionFinalized" | "PortfolioPublished";
  summary: string;
  createdAt: string;
  relevanceScore: number;
  actor: FeedActor;
  project: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    status: string;
    previewImageUrl: string | null;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
  };
  version: {
    id: string;
    versionNumber: number;
    status: string;
  } | null;
}

interface SuggestedCreator {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  disciplines: string[];
  followerCount: number;
  publicProjectCount: number;
  isFollowing: boolean;
}

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function CommunityFeed() {
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";
  const currentUserId = session?.user?.id || null;

  const [tab, setTab] = useState<"following" | "discover">(
    isAuthenticated ? "following" : "discover"
  );
  const [category, setCategory] = useState("All");

  const [items, setItems] = useState<FeedItem[]>([]);
  const [suggestedCreators, setSuggestedCreators] = useState<SuggestedCreator[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyFollowIds, setBusyFollowIds] = useState<Record<string, boolean>>({});
  const [busyLikeIds, setBusyLikeIds] = useState<Record<string, boolean>>({});

  // Default signed-in users to Following once session resolves
  useEffect(() => {
    if (authStatus === "unauthenticated" && tab === "following") {
      setTab("discover");
    }
  }, [authStatus, tab]);

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
        const params = new URLSearchParams({
          tab,
          limit: "10",
        });
        if (category && category !== "All") {
          params.set("category", category);
        }
        if (cursorParam) {
          params.set("cursor", cursorParam);
        }

        const res = await fetch(`/api/feed?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error?.message || "Failed to load community feed");
          return;
        }

        const newItems: FeedItem[] = json.data.items || [];
        if (isAppending) {
          setItems((prev) => {
            const seen = new Set(prev.map((i) => i.id));
            return [...prev, ...newItems.filter((i) => !seen.has(i.id))];
          });
        } else {
          setItems(newItems);
          if (Array.isArray(json.data.suggestedCreators)) {
            setSuggestedCreators(json.data.suggestedCreators);
          }
        }

        setFollowingCount(json.data.followingCount ?? 0);
        setHasMore(Boolean(json.data.hasMore));
        setNextCursor(json.data.nextCursor ?? null);
      } catch {
        setError("Network error while loading the community feed.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [tab, category]
  );

  useEffect(() => {
    if (authStatus === "loading") return;
    fetchFeed(null);
  }, [authStatus, fetchFeed]);

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
        setActionError(json.error?.message || "Could not update follow status");
        return;
      }

      const nextFollowing = Boolean(json.data.following);
      setItems((prev) =>
        prev.map((item) =>
          item.actor.id === targetUserId
            ? { ...item, actor: { ...item.actor, isFollowing: nextFollowing } }
            : item
        )
      );
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
    } catch {
      setActionError("Network error updating follow status.");
    } finally {
      setBusyFollowIds((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleToggleLike = async (projectId: string) => {
    if (!isAuthenticated || busyLikeIds[projectId]) return;
    setBusyLikeIds((prev) => ({ ...prev, [projectId]: true }));
    setActionError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/like`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Could not update project like");
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.project.id === projectId
            ? {
                ...item,
                project: {
                  ...item.project,
                  hasLiked: Boolean(json.data.liked),
                  likeCount: json.data.totalLikes ?? item.project.likeCount,
                },
              }
            : item
        )
      );
    } catch {
      setActionError("Network error updating project like.");
    } finally {
      setBusyLikeIds((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  return (
    <div className="relative flex-1 w-full bg-[radial-gradient(ellipse_75%_55%_at_50%_-15%,rgba(99,102,241,0.16),rgba(16,185,129,0.05)_55%,transparent)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Editorial Cosmic-Nature Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-7 border-b border-slate-800/80">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/50 px-3 py-1 text-[11px] font-medium text-indigo-200 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>CreativeSpace Community Universe</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Community Activity Feed
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Follow creators, explore published projects and finalized deliverables, and celebrate work across disciplines.
            </p>
          </div>

          {/* Feed Navigation: Following | Discover */}
          <div className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-900/70 p-1 backdrop-blur-md self-start md:self-auto">
            <button
              type="button"
              onClick={() => setTab("following")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === "following"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Following
            </button>
            <button
              type="button"
              onClick={() => setTab("discover")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === "discover"
                  ? "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Discover
            </button>
          </div>
        </div>

        {/* Category Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                category === cat
                  ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-200 shadow-sm shadow-emerald-900/30"
                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mb-5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Main 2-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
          {/* Feed Column */}
          <div className="lg:col-span-8 space-y-5">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <SkeletonCard key={n} />
                ))}
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={() => fetchFeed(null)} />
            ) : tab === "following" && !isAuthenticated ? (
              <EmptyState
                icon={<Users className="w-11 h-11 text-indigo-400" />}
                title="Sign in to follow creators"
                description="Create your personalized timeline of published projects and new versions from creators you admire."
              />
            ) : items.length === 0 ? (
              tab === "following" && followingCount === 0 ? (
                <EmptyState
                  icon={<Sparkles className="w-11 h-11 text-emerald-400" />}
                  title="Your Following feed is ready to bloom"
                  description="You are not following any creators yet. Follow artists from the Discover tab or the suggested creators panel to see their latest published work here."
                  actionLabel="Explore Discover Feed"
                  onAction={() => setTab("discover")}
                />
              ) : tab === "following" ? (
                <EmptyState
                  icon={<Clock className="w-11 h-11 text-indigo-400" />}
                  title="No recent public activity yet"
                  description="Creators you follow have not published new public projects or approved versions in this filter yet. Check Discover for fresh community work."
                  actionLabel="Browse Discover"
                  onAction={() => setTab("discover")}
                />
              ) : (
                <EmptyState
                  icon={<Compass className="w-11 h-11 text-violet-400" />}
                  title="No published community activity found"
                  description="No public projects or finalized versions match this category yet. Publish a public project from your workspace to kick off the community feed."
                />
              )
            ) : (
              <>
                {items.map((item) => {
                  const isOwnItem = Boolean(currentUserId && currentUserId === item.actor.id);
                  const followBusy = Boolean(busyFollowIds[item.actor.id]);
                  const likeBusy = Boolean(busyLikeIds[item.project.id]);
                  const targetHref = item.version
                    ? `/projects/${item.project.id}?tab=versions&versionId=${item.version.id}`
                    : `/projects/${item.project.id}`;

                  return (
                    <article
                      key={item.id}
                      className="group rounded-2xl border border-slate-800/90 bg-slate-900/50 hover:border-indigo-500/40 hover:bg-slate-900/75 backdrop-blur-md transition-all p-5 sm:p-6 shadow-lg shadow-slate-950/30 space-y-4"
                    >
                      {/* Card Header: Creator + Activity Context + Follow */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Link
                            href={`/profile/${item.actor.username}`}
                            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0 shadow-md shadow-indigo-950/50"
                          >
                            {item.actor.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.actor.avatarUrl}
                                alt={item.actor.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              item.actor.displayName.charAt(0).toUpperCase()
                            )}
                          </Link>

                          <div className="min-w-0">
                            <p className="text-sm text-slate-300 leading-snug">
                              <Link
                                href={`/profile/${item.actor.username}`}
                                className="font-bold text-white hover:text-indigo-300 transition-colors"
                              >
                                {item.actor.displayName}
                              </Link>{" "}
                              <span className="text-slate-400">{item.summary}</span>
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <Link
                                href={`/profile/${item.actor.username}`}
                                className="font-mono hover:text-slate-300"
                              >
                                @{item.actor.username}
                              </Link>
                              <span>·</span>
                              <span>{formatRelativeDate(item.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {isAuthenticated && !isOwnItem && (
                          <Button
                            type="button"
                            size="sm"
                            variant={item.actor.isFollowing ? "secondary" : "outline"}
                            disabled={followBusy}
                            onClick={() =>
                              handleToggleFollow(item.actor.id, item.actor.isFollowing)
                            }
                            className="gap-1.5 text-xs shrink-0 h-8"
                          >
                            {item.actor.isFollowing ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5 text-indigo-300" />
                                Follow
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Safe Published Media Preview (never draft/private media) */}
                      {item.project.previewImageUrl && (
                        <Link
                          href={targetHref}
                          className="block rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/70 max-h-80"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.project.previewImageUrl}
                            alt={item.project.title}
                            className="w-full h-full max-h-80 object-cover group-hover:scale-[1.01] transition-transform duration-300"
                          />
                        </Link>
                      )}

                      {/* Creative Work Summary */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                            {item.project.category}
                          </span>
                          {item.version && (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                item.version.status === "Final"
                                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                                  : "bg-sky-950/60 text-sky-300 border-sky-800/60"
                              }`}
                            >
                              {item.version.status === "Final" ? (
                                <Award className="w-3 h-3" />
                              ) : (
                                <GitBranch className="w-3 h-3" />
                              )}
                              v{item.version.versionNumber} · {item.version.status}
                            </span>
                          )}
                          {item.type === "PortfolioPublished" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60">
                              <Award className="w-3 h-3" />
                              Portfolio Showcase
                            </span>
                          )}
                        </div>

                        <Link href={targetHref} className="block">
                          <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
                            {item.project.title}
                          </h2>
                        </Link>

                        {item.project.description && (
                          <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                            {item.project.description}
                          </p>
                        )}
                      </div>

                      {/* Interaction Footer (Existing Like, Comment, & Project View APIs) */}
                      <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={!isAuthenticated || likeBusy}
                            onClick={() => handleToggleLike(item.project.id)}
                            title={isAuthenticated ? "Like project" : "Sign in to like"}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                              item.project.hasLiked
                                ? "border-rose-700/60 bg-rose-950/40 text-rose-300"
                                : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-rose-500/40 hover:text-rose-300"
                            } disabled:opacity-60`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                item.project.hasLiked ? "fill-rose-500 text-rose-500" : ""
                              }`}
                            />
                            <span>{item.project.likeCount}</span>
                          </button>

                          <Link
                            href={targetHref}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/50 text-slate-300 hover:border-indigo-500/40 hover:text-indigo-200 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{item.project.commentCount}</span>
                          </Link>
                        </div>

                        <Link
                          href={targetHref}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
                        >
                          <span>View Work</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}

                {/* Cursor Pagination Control */}
                {hasMore && nextCursor && (
                  <div className="pt-3 flex justify-center">
                    <Button
                      variant="secondary"
                      size="md"
                      isLoading={isLoadingMore}
                      onClick={() => fetchFeed(nextCursor)}
                      className="min-w-[180px]"
                    >
                      Load More Activity
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar: Creator Discovery & Quick Links */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 backdrop-blur-md p-5 space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Creators to Follow
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Discover active creators sharing public projects.
                  </p>
                </div>
              </div>

              {suggestedCreators.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  You&apos;re all caught up on suggested creators! Explore{" "}
                  <Link href="/discover" className="text-indigo-400 hover:underline">
                    Discover
                  </Link>{" "}
                  for more projects.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {suggestedCreators.map((creator) => {
                    const busy = Boolean(busyFollowIds[creator.id]);
                    return (
                      <div
                        key={creator.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-800/70 bg-slate-950/50 hover:border-indigo-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Link
                            href={`/profile/${creator.username}`}
                            className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
                          >
                            {creator.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={creator.avatarUrl}
                                alt={creator.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              creator.displayName.charAt(0).toUpperCase()
                            )}
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/profile/${creator.username}`}
                              className="text-xs font-bold text-white hover:text-indigo-300 block truncate"
                            >
                              {creator.displayName}
                            </Link>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              @{creator.username}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {creator.publicProjectCount} public{" "}
                              {creator.publicProjectCount === 1 ? "work" : "works"} ·{" "}
                              {creator.followerCount} followers
                            </p>
                          </div>
                        </div>

                        {isAuthenticated ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={creator.isFollowing ? "secondary" : "primary"}
                            disabled={busy}
                            onClick={() =>
                              handleToggleFollow(creator.id, creator.isFollowing)
                            }
                            className="text-[11px] px-2.5 h-7 shrink-0"
                          >
                            {creator.isFollowing ? "Following" : "Follow"}
                          </Button>
                        ) : (
                          <Link href={`/profile/${creator.username}`}>
                            <Button variant="ghost" size="sm" className="text-[11px] px-2 h-7">
                              View
                            </Button>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <Link
                  href="/discover"
                  className="text-indigo-300 hover:text-indigo-200 font-medium inline-flex items-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Browse Full Catalog
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/dashboard"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    My Workspace →
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
