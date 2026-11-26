"use client";

import React, { useEffect, useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  Check,
  GitBranch,
  Heart,
  MessageSquarePlus,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { CelestialSpark, CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import type { ProfileProjectItem, ProfileSocialUser } from "@/data/mockProfiles";

interface EditorialModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function EditorialModalShell({
  isOpen,
  onClose,
  titleId,
  maxWidthClass = "max-w-lg",
  children,
}: EditorialModalShellProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="fixed inset-0 bg-[#203B35]/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex w-full ${maxWidthClass} max-h-[90dvh] flex-col rounded-t-[24px] sm:rounded-[26px] border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] shadow-[0_28px_70px_-18px_rgba(32,59,53,0.28)] overflow-hidden`}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================================
 * 1. FOLLOWERS / FOLLOWING MODAL
 * ========================================================================== */
interface SocialNetworkModalProps {
  isOpen: boolean;
  initialTab: "followers" | "following";
  displayName: string;
  followers: ProfileSocialUser[];
  following: ProfileSocialUser[];
  onClose: () => void;
}

export function SocialNetworkModal({
  isOpen,
  initialTab,
  displayName,
  followers,
  following,
  onClose,
}: SocialNetworkModalProps) {
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const titleId = useId();

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    [...followers, ...following].forEach((u) => {
      map[u.id] = u.isFollowing;
    });
    setFollowMap(map);
  }, [followers, following, isOpen]);

  const activeList = tab === "followers" ? followers : following;

  return (
    <EditorialModalShell isOpen={isOpen} onClose={onClose} titleId={titleId}>
      <div className="flex items-center justify-between border-b border-[#203B35]/10 px-6 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#5D635F]">
            Community Orbit
          </p>
          <h2 id={titleId} className="font-serif text-2xl text-[#203B35]">
            {displayName}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close community list"
          className="rounded-full p-2 text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tab toggle */}
      <div className="px-6 pt-4">
        <div className="grid grid-cols-2 gap-1.5 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] p-1">
          <button
            type="button"
            onClick={() => setTab("followers")}
            className={`rounded-full py-1.5 text-[13px] font-medium transition-colors ${
              tab === "followers"
                ? "bg-[#203B35] text-[#F6F3EB]"
                : "text-[#5D635F] hover:text-[#203B35]"
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("following")}
            className={`rounded-full py-1.5 text-[13px] font-medium transition-colors ${
              tab === "following"
                ? "bg-[#203B35] text-[#F6F3EB]"
                : "text-[#5D635F] hover:text-[#203B35]"
            }`}
          >
            Following ({following.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
        {activeList.map((member) => {
          const isFollowingMember = Boolean(followMap[member.id]);
          return (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#203B35]/10 bg-[#F6F3EB]/85 p-3"
            >
              <Link
                href={`/profile/${member.username}`}
                onClick={onClose}
                className="flex items-center gap-3 min-w-0 group"
              >
                <CreatorAvatar
                  initials={member.initials}
                  tone={member.avatarTone}
                  accent={member.avatarAccent}
                  name={member.displayName}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#203B35] group-hover:underline truncate">
                    {member.displayName}
                  </p>
                  <p className="font-mono text-[11px] text-[#5D635F] truncate">
                    @{member.username} · {member.roleTitle}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() =>
                  setFollowMap((prev) => ({
                    ...prev,
                    [member.id]: !prev[member.id],
                  }))
                }
                className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  isFollowingMember
                    ? "border border-[#203B35]/20 bg-[#FAF8F3] text-[#203B35]"
                    : "bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26]"
                }`}
              >
                {isFollowingMember ? (
                  <>
                    <Check className="h-3 w-3 text-[#4E9F76]" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 text-[#9DB5A5]" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </EditorialModalShell>
  );
}

/* ============================================================================
 * 2. PROJECT DETAIL & PROCESS HISTORY PREVIEW MODAL
 * ========================================================================== */
interface ProjectPreviewModalProps {
  project: ProfileProjectItem | null;
  isLiked: boolean;
  isSaved: boolean;
  onClose: () => void;
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
}

export function ProjectPreviewModal({
  project,
  isLiked,
  isSaved,
  onClose,
  onToggleLike,
  onToggleSave,
}: ProjectPreviewModalProps) {
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const titleId = useId();

  useEffect(() => {
    if (project) {
      setActiveVersionIdx(Math.max(0, project.versions.length - 1));
    }
  }, [project]);

  if (!project) return null;

  const activeVersion =
    project.versions[activeVersionIdx] ?? project.versions[0];
  const displayLikes = project.likeCount + (isLiked ? 1 : 0);

  return (
    <EditorialModalShell
      isOpen={Boolean(project)}
      onClose={onClose}
      titleId={titleId}
      maxWidthClass="max-w-3xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#203B35]/10 px-5 sm:px-7 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-[#5D635F]">
            <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
            <span>{project.discipline}</span>
            <span>·</span>
            <span>{project.versionTag}</span>
          </div>
          <h2
            id={titleId}
            className="mt-1 font-serif text-2xl sm:text-3xl text-[#203B35] leading-tight"
          >
            {project.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close project preview"
          className="rounded-full p-2 text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
        {/* Main Artwork Frame */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#203B35]/15 bg-[#EFECE2]">
          <Image
            src={project.coverUrl}
            alt={project.coverAlt}
            fill
            sizes="(max-width: 768px) 95vw, 720px"
            className="object-cover"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Description & Tools */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F] mb-1.5">
                Project Notes
              </p>
              <p className="text-[14.5px] leading-[1.7] text-[#282B2A]/90">
                {project.description}
              </p>
            </div>

            {project.tools.length > 0 && (
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F] mb-2">
                  Medium &amp; Tools
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-3 py-1 text-[12px] text-[#203B35]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.collaborators.length > 0 && (
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F] mb-2">
                  Collaborators
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {project.collaborators.map((col) => (
                    <Link
                      key={col.username}
                      href={`/profile/${col.username}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] pr-3 pl-1.5 py-1 hover:border-[#203B35]/35 transition-colors"
                    >
                      <CreatorAvatar
                        initials={col.initials}
                        tone={col.tone}
                        accent={col.accent}
                        name={col.name}
                        size="xs"
                      />
                      <span className="text-[12px] font-medium text-[#203B35]">
                        {col.name}
                      </span>
                      <span className="text-[11px] text-[#5D635F]">· {col.role}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Version History */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]">
              <GitBranch className="h-3.5 w-3.5 text-[#203B35]" />
              <span>Process History</span>
            </div>

            <div className="space-y-2">
              {project.versions.map((ver, idx) => {
                const selected = idx === activeVersionIdx;
                return (
                  <button
                    key={ver.version}
                    type="button"
                    onClick={() => setActiveVersionIdx(idx)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      selected
                        ? "border-[#203B35] bg-[#203B35] text-[#F6F3EB]"
                        : "border-[#203B35]/15 bg-[#F6F3EB] text-[#282B2A] hover:border-[#203B35]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span>{ver.version}</span>
                      <span className={selected ? "text-[#9DB5A5]" : "text-[#5D635F]"}>
                        {ver.date} · {ver.status}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-[13px] font-medium ${
                        selected ? "text-[#F6F3EB]" : "text-[#203B35]"
                      }`}
                    >
                      {ver.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {activeVersion && (
              <div className="rounded-xl border border-[#203B35]/10 bg-[#EFECE2]/65 p-3 text-[12.5px] text-[#282B2A]/85 leading-relaxed">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#5D635F] block mb-1">
                  {activeVersion.version} Studio Note
                </span>
                {activeVersion.note}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-[#203B35]/10 px-5 sm:px-7 py-4 bg-[#FAF8F3]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleLike(project.id)}
            aria-pressed={isLiked}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              isLiked
                ? "bg-[#203B35] text-[#F6F3EB]"
                : "border border-[#203B35]/20 bg-[#F6F3EB] text-[#203B35] hover:bg-[#EFECE2]"
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            <span>Appreciate ({displayLikes})</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSave(project.id)}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
              isSaved
                ? "border-[#203B35] bg-[#9DB5A5]/25 text-[#203B35]"
                : "border-[#203B35]/20 bg-[#F6F3EB] text-[#203B35] hover:bg-[#EFECE2]"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35]"
        >
          Close
        </button>
      </div>
    </EditorialModalShell>
  );
}

/* ============================================================================
 * 3. VISITOR COLLABORATE PREVIEW MODAL
 * ========================================================================== */
interface CollaboratePreviewModalProps {
  isOpen: boolean;
  recipientName: string;
  recipientUsername: string;
  onClose: () => void;
}

export function CollaboratePreviewModal({
  isOpen,
  recipientName,
  recipientUsername,
  onClose,
}: CollaboratePreviewModalProps) {
  const [projectTopic, setProjectTopic] = useState("");
  const [message, setMessage] = useState("");
  const [sentPreview, setSentPreview] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setProjectTopic("");
      setMessage("");
      setSentPreview(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSentPreview(true);
  };

  return (
    <EditorialModalShell isOpen={isOpen} onClose={onClose} titleId={titleId}>
      <div className="flex items-start justify-between border-b border-[#203B35]/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9DB5A5]/25 text-[#203B35]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]">
              Studio Invitation Preview
            </p>
            <h2 id={titleId} className="font-serif text-2xl text-[#203B35]">
              Collaborate with {recipientName}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close collaboration dialog"
          className="rounded-full p-2 text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        {sentPreview ? (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#203B35] text-[#F6F3EB]">
              <Sparkles className="h-5 w-5 text-[#C8BDE0]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-2xl text-[#203B35]">
                Invitation Draft Previewed
              </h3>
              <p className="text-[13.5px] leading-relaxed text-[#282B2A]/80">
                Your collaboration note to <span className="font-mono">@{recipientUsername}</span>{" "}
                was previewed locally. Backend messaging is not connected yet.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full bg-[#203B35] px-6 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26]"
            >
              Back to Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-[#282B2A]/80">
              Propose a shared project, zine edition, or critique exchange with{" "}
              <span className="font-medium text-[#203B35]">{recipientName}</span>.
            </p>

            <div>
              <label
                htmlFor="collab-topic"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35] mb-1.5"
              >
                Project or Idea Title
              </label>
              <input
                id="collab-topic"
                type="text"
                value={projectTopic}
                onChange={(e) => setProjectTopic(e.target.value)}
                placeholder="e.g., Winter Botanical Zine Collaboration"
                className="w-full h-11 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 px-3.5 text-[14px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
              />
            </div>

            <div>
              <label
                htmlFor="collab-message"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35] mb-1.5"
              >
                Studio Note
              </label>
              <textarea
                id="collab-message"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share what you'd love to build together and your timeline..."
                className="w-full rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 p-3.5 text-[14px] leading-relaxed text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
              />
            </div>

            <div className="flex items-center justify-between pt-2 gap-3">
              <span className="text-[11.5px] text-[#5D635F]">
                Frontend preview · Not sent to server
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26]"
                >
                  <MessageSquarePlus className="h-4 w-4 text-[#9DB5A5]" />
                  <span>Preview Invite</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </EditorialModalShell>
  );
}
