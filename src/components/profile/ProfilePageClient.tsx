"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionConfig, AnimatePresence, motion } from "framer-motion";
import { Eye, PencilLine, RotateCcw, Sparkles, X } from "lucide-react";
import {
  deriveInitials,
  resolveMockProfile,
  SAMPLE_PROFILE_LINKS,
  type ProfilePerspective,
  type ProfilePostComment,
  type ProfilePostItem,
  type ProfileServiceItem,
  type UserProfileRecord,
} from "@/data/mockProfiles";
import { AuthenticatedNavbar } from "@/components/navigation/AuthenticatedNavbar";
import { ProfileHeroSection } from "./ProfileHeroSection";
import { ProfileShowcaseTabs, type ProfileTab } from "./ProfileShowcaseTabs";
import { EditProfileModal } from "./EditProfileModal";
import { SocialNetworkModal } from "./ProfileModals";
import type { ProfileDisplayProject } from "./ProfileProjectCard";
import { ProjectDetailModal } from "./ProjectDetailModal";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { ProfileFooter } from "./ProfileFooter";
import {
  getStoredProjects,
  subscribeToProjects,
  toProfileDisplayProject,
} from "@/lib/projectStore";

export interface InitialCreatorPortfolioData {
  foundInDb: boolean;
  creator: {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    disciplines: string[];
    socialLinks: Record<string, string>;
    joinedAt: string;
    stats: {
      createdProjects: number;
      followers: number;
      following: number;
      collaborations: number;
    };
  } | null;
  isFollowing: boolean;
  projects: ProfileDisplayProject[];
}

interface ProfilePageClientProps {
  username: string;
  initialTab?: string;
  initialServiceId?: string;
  initialAction?: string;
  initialPortfolio?: InitialCreatorPortfolioData | null;
  portfolioError?: string | null;
}

function formatJoinedLabel(rawDate: string | null | undefined, fallback: string): string {
  if (!rawDate) return fallback;
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return fallback;
  return `Joined ${date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

function resolveProfileProjects(
  username: string,
  initialPortfolio?: InitialCreatorPortfolioData | null
): ProfileDisplayProject[] {
  if (initialPortfolio?.foundInDb && initialPortfolio.projects.length > 0) {
    return initialPortfolio.projects;
  }
  const stored = getStoredProjects(username);
  const published = stored.filter((p) => p.isPublished !== false);
  return published.map((p) => toProfileDisplayProject(p));
}

function buildHydratedProfile(
  username: string,
  initialPortfolio?: InitialCreatorPortfolioData | null
): UserProfileRecord {
  const base = resolveMockProfile(username);
  const resolvedProjects = resolveProfileProjects(username, initialPortfolio);

  if (!initialPortfolio?.foundInDb || !initialPortfolio.creator) {
    return {
      ...base,
      projects: base.projects,
      stats: {
        ...base.stats,
        projects: resolvedProjects.length,
      },
    };
  }

  const creator = initialPortfolio.creator;
  const totalDbLikes = initialPortfolio.projects.reduce(
    (sum, item) => sum + item.likeCount,
    0
  );

  return {
    ...base,
    id: creator.id,
    username: creator.username,
    displayName: creator.displayName,
    avatarInitials: deriveInitials(creator.displayName),
    bio: creator.bio ?? "",
    avatarUrl: creator.avatarUrl ?? null,
    joinedAt: formatJoinedLabel(creator.joinedAt, base.joinedAt),
    disciplines:
      creator.disciplines.length > 0 ? creator.disciplines : base.disciplines,
    socialLinks: creator.socialLinks,
    stats: {
      ...base.stats,
      projects: initialPortfolio.projects.length,
      followers: creator.stats.followers,
      following: creator.stats.following,
      collaborations: creator.stats.collaborations,
      totalLikes: totalDbLikes,
    },
  };
}

function buildInitialLikesMap(projects: ProfileDisplayProject[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const proj of projects) {
    if (proj.hasLiked) {
      map[proj.id] = true;
    }
  }
  return map;
}

export function ProfilePageClient({
  username,
  initialTab,
  initialServiceId,
  initialAction,
  initialPortfolio = null,
  portfolioError = null,
}: ProfilePageClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileRecord>(() =>
    buildHydratedProfile(username, initialPortfolio)
  );
  const [dbProjects, setDbProjects] = useState<ProfileDisplayProject[]>(
    () => resolveProfileProjects(username, initialPortfolio)
  );

  // Subscribe to persistent project updates
  useEffect(() => {
    const unsubscribe = subscribeToProjects(() => {
      if (!initialPortfolio?.foundInDb) {
        const next = resolveProfileProjects(username, initialPortfolio);
        setDbProjects(next);
        setProfile((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            projects: next.length,
          },
        }));
      }
    });
    return unsubscribe;
  }, [username, initialPortfolio]);

  const [perspective, setPerspective] = useState<ProfilePerspective>(
    () => resolveMockProfile(username).defaultPerspective
  );
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    if (
      initialTab === "services" ||
      initialTab === "works" ||
      initialTab === "posts" ||
      initialTab === "ideas" ||
      initialTab === "about"
    ) {
      return initialTab;
    }
    return "works";
  });

  // Visitor interactive states (local-only)
  const [isFollowing, setIsFollowing] = useState(
    () => Boolean(initialPortfolio?.isFollowing)
  );

  // Showcase interactive states (local-only)
  const [likedProjectIds, setLikedProjectIds] = useState<Record<string, boolean>>(() =>
    buildInitialLikesMap(initialPortfolio?.projects ?? [])
  );
  const [savedProjectIds, setSavedProjectIds] = useState<Record<string, boolean>>({});
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});

  // Modals & notifications
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [socialModalTab, setSocialModalTab] = useState<
    "followers" | "following" | null
  >(null);
  const [selectedProject, setSelectedProject] =
    useState<ProfileDisplayProject | null>(null);
  const [selectedService, setSelectedService] = useState<ProfileServiceItem | null>(
    () => {
      if (initialServiceId) {
        const initialProfile = resolveMockProfile(username);
        const match = initialProfile.services.find((s) => s.id === initialServiceId);
        if (
          match &&
          (match.isPublished || initialProfile.defaultPerspective === "owner")
        ) {
          return match;
        }
      }
      return null;
    }
  );
  const [serviceInitialMode, setServiceInitialMode] = useState<
    "details" | "booking"
  >(() => {
    return initialAction === "book" || initialAction === "booking"
      ? "booking"
      : "details";
  });

  const handleSelectService = (
    service: ProfileServiceItem,
    mode: "details" | "booking" = "details"
  ) => {
    setSelectedService(service);
    setServiceInitialMode(mode);
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  const publishedServicesCount = profile.services.filter((s) => s.isPublished).length;

  // Sync when navigating between `/profile/[username]` routes
  useEffect(() => {
    const fresh = resolveMockProfile(username);
    setProfile(buildHydratedProfile(username, initialPortfolio));
    setPerspective(fresh.defaultPerspective);
    if (
      initialTab === "services" ||
      initialTab === "works" ||
      initialTab === "posts" ||
      initialTab === "ideas" ||
      initialTab === "about"
    ) {
      setActiveTab(initialTab);
    } else {
      setActiveTab("works");
    }
    const nextProjects = resolveProfileProjects(username, initialPortfolio);
    setDbProjects(nextProjects);
    setIsFollowing(Boolean(initialPortfolio?.isFollowing));
    setLikedProjectIds(buildInitialLikesMap(nextProjects));
    setSavedProjectIds({});
    setLikedPostIds({});
    setSavedPostIds({});
    setEditModalOpen(false);
    setSocialModalTab(null);
    setSelectedProject(null);

    if (initialServiceId) {
      const match = fresh.services.find((s) => s.id === initialServiceId);
      if (match && (match.isPublished || fresh.defaultPerspective === "owner")) {
        setSelectedService(match);
        setServiceInitialMode(
          initialAction === "book" || initialAction === "booking"
            ? "booking"
            : "details"
        );
      } else {
        setSelectedService(null);
        setServiceInitialMode("details");
      }
    } else {
      setSelectedService(null);
      setServiceInitialMode("details");
    }

    setHasLocalEdits(false);
    setPreviewNotice(null);
  }, [username, initialTab, initialServiceId, initialAction, initialPortfolio]);

  // Ensure unpublished services close immediately if switching from Owner -> Visitor
  useEffect(() => {
    if (perspective === "visitor" && selectedService && !selectedService.isPublished) {
      setSelectedService(null);
    }
  }, [perspective, selectedService]);

  const handleToggleFollow = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      setProfile((curr) => ({
        ...curr,
        stats: {
          ...curr.stats,
          followers: Math.max(0, curr.stats.followers + (next ? 1 : -1)),
        },
      }));
      return next;
    });
  };

  const handleCopyShareLink = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `/profile/${profile.username}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Clipboard may be blocked in headless or non-HTTPS environments
    }
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleApplyProfileEdits = (updated: Partial<UserProfileRecord>) => {
    setProfile((curr) => ({
      ...curr,
      ...updated,
    }));
    setHasLocalEdits(true);
    setPreviewNotice(
      "Profile preview updated locally — changes live in frontend state and are not persisted to a backend."
    );
  };

  const handleResetEdits = () => {
    setProfile(buildHydratedProfile(username, initialPortfolio));
    setHasLocalEdits(false);
    setPreviewNotice(null);
  };

  const handleToggleProjectLike = (projectId: string) => {
    setLikedProjectIds((prev) => {
      const next = !prev[projectId];
      setProfile((curr) => ({
        ...curr,
        stats: {
          ...curr.stats,
          totalLikes: Math.max(0, curr.stats.totalLikes + (next ? 1 : -1)),
        },
      }));
      return { ...prev, [projectId]: next };
    });
  };

  const handleToggleProjectSave = (projectId: string) => {
    setSavedProjectIds((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const handleTogglePostLike = (postId: string) => {
    setLikedPostIds((prev) => {
      const next = !prev[postId];
      setProfile((curr) => ({
        ...curr,
        stats: {
          ...curr.stats,
          totalLikes: Math.max(0, curr.stats.totalLikes + (next ? 1 : -1)),
        },
      }));
      return { ...prev, [postId]: next };
    });
  };

  const handleTogglePostSave = (postId: string) => {
    setSavedPostIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddPostComment = (postId: string, comment: ProfilePostComment) => {
    setProfile((curr) => ({
      ...curr,
      posts: curr.posts.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post
      ),
    }));
  };

  const handleAddLocalPost = (newPost: ProfilePostItem) => {
    setProfile((curr) => ({
      ...curr,
      posts: [newPost, ...curr.posts],
      stats: {
        ...curr.stats,
        posts: curr.posts.length + 1,
      },
    }));
    setHasLocalEdits(true);
    setPreviewNotice(
      "Studio note added to your local preview feed — backend storage is not connected yet."
    );
  };

  const handleSelectShowcaseTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    if (typeof document !== "undefined") {
      document
        .getElementById("profile-showcase")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen w-full bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] flex flex-col justify-between overflow-x-clip">
        {/* Subtle Cosmic & Paper Grain Ambient Backdrop */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden select-none"
          aria-hidden="true"
        >
          <div className="editorial-grain absolute inset-0 opacity-45" />
          <div className="absolute -top-28 right-[8%] h-[420px] w-[420px] rounded-full bg-[#C8BDE0]/20 blur-[120px]" />
          <div className="absolute top-[22%] -left-28 h-[380px] w-[380px] rounded-full bg-[#9DB5A5]/15 blur-[110px]" />
        </div>

        {/* Shared Consistent Authenticated Top Navigation */}
        <AuthenticatedNavbar />

        {/* Main Profile Container */}
        <main className="relative z-10 mx-auto w-full max-w-[1320px] flex-1 px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8">
          {/* Profile-Specific Perspective (Owner View / Visitor View) Control Toolbar */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] px-4 sm:px-5 py-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EFECE2] text-[#203B35]">
                <Eye className="h-3.5 w-3.5 text-[#203B35]" />
              </div>
              <div>
                <span className="text-[13px] font-medium text-[#203B35]">
                  Profile Perspective
                </span>
                <span className="hidden md:inline text-[12px] text-[#5D635F] ml-2">
                  — Viewing as{" "}
                  <strong className="font-medium text-[#203B35]">
                    {perspective === "owner"
                      ? "Owner (Full Studio Controls)"
                      : "Public Visitor"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sample Profiles Quick Jump (for previewing multiple creators) */}
              <div className="hidden lg:flex items-center gap-1.5 text-[11.5px] text-[#5D635F] border-r border-[#203B35]/10 pr-3 mr-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#92958F]">
                  Switch:
                </span>
                {SAMPLE_PROFILE_LINKS.map((sample) => {
                  const isCurrent =
                    sample.username.toLowerCase() === profile.username.toLowerCase();
                  return (
                    <Link
                      key={sample.username}
                      href={`/profile/${sample.username}`}
                      className={`rounded-full px-2 py-0.5 transition-colors ${
                        isCurrent
                          ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                          : "hover:bg-[#EFECE2] text-[#282B2A]/80 hover:text-[#203B35]"
                      }`}
                    >
                      @{sample.username}
                    </Link>
                  );
                })}
              </div>

              {/* Owner View / Visitor View Switcher Group */}
              <div
                className="inline-flex items-center rounded-full border border-[#203B35]/15 bg-[#F6F3EB] p-1 self-start sm:self-auto"
                role="group"
                aria-label="Profile perspective view switcher"
              >
                <button
                  type="button"
                  onClick={() => setPerspective("owner")}
                  aria-pressed={perspective === "owner"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[12px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                    perspective === "owner"
                      ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                      : "text-[#5D635F] hover:text-[#203B35]"
                  }`}
                >
                  <PencilLine className="h-3 w-3" />
                  <span>Owner View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPerspective("visitor")}
                  aria-pressed={perspective === "visitor"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[12px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                    perspective === "visitor"
                      ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                      : "text-[#5D635F] hover:text-[#203B35]"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>Visitor View</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calm Local Preview Status Banner (when preview edits exist) */}
          <AnimatePresence>
            {(previewNotice || hasLocalEdits) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                role="status"
                className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#9DB5A5]/55 bg-[#FAF8F3] px-4 sm:px-5 py-3 text-[13px] text-[#203B35] shadow-sm"
              >
                <div className="flex items-start sm:items-center gap-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#4E9F76] mt-0.5 sm:mt-0" />
                  <span>
                    {previewNotice ||
                      "Local preview active — edits stay in browser memory only."}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {hasLocalEdits && (
                    <button
                      type="button"
                      onClick={handleResetEdits}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#F6F3EB] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset Preview</span>
                    </button>
                  )}
                  {previewNotice && (
                    <button
                      type="button"
                      onClick={() => setPreviewNotice(null)}
                      aria-label="Dismiss preview notice"
                      className="rounded-full p-1 text-[#5D635F] hover:text-[#203B35]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Cover, Avatar, Headline, Actions & Summary */}
          <ProfileHeroSection
            profile={profile}
            perspective={perspective}
            projectsCount={dbProjects.length}
            publishedServicesCount={publishedServicesCount}
            isFollowing={isFollowing}
            copiedLink={copiedLink}
            onOpenEditModal={() => setEditModalOpen(true)}
            onToggleFollow={handleToggleFollow}
            onCopyShareLink={handleCopyShareLink}
            onPerspectiveChange={setPerspective}
            onSelectShowcaseTab={handleSelectShowcaseTab}
            onOpenSocialModal={(tab) => setSocialModalTab(tab)}
          />

          {/* Works, Services, Posts, Ideas & About Sections */}
          <ProfileShowcaseTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            perspective={perspective}
            profile={profile}
            projects={dbProjects}
            projectsLoading={false}
            projectsError={portfolioError}
            onRetryProjects={() => router.refresh()}
            publishedServicesCount={publishedServicesCount}
            likedProjectIds={likedProjectIds}
            savedProjectIds={savedProjectIds}
            likedPostIds={likedPostIds}
            savedPostIds={savedPostIds}
            onToggleProjectLike={handleToggleProjectLike}
            onToggleProjectSave={handleToggleProjectSave}
            onSelectProject={setSelectedProject}
            onSelectService={handleSelectService}
            onTogglePostLike={handleTogglePostLike}
            onTogglePostSave={handleTogglePostSave}
            onAddPostComment={handleAddPostComment}
            onAddLocalPost={handleAddLocalPost}
            onOpenEditModal={() => setEditModalOpen(true)}
            onOpenSocialModal={(tab) => setSocialModalTab(tab)}
          />
        </main>

        {/* Profile Footer */}
        <ProfileFooter />

        {/* Profile Interactive Modals */}
        <EditProfileModal
          isOpen={editModalOpen}
          profile={profile}
          onClose={() => setEditModalOpen(false)}
          onApplyChanges={handleApplyProfileEdits}
        />

        <SocialNetworkModal
          isOpen={Boolean(socialModalTab)}
          initialTab={socialModalTab || "followers"}
          displayName={profile.displayName}
          followers={profile.followersList}
          following={profile.followingList}
          onClose={() => setSocialModalTab(null)}
        />

        <ProjectDetailModal
          project={selectedProject}
          relatedProjects={dbProjects}
          creatorFallback={{
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            disciplines: profile.disciplines,
          }}
          perspective={perspective}
          onSelectRelatedProject={(nextProject) => setSelectedProject(nextProject)}
          onClose={() => setSelectedProject(null)}
        />

        <ServiceDetailModal
          service={selectedService}
          providerName={profile.displayName}
          providerUsername={profile.username}
          perspective={perspective}
          initialMode={serviceInitialMode}
          onClose={() => setSelectedService(null)}
        />
      </div>
    </MotionConfig>
  );
}
