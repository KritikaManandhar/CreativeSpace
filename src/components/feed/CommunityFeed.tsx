"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Bookmark,
  Feather,
  ImagePlus,
  MessageSquareText,
  PenLine,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  CelestialSpark,
  CreativeSpaceWordmark,
} from "@/components/landing/CreativeSpaceBrand";
import { MOCK_PROFILES, deriveInitials } from "@/data/mockProfiles";
import {
  COMMUNITY_HIGHLIGHTS,
  FEED_CREATORS,
  FEED_DISCIPLINES,
  INITIAL_FEED_POSTS,
  SUGGESTED_CREATOR_HANDLES,
  type FeedCommentItem,
  type FeedCreatorSummary,
  type FeedDiscipline,
  type FeedDisciplineFilter,
  type FeedPostItem,
  type FeedPostKind,
  type FeedReplyItem,
  type FeedSortOption,
  type FeedStreamTab,
} from "@/data/mockFeed";
import { AuthenticatedNavbar } from "@/components/navigation/AuthenticatedNavbar";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { FeedSidebar } from "@/components/feed/FeedSidebar";
import { PostComposerModal } from "@/components/feed/PostComposerModal";

const INITIAL_VISIBLE_COUNT = 6;

function buildInitialFollowingMap(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  Object.values(FEED_CREATORS).forEach((creator) => {
    map[creator.username] = creator.defaultFollowing;
  });
  return map;
}

/**
 * Main CreativeSpace Community Feed component displayed as the authenticated home stream
 * and at `/feed`, styled with the landing page's calm cream-forest-lavender visual language.
 */
export function CommunityFeed() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.id);
  const previewProfile = MOCK_PROFILES.anya_art;

  const currentAuthor: FeedCreatorSummary = useMemo(() => {
    if (!isAuthenticated || !session?.user) {
      return FEED_CREATORS.anya_art;
    }

    const sessionUsername = session.user.username || previewProfile.username;
    const known = FEED_CREATORS[sessionUsername];
    if (known) {
      return {
        ...known,
        displayName: session.user.displayName || known.displayName,
        avatarUrl: session.user.avatarUrl ?? known.avatarUrl,
      };
    }

    const displayName =
      session.user.displayName || session.user.name || sessionUsername;
    const firstDiscipline = (session.user.disciplines?.[0] ||
      "Illustration") as FeedDiscipline;
    const validDiscipline = FEED_DISCIPLINES.includes(
      firstDiscipline as FeedDisciplineFilter
    ) && firstDiscipline !== ("All" as FeedDiscipline)
      ? firstDiscipline
      : "Illustration";

    return {
      id: session.user.id,
      username: sessionUsername,
      displayName,
      headline: "CreativeSpace Studio Member",
      bio: "Sharing works-in-progress and creative notes on CreativeSpace.",
      initials: deriveInitials(displayName),
      avatarTone: "#203B35",
      avatarAccent: "#C8BDE0",
      avatarUrl: session.user.avatarUrl ?? null,
      primaryDiscipline: validDiscipline,
      disciplines: [validDiscipline],
      location: "Studio Member",
      followersCount: 1,
      projectsCount: 0,
      defaultFollowing: false,
    };
  }, [isAuthenticated, previewProfile.username, session]);

  // Local React state for posts, interactions, filters, and composer preview
  const [posts, setPosts] = useState<FeedPostItem[]>(() => INITIAL_FEED_POSTS);
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Record<string, boolean>>({});
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>(
    buildInitialFollowingMap
  );

  // Filters, search & pagination
  const [activeStream, setActiveStream] = useState<FeedStreamTab>("for-you");
  const [activeDiscipline, setActiveDiscipline] = useState<FeedDisciplineFilter>("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<FeedSortOption>("recent");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  // Composer Modal state & gentle local session notice
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<FeedPostKind>("Studio Note");
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [hasSessionChanges, setHasSessionChanges] = useState(false);

  const resolveAuthor = (username: string): FeedCreatorSummary => {
    if (username === currentAuthor.username) return currentAuthor;
    return (
      FEED_CREATORS[username] ?? {
        id: `creator-${username}`,
        username,
        displayName: username,
        headline: "CreativeSpace Member",
        bio: "",
        initials: deriveInitials(username),
        avatarTone: "#203B35",
        avatarAccent: "#9DB5A5",
        avatarUrl: null,
        primaryDiscipline: "Illustration",
        disciplines: ["Illustration"],
        location: "CreativeSpace",
        followersCount: 0,
        projectsCount: 0,
        defaultFollowing: false,
      }
    );
  };

  // Clear highlight outline after a short focus cue
  useEffect(() => {
    if (!highlightedPostId) return;
    const timer = window.setTimeout(() => setHighlightedPostId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [highlightedPostId]);

  const handleToggleLike = (postId: string) => {
    setLikedPostIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleToggleBookmark = (postId: string) => {
    setBookmarkedPostIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleToggleCommentLike = (commentId: string) => {
    setLikedCommentIds((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleToggleFollow = (username: string) => {
    setFollowedCreators((prev) => ({ ...prev, [username]: !prev[username] }));
  };

  const handleAddComment = (postId: string, content: string) => {
    const newComment: FeedCommentItem = {
      id: `local-comment-${Date.now()}`,
      authorName: currentAuthor.displayName,
      authorHandle: currentAuthor.username,
      initials: currentAuthor.initials,
      tone: currentAuthor.avatarTone,
      accent: currentAuthor.avatarAccent,
      avatarUrl: currentAuthor.avatarUrl,
      createdAt: "Just now",
      content,
      likeCount: 0,
      replies: [],
    };

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
    setHasSessionChanges(true);
  };

  const handleAddReply = (postId: string, commentId: string, content: string) => {
    const newReply: FeedReplyItem = {
      id: `local-reply-${Date.now()}`,
      authorName: currentAuthor.displayName,
      authorHandle: currentAuthor.username,
      initials: currentAuthor.initials,
      tone: currentAuthor.avatarTone,
      accent: currentAuthor.avatarAccent,
      avatarUrl: currentAuthor.avatarUrl,
      createdAt: "Just now",
      content,
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map((comment) =>
            comment.id === commentId
              ? { ...comment, replies: [...comment.replies, newReply] }
              : comment
          ),
        };
      })
    );
    setHasSessionChanges(true);
  };

  const handlePublishPreviewPost = (newPost: FeedPostItem) => {
    setPosts((prev) => [newPost, ...prev]);
    setActiveStream("for-you");
    setActiveDiscipline("All");
    setActiveTag(null);
    setSearchQuery("");
    setSortOrder("recent");
    setHasSessionChanges(true);
    setSessionNotice(
      "Post added to your local community feed preview — interactions remain in React session state only."
    );
  };

  const handleResetPreview = () => {
    setPosts(INITIAL_FEED_POSTS);
    setLikedPostIds({});
    setBookmarkedPostIds({});
    setLikedCommentIds({});
    setFollowedCreators(buildInitialFollowingMap());
    setHasSessionChanges(false);
    setSessionNotice(null);
  };

  const openComposerWithKind = (kind: FeedPostKind) => {
    setComposerKind(kind);
    setComposerOpen(true);
  };

  const resetFilters = () => {
    setActiveStream("for-you");
    setActiveDiscipline("All");
    setActiveTag(null);
    setSearchQuery("");
  };

  const handleJumpToPost = (postId: string) => {
    resetFilters();
    setVisibleCount(posts.length);
    setHighlightedPostId(postId);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const element = document.getElementById(`feed-post-${postId}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  };

  const followingFeedCount = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.authorUsername === currentAuthor.username ||
          Boolean(followedCreators[post.authorUsername])
      ).length,
    [posts, followedCreators, currentAuthor.username]
  );

  const savedCount = useMemo(
    () => posts.filter((post) => Boolean(bookmarkedPostIds[post.id])).length,
    [posts, bookmarkedPostIds]
  );

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const list = posts.filter((post) => {
      if (activeStream === "following") {
        const isFollowed =
          post.authorUsername === currentAuthor.username ||
          Boolean(followedCreators[post.authorUsername]);
        if (!isFollowed) return false;
      } else if (activeStream === "critiques") {
        if (post.kind !== "Critique Request" && post.comments.length === 0) {
          return false;
        }
      } else if (activeStream === "saved") {
        if (!bookmarkedPostIds[post.id]) return false;
      }

      if (activeDiscipline !== "All" && post.discipline !== activeDiscipline) {
        return false;
      }

      if (activeTag && !post.tags.includes(activeTag)) {
        return false;
      }

      if (normalizedQuery) {
        const author = resolveAuthor(post.authorUsername);
        const haystack = [
          post.title ?? "",
          post.content,
          post.discipline,
          post.kind,
          post.projectRef?.title ?? "",
          author.displayName,
          author.username,
          ...post.tags,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });

    if (sortOrder === "appreciated") {
      return [...list].sort(
        (a, b) =>
          b.likeCount +
          (likedPostIds[b.id] ? 1 : 0) -
          (a.likeCount + (likedPostIds[a.id] ? 1 : 0))
      );
    }

    return [...list].sort((a, b) => b.sortOrder - a.sortOrder);
  }, [
    posts,
    activeStream,
    activeDiscipline,
    activeTag,
    searchQuery,
    sortOrder,
    followedCreators,
    bookmarkedPostIds,
    likedPostIds,
    currentAuthor.username,
  ]);

  const visiblePosts = useMemo(
    () => filteredPosts.slice(0, visibleCount),
    [filteredPosts, visibleCount]
  );

  const suggestedCreators = useMemo(
    () =>
      SUGGESTED_CREATOR_HANDLES.map((handle) => FEED_CREATORS[handle]).filter(
        Boolean
      ),
    []
  );

  const trendingPosts = useMemo(
    () =>
      [...posts]
        .map((post) => ({
          post,
          author: resolveAuthor(post.authorUsername),
          displayLikes: post.likeCount + (likedPostIds[post.id] ? 1 : 0),
        }))
        .sort((a, b) => b.displayLikes - a.displayLikes)
        .slice(0, 4),
    [posts, likedPostIds]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<FeedDiscipline, number>();
    posts.forEach((post) => {
      counts.set(post.discipline, (counts.get(post.discipline) ?? 0) + 1);
    });
    return FEED_DISCIPLINES.filter(
      (item): item is FeedDiscipline => item !== "All"
    ).map((discipline) => ({
      discipline,
      count: counts.get(discipline) ?? 0,
    }));
  }, [posts]);

  const firstName = currentAuthor.displayName.split(/\s+/)[0] || "Maker";
  const hasActiveFilters =
    activeStream !== "for-you" ||
    activeDiscipline !== "All" ||
    activeTag !== null ||
    searchQuery.trim().length > 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen w-full bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] flex flex-col justify-between overflow-x-clip">
        {/* Ambient Cream Paper Grain & Soft Sage/Lavender Glow */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden select-none"
          aria-hidden="true"
        >
          <div className="editorial-grain absolute inset-0 opacity-45" />
          <div className="absolute -top-28 right-[8%] h-[420px] w-[420px] rounded-full bg-[#C8BDE0]/20 blur-[120px]" />
          <div className="absolute top-[24%] -left-28 h-[380px] w-[380px] rounded-full bg-[#9DB5A5]/15 blur-[110px]" />
        </div>

        {/* Shared Authenticated Navigation */}
        <AuthenticatedNavbar
          activeNav="home"
          onCreatePost={() => openComposerWithKind("Studio Note")}
        />

        {/* Main Content Container */}
        <main className="relative z-10 mx-auto w-full max-w-[1320px] flex-1 px-4 sm:px-8 lg:px-12 pt-6 sm:pt-9 pb-12">
          {/* Calm Editorial Journal Masthead */}
          <section
            aria-label="Community feed introduction"
            className="mb-6 sm:mb-8 pb-6 border-b border-[#203B35]/12 flex flex-col md:flex-row md:items-end justify-between gap-4"
          >
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2.5">
                <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
                <span className="font-mono text-[10.5px] sm:text-[11px] uppercase tracking-[0.22em] text-[#203B35]/75">
                  Edition № 14 · Studio Journal
                </span>
                <span className="hidden sm:inline-block h-[1px] w-8 bg-[#9DB5A5]/70" />
                {!isAuthenticated && (
                  <span className="rounded-full border border-[#203B35]/12 bg-[#FAF8F3] px-2.5 py-0.5 font-mono text-[10px] text-[#5D635F]">
                    Frontend Preview
                  </span>
                )}
              </div>

              <h1 className="font-serif text-[2.25rem] sm:text-[2.9rem] lg:text-[3.25rem] font-normal leading-[1.03] tracking-[-0.025em] text-[#203B35]">
                Today in the{" "}
                <span className="relative inline-block">
                  studio,
                  <svg
                    viewBox="0 0 140 12"
                    fill="none"
                    className="pointer-events-none absolute -bottom-1 left-0 w-full h-2.5 text-[#9DB5A5]"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9C38 3 95 2 138 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                <span className="italic font-normal">{firstName}.</span>
              </h1>

              <p className="text-[14.5px] sm:text-[15.5px] leading-[1.65] text-[#282B2A]/80">
                Process notes, fresh plates, open critiques, and quiet updates shared
                by makers across CreativeSpace.
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-[11.5px] font-mono text-[#5D635F]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4E9F76]" />
                  <span>Curated Studio Feed</span>
                </span>
                <span className="text-[#9DB5A5]">·</span>
                <span>8 Creative Disciplines</span>
                <span className="text-[#9DB5A5]">·</span>
                <span>11 Active Discussions</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href={`/profile/${encodeURIComponent(currentAuthor.username)}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#203B35]/18 bg-[#FAF8F3] px-4 py-2 text-[13px] font-medium text-[#203B35] hover:border-[#203B35]/40 hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
              >
                <FeedAvatar
                  avatarUrl={currentAuthor.avatarUrl}
                  initials={currentAuthor.initials}
                  tone={currentAuthor.avatarTone}
                  accent={currentAuthor.avatarAccent}
                  name={currentAuthor.displayName}
                  size="xs"
                />
                <span>My Studio Folio</span>
              </Link>

              <button
                type="button"
                onClick={() => openComposerWithKind("Studio Note")}
                className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              >
                <PenLine className="h-3.5 w-3.5 text-[#9DB5A5]" />
                <span>Share Work or Note</span>
              </button>
            </div>
          </section>

          {/* Local Preview Status Banner (when local posts/replies have been added) */}
          <AnimatePresence>
            {(sessionNotice || hasSessionChanges) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                role="status"
                className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#9DB5A5]/55 bg-[#FAF8F3] px-4 sm:px-5 py-3 text-[13px] text-[#203B35] shadow-sm"
              >
                <div className="flex items-start sm:items-center gap-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#4E9F76] mt-0.5 sm:mt-0" />
                  <span>
                    {sessionNotice ||
                      "Local community preview active — new posts and replies live in React state only."}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {hasSessionChanges && (
                    <button
                      type="button"
                      onClick={handleResetPreview}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#F6F3EB] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset Feed</span>
                    </button>
                  )}
                  {sessionNotice && (
                    <button
                      type="button"
                      onClick={() => setSessionNotice(null)}
                      aria-label="Dismiss preview banner"
                      className="rounded-full p-1 text-[#5D635F] hover:text-[#203B35]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Asymmetric Grid: Feed Column (8 cols) + Community Sidebar (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* =============================================================== */}
            {/* LEFT / MAIN COMMUNITY FEED STREAM                               */}
            {/* =============================================================== */}
            <div className="lg:col-span-8 space-y-6">
              {/* Calm Composer Prompt Strip */}
              <div className="rounded-[22px] border border-[#203B35]/14 bg-[#FAF8F3] p-4 sm:p-5 space-y-3.5 shadow-[0_4px_22px_-12px_rgba(32,59,53,0.06)]">
                <div className="flex items-center gap-3">
                  <FeedAvatar
                    avatarUrl={currentAuthor.avatarUrl}
                    initials={currentAuthor.initials}
                    tone={currentAuthor.avatarTone}
                    accent={currentAuthor.avatarAccent}
                    name={currentAuthor.displayName}
                    size="md"
                  />
                  <button
                    type="button"
                    onClick={() => openComposerWithKind("Studio Note")}
                    className="flex-1 text-left rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-4 py-2.5 text-[13.5px] sm:text-[14px] text-[#5D635F] hover:border-[#203B35]/35 hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9DB5A5]"
                  >
                    Share a studio note, work-in-progress plate, or critique question...
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#203B35]/10">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openComposerWithKind("Process Log")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/12 bg-[#F6F3EB] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:border-[#203B35]/30 transition-colors"
                    >
                      <ImagePlus className="h-3.5 w-3.5 text-[#9DB5A5]" />
                      <span>Process &amp; Media</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openComposerWithKind("Critique Request")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/12 bg-[#F6F3EB] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:border-[#203B35]/30 transition-colors"
                    >
                      <MessageSquareText className="h-3.5 w-3.5 text-[#9DB5A5]" />
                      <span>Ask Critique</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openComposerWithKind("Milestone")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/12 bg-[#F6F3EB] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:border-[#203B35]/30 transition-colors"
                    >
                      <Feather className="h-3.5 w-3.5 text-[#9DB5A5]" />
                      <span>Share Milestone</span>
                    </button>
                  </div>

                  <span className="font-mono text-[10.5px] text-[#92958F]">
                    Preview composer
                  </span>
                </div>
              </div>

              {/* Feed Stream Controls: Tabs, Search, Sort & Disciplines */}
              <div className="rounded-[22px] border border-[#203B35]/14 bg-[#FAF8F3] p-4 sm:p-5 space-y-4 shadow-[0_4px_22px_-12px_rgba(32,59,53,0.06)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Stream Switcher Tabs */}
                  <div
                    role="tablist"
                    aria-label="Feed stream views"
                    className="grid grid-cols-2 sm:inline-flex items-center rounded-2xl sm:rounded-full border border-[#203B35]/15 bg-[#F6F3EB] p-1 gap-1 sm:gap-0"
                  >
                    {(
                      [
                        { id: "for-you", label: "For You" },
                        {
                          id: "following",
                          label: "Following",
                          badge: followingFeedCount,
                        },
                        { id: "critiques", label: "Critiques" },
                        { id: "saved", label: "Saved", badge: savedCount },
                      ] as const
                    ).map((tab) => {
                      const active = activeStream === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setActiveStream(tab.id)}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-full px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                            active
                              ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                              : "text-[#5D635F] hover:text-[#203B35]"
                          }`}
                        >
                          <span>{tab.label}</span>
                          {"badge" in tab && tab.badge > 0 && (
                            <span
                              className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] tabular-nums ${
                                active
                                  ? "bg-[#F6F3EB]/20 text-[#F6F3EB]"
                                  : "bg-[#EFECE2] text-[#203B35]"
                              }`}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sort Order */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <label
                      htmlFor="feed-sort-select"
                      className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]"
                    >
                      Sort
                    </label>
                    <select
                      id="feed-sort-select"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as FeedSortOption)}
                      className="rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-3 py-1.5 text-[12.5px] font-medium text-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                    >
                      <option value="recent">Latest Notes</option>
                      <option value="appreciated">Most Appreciated</option>
                    </select>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5D635F]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts, creators (@handle), mediums, or #tags..."
                    aria-label="Search community feed"
                    className="w-full h-10 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] pl-10 pr-10 text-[13.5px] text-[#282B2A] placeholder:text-[#92958F] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear feed search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#5D635F] hover:text-[#203B35]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Creative Discipline Filter Pills */}
                <div
                  className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="group"
                  aria-label="Filter community posts by discipline"
                >
                  {FEED_DISCIPLINES.map((discipline) => {
                    const active = activeDiscipline === discipline;
                    return (
                      <button
                        key={discipline}
                        type="button"
                        onClick={() => setActiveDiscipline(discipline)}
                        aria-pressed={active}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                          active
                            ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                            : "border border-[#203B35]/12 bg-[#F6F3EB] text-[#282B2A]/80 hover:border-[#203B35]/30 hover:text-[#203B35]"
                        }`}
                      >
                        {discipline}
                      </button>
                    );
                  })}
                </div>

                {/* Active Hashtag / Filter Pill Summary */}
                {activeTag && (
                  <div className="flex items-center justify-between gap-2 pt-1 text-[12px] text-[#5D635F]">
                    <span>
                      Filtering by tag{" "}
                      <span className="font-mono font-medium text-[#203B35]">
                        #{activeTag}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTag(null)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#EFECE2] px-2.5 py-0.5 text-[11.5px] font-medium text-[#203B35] hover:bg-[#9DB5A5]/30"
                    >
                      <span>Clear tag</span>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Feed Posts List or Thoughtful Empty State */}
              {visiblePosts.length === 0 ? (
                <div className="rounded-[20px] border border-[#203B35]/14 bg-[#FAF8F3] px-6 py-14 text-center space-y-3">
                  <CelestialSpark className="h-5 w-5 text-[#9DB5A5] mx-auto" />
                  <h2 className="font-serif text-2xl text-[#203B35]">
                    {activeStream === "saved"
                      ? "Your saved studio shelf is empty"
                      : "No studio entries match this filter"}
                  </h2>
                  <p className="text-[14px] text-[#5D635F] max-w-md mx-auto leading-relaxed">
                    {activeStream === "saved"
                      ? "Bookmark posts from across the community to collect visual studies, color notes, and essays for later."
                      : "Try clearing your search or switching back to all creative disciplines."}
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-2.5">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-[#9DB5A5]" />
                        <span>View All Posts</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5 sm:space-y-6">
                  {visiblePosts.map((post, idx) => {
                    const author = resolveAuthor(post.authorUsername);
                    return (
                      <FeedPostCard
                        key={post.id}
                        post={post}
                        author={author}
                        isLiked={Boolean(likedPostIds[post.id])}
                        isBookmarked={Boolean(bookmarkedPostIds[post.id])}
                        isFollowingAuthor={
                          post.authorUsername === currentAuthor.username ||
                          Boolean(followedCreators[post.authorUsername])
                        }
                        isHighlighted={highlightedPostId === post.id}
                        priorityMedia={idx === 0}
                        likedCommentIds={likedCommentIds}
                        onToggleLike={handleToggleLike}
                        onToggleBookmark={handleToggleBookmark}
                        onToggleFollow={handleToggleFollow}
                        onAddComment={handleAddComment}
                        onAddReply={handleAddReply}
                        onToggleCommentLike={handleToggleCommentLike}
                        onSelectTag={(tag) =>
                          setActiveTag((prev) => (prev === tag ? null : tag))
                        }
                        onSelectDiscipline={(disc) =>
                          setActiveDiscipline((prev) => (prev === disc ? "All" : disc))
                        }
                      />
                    );
                  })}

                  {/* Incremental Feed Reveal */}
                  {filteredPosts.length > visibleCount ? (
                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCount((prev) => prev + INITIAL_VISIBLE_COUNT)
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-6 py-2.5 text-[13.5px] font-medium text-[#203B35] hover:border-[#203B35] hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                      >
                        <span>
                          Load more studio posts ({filteredPosts.length - visibleCount}{" "}
                          remaining)
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 flex items-center justify-center gap-2 text-[12px] font-mono text-[#5D635F]">
                      <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
                      <span>You&apos;ve reached the quiet end of today&apos;s edition.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* RIGHT SIDEBAR: CREATORS, TRENDING, CATEGORIES, HIGHLIGHTS       */}
            {/* =============================================================== */}
            <div className="lg:col-span-4">
              <FeedSidebar
                suggestedCreators={suggestedCreators}
                trendingPosts={trendingPosts}
                categoryCounts={categoryCounts}
                highlights={COMMUNITY_HIGHLIGHTS}
                activeDiscipline={activeDiscipline}
                followedMap={followedCreators}
                onToggleFollow={handleToggleFollow}
                onSelectDiscipline={setActiveDiscipline}
                onJumpToPost={handleJumpToPost}
              />
            </div>
          </div>
        </main>

        {/* Calm Editorial Footer */}
        <footer className="relative z-10 mt-10 w-full border-t border-[#203B35]/10 bg-[#F6F3EB]">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={isAuthenticated ? "/" : "/feed"}
                className="inline-flex items-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                aria-label="CreativeSpace Community Feed"
              >
                <CreativeSpaceWordmark variant="dark" />
              </Link>
              <span className="hidden md:inline-block text-xs text-[#5D635F]">
                · Where raw ideas become exhibited work.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-[13px] text-[#5D635F]">
              <Link href="/explore" className="hover:text-[#203B35] transition-colors">
                Explore
              </Link>
              <Link href="/ideas" className="hover:text-[#203B35] transition-colors">
                Ideas
              </Link>
              <Link href="/dashboard" className="hover:text-[#203B35] transition-colors">
                Dashboard
              </Link>
              <Link
                href={`/profile/${encodeURIComponent(currentAuthor.username)}`}
                className="hover:text-[#203B35] transition-colors"
              >
                My Profile
              </Link>
              <span className="font-mono text-[11px] text-[#5D635F]/80">
                © {new Date().getFullYear()} CreativeSpace
              </span>
            </div>
          </div>
        </footer>

        {/* Create Post Modal (with live text & media frontend preview) */}
        <PostComposerModal
          isOpen={composerOpen}
          initialKind={composerKind}
          currentAuthor={currentAuthor}
          onClose={() => setComposerOpen(false)}
          onPublishPreviewPost={handlePublishPreviewPost}
        />
      </div>
    </MotionConfig>
  );
}
