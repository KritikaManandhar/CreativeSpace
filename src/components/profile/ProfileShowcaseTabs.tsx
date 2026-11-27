"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Briefcase,
  Feather,
  GitBranch,
  Heart,
  Layers,
  Lightbulb,
  MessageCircle,
  Plus,
  Send,
  User,
} from "lucide-react";
import { CelestialSpark, CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import type {
  PostKind,
  ProfilePerspective,
  ProfilePostComment,
  ProfilePostItem,
  ProfileServiceItem,
  UserProfileRecord,
} from "@/data/mockProfiles";
import {
  ProfileProjectCard,
  type ProfileDisplayProject,
} from "./ProfileProjectCard";
import { ProfileServicesTab } from "./ProfileServicesTab";
import { ProfileIdeasTab } from "./ProfileIdeasTab";
import { ProfileAboutTab } from "./ProfileAboutTab";

export type ProfileTab = "works" | "services" | "posts" | "ideas" | "about";

interface ProfileShowcaseTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  perspective: ProfilePerspective;
  profile: UserProfileRecord;
  projects: ProfileDisplayProject[];
  projectsLoading?: boolean;
  projectsError?: string | null;
  onRetryProjects?: () => void;
  publishedServicesCount: number;
  likedProjectIds: Record<string, boolean>;
  savedProjectIds: Record<string, boolean>;
  likedPostIds: Record<string, boolean>;
  savedPostIds: Record<string, boolean>;
  onToggleProjectLike: (projectId: string) => void;
  onToggleProjectSave: (projectId: string) => void;
  onSelectProject: (project: ProfileDisplayProject) => void;
  onSelectService: (service: ProfileServiceItem, initialMode?: "details" | "booking") => void;
  onTogglePostLike: (postId: string) => void;
  onTogglePostSave: (postId: string) => void;
  onAddPostComment: (postId: string, comment: ProfilePostComment) => void;
  onAddLocalPost: (post: ProfilePostItem) => void;
  onOpenEditModal: () => void;
  onOpenSocialModal: (tab: "followers" | "following") => void;
}

const POST_KINDS: Array<"All" | PostKind> = [
  "All",
  "Process Log",
  "Studio Note",
  "Critique Request",
  "Milestone",
];

function getPostKindBadgeStyle(kind: PostKind): string {
  switch (kind) {
    case "Process Log":
      return "bg-[#9DB5A5]/25 text-[#203B35] border-[#9DB5A5]/45";
    case "Critique Request":
      return "bg-[#C8BDE0]/30 text-[#203B35] border-[#C8BDE0]/55";
    case "Milestone":
      return "bg-[#203B35] text-[#F6F3EB] border-[#203B35]";
    default:
      return "bg-[#EFECE2] text-[#203B35] border-[#203B35]/15";
  }
}

export function ProfileShowcaseTabs({
  activeTab,
  onTabChange,
  perspective,
  profile,
  projects,
  projectsLoading = false,
  projectsError = null,
  onRetryProjects,
  publishedServicesCount,
  likedProjectIds,
  savedProjectIds,
  likedPostIds,
  savedPostIds,
  onToggleProjectLike,
  onToggleProjectSave,
  onSelectProject,
  onSelectService,
  onTogglePostLike,
  onTogglePostSave,
  onAddPostComment,
  onAddLocalPost,
  onOpenEditModal,
  onOpenSocialModal,
}: ProfileShowcaseTabsProps) {
  const {
    displayName: ownerDisplayName,
    username: ownerUsername,
    avatarInitials: ownerInitials,
    avatarTone: ownerTone,
    avatarAccent: ownerAccent,
    services,
    posts,
    ideas,
  } = profile;
  const visibleServicesCount =
    perspective === "owner" ? services.length : publishedServicesCount;
  const [disciplineFilter, setDisciplineFilter] = useState<string>("All");
  const [projectSort, setProjectSort] = useState<"featured" | "likes" | "recent">("featured");
  const [postKindFilter, setPostKindFilter] = useState<"All" | PostKind>("All");
  const [expandedPostComments, setExpandedPostComments] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Local-only studio note composer (visible in Owner View on Posts tab)
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftKind, setDraftKind] = useState<PostKind>("Studio Note");
  const [draftContent, setDraftContent] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);

  const availableDisciplines = useMemo(() => {
    const set = new Set<string>(projects.map((p) => p.discipline));
    return ["All", ...Array.from(set)];
  }, [projects]);

  const effectiveDisciplineFilter = availableDisciplines.includes(disciplineFilter)
    ? disciplineFilter
    : "All";

  const filteredProjects = useMemo(() => {
    const base =
      effectiveDisciplineFilter === "All"
        ? [...projects]
        : projects.filter((p) => p.discipline === effectiveDisciplineFilter);

    if (projectSort === "likes") {
      return base.sort((a, b) => {
        const bLiked = Boolean(likedProjectIds[b.id]);
        const bInitial = Boolean(b.hasLiked);
        const bScore = b.likeCount + (bLiked === bInitial ? 0 : bLiked ? 1 : -1);
        const aLiked = Boolean(likedProjectIds[a.id]);
        const aInitial = Boolean(a.hasLiked);
        const aScore = a.likeCount + (aLiked === aInitial ? 0 : aLiked ? 1 : -1);
        return bScore - aScore;
      });
    }
    if (projectSort === "featured") {
      return base.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return base;
  }, [projects, effectiveDisciplineFilter, projectSort, likedProjectIds]);

  const filteredPosts = useMemo(() => {
    if (postKindFilter === "All") return posts;
    return posts.filter((post) => post.kind === postKindFilter);
  }, [posts, postKindFilter]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBody = draftContent.trim();
    if (cleanBody.length < 10) {
      setComposerError("Share at least 10 characters for your studio note preview.");
      return;
    }

    const parsedTags = draftTags
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean)
      .slice(0, 4);

    const newPost: ProfilePostItem = {
      id: `local-post-${Date.now()}`,
      kind: draftKind,
      title: draftTitle.trim() || undefined,
      content: cleanBody,
      createdAt: "Just now · Local preview",
      tags: parsedTags.length > 0 ? parsedTags : ["studio-note"],
      likeCount: 0,
      comments: [],
    };

    onAddLocalPost(newPost);
    setDraftTitle("");
    setDraftContent("");
    setDraftTags("");
    setComposerError(null);
    setComposerOpen(false);
    setPostKindFilter("All");
  };

  const handleSubmitReply = (postId: string) => {
    const text = (replyDrafts[postId] || "").trim();
    if (!text) return;

    const newComment: ProfilePostComment = {
      id: `local-reply-${Date.now()}`,
      authorName: perspective === "owner" ? ownerDisplayName : "Visiting Creator",
      authorHandle: perspective === "owner" ? ownerUsername : "visitor_studio",
      initials: perspective === "owner" ? ownerInitials : "VC",
      tone: perspective === "owner" ? ownerTone : "#384A43",
      accent: perspective === "owner" ? ownerAccent : "#9DB5A5",
      createdAt: "Just now",
      content: text,
    };

    onAddPostComment(postId, newComment);
    setReplyDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <section
      id="profile-showcase"
      aria-label="Creator works and studio posts"
      className="mt-10 sm:mt-12"
    >
      {/* Unified Tab Header & Sub-Filters */}
      <div className="flex flex-col gap-5 border-b border-[#203B35]/15 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Primary Tabs: Works | Services | Posts | Ideas | About */}
          <div
            role="tablist"
            aria-label="Profile showcase sections"
            className="flex sm:inline-flex w-full sm:w-fit items-center overflow-x-auto rounded-full border border-[#203B35]/15 bg-[#FAF8F3] p-1 gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "works"}
              id="tab-works"
              aria-controls="panel-works"
              onClick={() => onTabChange("works")}
              className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-2 text-[12px] sm:text-[13.5px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                activeTab === "works"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <Layers className="hidden sm:inline h-3.5 w-3.5 shrink-0" />
              <span>Works</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 font-mono text-[10px] sm:text-[10.5px] tabular-nums ${
                  activeTab === "works"
                    ? "bg-[#F6F3EB]/20 text-[#F6F3EB]"
                    : "bg-[#EFECE2] text-[#203B35]"
                }`}
              >
                {projects.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "services"}
              id="tab-services"
              aria-controls="panel-services"
              onClick={() => onTabChange("services")}
              className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-2 text-[12px] sm:text-[13.5px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                activeTab === "services"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <Briefcase className="hidden sm:inline h-3.5 w-3.5 shrink-0" />
              <span>Services</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 font-mono text-[10px] sm:text-[10.5px] tabular-nums ${
                  activeTab === "services"
                    ? "bg-[#F6F3EB]/20 text-[#F6F3EB]"
                    : "bg-[#EFECE2] text-[#203B35]"
                }`}
              >
                {visibleServicesCount}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "posts"}
              id="tab-posts"
              aria-controls="panel-posts"
              onClick={() => onTabChange("posts")}
              className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-2 text-[12px] sm:text-[13.5px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                activeTab === "posts"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <Feather className="hidden sm:inline h-3.5 w-3.5 shrink-0" />
              <span>Posts</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 font-mono text-[10px] sm:text-[10.5px] tabular-nums ${
                  activeTab === "posts"
                    ? "bg-[#F6F3EB]/20 text-[#F6F3EB]"
                    : "bg-[#EFECE2] text-[#203B35]"
                }`}
              >
                {posts.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ideas"}
              id="tab-ideas"
              aria-controls="panel-ideas"
              onClick={() => onTabChange("ideas")}
              className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-2 text-[12px] sm:text-[13.5px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                activeTab === "ideas"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <Lightbulb className="hidden sm:inline h-3.5 w-3.5 shrink-0" />
              <span>Ideas</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 font-mono text-[10px] sm:text-[10.5px] tabular-nums ${
                  activeTab === "ideas"
                    ? "bg-[#F6F3EB]/20 text-[#F6F3EB]"
                    : "bg-[#EFECE2] text-[#203B35]"
                }`}
              >
                {ideas.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "about"}
              id="tab-about"
              aria-controls="panel-about"
              onClick={() => onTabChange("about")}
              className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-2 text-[12px] sm:text-[13.5px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                activeTab === "about"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <User className="hidden sm:inline h-3.5 w-3.5 shrink-0" />
              <span>About</span>
            </button>
          </div>

          {/* Right Action / Sort Controls */}
          {activeTab === "works" && (
            <div className="flex items-center gap-2.5">
              <label
                htmlFor="project-sort-select"
                className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]"
              >
                Order
              </label>
              <select
                id="project-sort-select"
                value={projectSort}
                onChange={(e) =>
                  setProjectSort(e.target.value as "featured" | "likes" | "recent")
                }
                className="rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3.5 py-1.5 text-[12.5px] font-medium text-[#203B35] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
              >
                <option value="featured">Featured First</option>
                <option value="likes">Most Appreciated</option>
                <option value="recent">Latest Works</option>
              </select>
            </div>
          )}

          {activeTab === "posts" && perspective === "owner" && (
            <button
              type="button"
              onClick={() => setComposerOpen((prev) => !prev)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-4 py-2 text-[13px] font-medium text-[#203B35] hover:border-[#203B35] hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
            >
              <Plus className="h-3.5 w-3.5 text-[#203B35]" />
              <span>{composerOpen ? "Close Note Draft" : "New Studio Note"}</span>
            </button>
          )}
        </div>

        {/* Sub-Filter Pills Row (Works & Posts) */}
        {activeTab === "works" && (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
            aria-label="Filter works by discipline"
          >
            {availableDisciplines.map((disc) => {
              const active = effectiveDisciplineFilter === disc;
              return (
                <button
                  key={disc}
                  type="button"
                  onClick={() => setDisciplineFilter(disc)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                    active
                      ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                      : "border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A]/80 hover:border-[#203B35]/30 hover:text-[#203B35]"
                  }`}
                >
                  {disc}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "posts" && (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
            aria-label="Filter posts by type"
          >
            {POST_KINDS.map((kind) => {
              const active = postKindFilter === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setPostKindFilter(kind)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                    active
                      ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                      : "border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A]/80 hover:border-[#203B35]/30 hover:text-[#203B35]"
                  }`}
                >
                  {kind}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* WORKS (PROJECTS) PANEL                                            */}
      {/* ================================================================= */}
      {activeTab === "works" && (
        <div
          id="panel-works"
          role="tabpanel"
          aria-labelledby="tab-works"
          className="mt-7"
        >
          {projectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {[0, 1, 2].map((skeletonIdx) => (
                <div
                  key={skeletonIdx}
                  className="rounded-[16px] border border-[#203B35]/10 bg-[#FAF8F3] p-3.5 space-y-3"
                >
                  <div className="aspect-[4/3] w-full rounded-[10px] bg-[#EFECE2] animate-pulse" />
                  <div className="h-5 w-3/4 rounded bg-[#EFECE2] animate-pulse" />
                  <div className="h-4 w-full rounded bg-[#EFECE2] animate-pulse" />
                </div>
              ))}
            </div>
          ) : projectsError ? (
            <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] px-6 py-14 text-center">
              <CelestialSpark className="h-5 w-5 text-[#9DB5A5] mx-auto mb-3" />
              <p className="font-serif text-2xl text-[#203B35]">
                Unable to load published works
              </p>
              <p className="mt-2 text-[14px] text-[#5D635F]">
                {projectsError}
              </p>
              {onRetryProjects && (
                <button
                  type="button"
                  onClick={onRetryProjects}
                  className="mt-5 rounded-full bg-[#203B35] px-5 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] px-6 py-14 text-center">
              <CelestialSpark className="h-5 w-5 text-[#9DB5A5] mx-auto mb-3" />
              <p className="font-serif text-2xl text-[#203B35]">
                {projects.length === 0
                  ? "No published works yet"
                  : "No projects in this discipline yet"}
              </p>
              <p className="mt-2 text-[14px] text-[#5D635F]">
                {projects.length === 0
                  ? `${ownerDisplayName} has not published any public projects yet.`
                  : `Switch back to All disciplines to explore ${ownerDisplayName}'s exhibited works.`}
              </p>
              {disciplineFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => setDisciplineFilter("All")}
                  className="mt-5 rounded-full bg-[#203B35] px-5 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
                >
                  Show All Projects
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {filteredProjects.map((project) => (
                <ProfileProjectCard
                  key={project.id}
                  project={project}
                  isLiked={Boolean(likedProjectIds[project.id])}
                  isSaved={Boolean(savedProjectIds[project.id])}
                  onToggleLike={onToggleProjectLike}
                  onToggleSave={onToggleProjectSave}
                  onSelectProject={onSelectProject}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* POSTS PANEL                                                       */}
      {/* ================================================================= */}
      {activeTab === "posts" && (
        <div
          id="panel-posts"
          role="tabpanel"
          aria-labelledby="tab-posts"
          className="mt-7 space-y-6"
        >
          {/* Local Studio Note Composer (Owner Preview Only) */}
          <AnimatePresence>
            {perspective === "owner" && composerOpen && (
              <motion.form
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleCreatePost}
                className="rounded-2xl border border-[#203B35]/20 bg-[#FAF8F3] p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#203B35]/10">
                  <div className="flex items-center gap-2">
                    <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#203B35]">
                      Compose Studio Note · Local Preview
                    </span>
                  </div>
                  <span className="text-[11.5px] text-[#5D635F]">
                    Stays in browser state only
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="note-draft-title"
                      className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                    >
                      Headline (Optional)
                    </label>
                    <input
                      id="note-draft-title"
                      type="text"
                      placeholder="e.g., Testing warm ivory stock for print proofs"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 px-3.5 text-[14px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="note-draft-kind"
                      className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                    >
                      Entry Kind
                    </label>
                    <select
                      id="note-draft-kind"
                      value={draftKind}
                      onChange={(e) => setDraftKind(e.target.value as PostKind)}
                      className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 px-3 text-[13.5px] text-[#203B35] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                    >
                      <option value="Studio Note">Studio Note</option>
                      <option value="Process Log">Process Log</option>
                      <option value="Critique Request">Critique Request</option>
                      <option value="Milestone">Milestone</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="note-draft-body"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                  >
                    Reflection / Update
                  </label>
                  <textarea
                    id="note-draft-body"
                    rows={3}
                    placeholder="Share a process thought, material observation, or question for the community..."
                    value={draftContent}
                    onChange={(e) => {
                      setDraftContent(e.target.value);
                      if (composerError) setComposerError(null);
                    }}
                    className="w-full rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 p-3.5 text-[14px] leading-relaxed text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                  />
                  {composerError && (
                    <p className="mt-1 text-[12px] text-[#9F311D]">{composerError}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Tags (comma separated, e.g. gouache, study)"
                    value={draftTags}
                    onChange={(e) => setDraftTags(e.target.value)}
                    aria-label="Post tags"
                    className="sm:max-w-xs w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 px-3.5 text-[13px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                  />
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(false)}
                      className="rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
                    >
                      <span>Publish Preview Note</span>
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] px-6 py-14 text-center">
              <Feather className="h-5 w-5 text-[#9DB5A5] mx-auto mb-3" />
              <p className="font-serif text-2xl text-[#203B35]">No studio posts here yet</p>
              <p className="mt-2 text-[14px] text-[#5D635F]">
                Try viewing all entries to read {ownerDisplayName}&apos;s notes and process logs.
              </p>
              <button
                type="button"
                onClick={() => setPostKindFilter("All")}
                className="mt-5 rounded-full bg-[#203B35] px-5 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                Show All Posts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {filteredPosts.map((post) => {
                const isLiked = Boolean(likedPostIds[post.id]);
                const isSaved = Boolean(savedPostIds[post.id]);
                const commentsOpen = Boolean(expandedPostComments[post.id]);
                const likesDisplay = post.likeCount + (isLiked ? 1 : 0);

                return (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-5 sm:p-6 space-y-4 transition-colors hover:border-[#203B35]/25"
                  >
                    {/* Header Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${getPostKindBadgeStyle(
                            post.kind
                          )}`}
                        >
                          {post.kind}
                        </span>
                        {post.projectRef && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F6F3EB] border border-[#203B35]/15 px-2.5 py-0.5 font-mono text-[10.5px] text-[#203B35]">
                            <GitBranch className="h-2.5 w-2.5 text-[#9DB5A5]" />
                            <span className="truncate max-w-[180px]">
                              {post.projectRef.title}
                              {post.projectRef.versionTag
                                ? ` · ${post.projectRef.versionTag}`
                                : ""}
                            </span>
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-[#5D635F]">
                        {post.createdAt}
                      </span>
                    </div>

                    {/* Title & Copy */}
                    <div className="space-y-2">
                      {post.title && (
                        <h3 className="font-serif text-[1.45rem] sm:text-[1.6rem] leading-[1.18] text-[#203B35]">
                          {post.title}
                        </h3>
                      )}
                      <p className="text-[14.5px] leading-[1.72] text-[#282B2A]/90">
                        {post.content}
                      </p>
                    </div>

                    {/* Optional Post Artwork */}
                    {post.imageUrl && (
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#203B35]/10 bg-[#EFECE2]">
                        <Image
                          src={post.imageUrl}
                          alt={post.imageAlt || "Studio post artwork"}
                          fill
                          sizes="(max-width: 1024px) 92vw, 44vw"
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-[#EFECE2]/85 px-2 py-0.5 font-mono text-[10.5px] text-[#5D635F]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-[#203B35]/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onTogglePostLike(post.id)}
                          aria-pressed={isLiked}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                            isLiked
                              ? "bg-[#203B35]/10 text-[#203B35] font-medium"
                              : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
                          }`}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${
                              isLiked ? "fill-[#203B35] text-[#203B35]" : ""
                            }`}
                          />
                          <span className="tabular-nums">{likesDisplay}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPostComments((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                          aria-expanded={commentsOpen}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                            commentsOpen
                              ? "bg-[#EFECE2] text-[#203B35] font-medium"
                              : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
                          }`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span className="tabular-nums">{post.comments.length}</span>
                          <span>{post.comments.length === 1 ? "Reply" : "Replies"}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onTogglePostSave(post.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Remove post bookmark" : "Bookmark post"}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                          isSaved
                            ? "bg-[#203B35] text-[#F6F3EB]"
                            : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
                        }`}
                      >
                        <Bookmark
                          className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`}
                        />
                      </button>
                    </div>

                    {/* Expandable Threaded Replies (Frontend Preview State) */}
                    <AnimatePresence initial={false}>
                      {commentsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-[#203B35]/10 pt-3.5 space-y-3"
                        >
                          {post.comments.length > 0 ? (
                            <div className="space-y-2.5">
                              {post.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex items-start gap-2.5 rounded-xl bg-[#F6F3EB] p-3 border border-[#203B35]/10"
                                >
                                  <CreatorAvatar
                                    initials={comment.initials}
                                    tone={comment.tone}
                                    accent={comment.accent}
                                    name={comment.authorName}
                                    size="xs"
                                  />
                                  <div className="min-w-0 flex-1 text-[12.5px]">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-medium text-[#203B35]">
                                        {comment.authorName}
                                      </span>
                                      <span className="font-mono text-[10.5px] text-[#5D635F]">
                                        @{comment.authorHandle}
                                      </span>
                                      <span className="text-[#9DB5A5]">·</span>
                                      <span className="text-[11px] text-[#5D635F]">
                                        {comment.createdAt}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-[#282B2A]/85 leading-relaxed">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[12.5px] text-[#5D635F]">
                              No replies yet. Add a studio note reply below.
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Write a reply preview..."
                              value={replyDrafts[post.id] || ""}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSubmitReply(post.id);
                                }
                              }}
                              aria-label="Reply to post"
                              className="flex-1 h-9 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-3.5 text-[12.5px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitReply(post.id)}
                              aria-label="Send reply preview"
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SERVICES PANEL                                                    */}
      {/* ================================================================= */}
      {activeTab === "services" && (
        <ProfileServicesTab
          services={services}
          perspective={perspective}
          ownerDisplayName={ownerDisplayName}
          onSelectService={onSelectService}
        />
      )}

      {/* ================================================================= */}
      {/* IDEAS PANEL                                                       */}
      {/* ================================================================= */}
      {activeTab === "ideas" && (
        <ProfileIdeasTab
          ideas={ideas}
          perspective={perspective}
          ownerDisplayName={ownerDisplayName}
        />
      )}

      {/* ================================================================= */}
      {/* ABOUT PANEL                                                       */}
      {/* ================================================================= */}
      {activeTab === "about" && (
        <ProfileAboutTab
          profile={profile}
          perspective={perspective}
          projectsCount={projects.length}
          publishedServicesCount={publishedServicesCount}
          onOpenEditModal={onOpenEditModal}
          onSelectTab={onTabChange}
          onOpenSocialModal={onOpenSocialModal}
        />
      )}
    </section>
  );
}
