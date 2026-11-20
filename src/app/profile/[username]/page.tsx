"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Award,
  Layers,
  Heart,
  Calendar,
  ExternalLink,
  MessageSquare,
  FileBox,
  Settings,
  UserPlus,
  UserCheck,
  UserMinus,
  Clock,
  Check,
  X,
  Globe,
  Github,
  Twitter,
  Instagram,
  AlertCircle,
  Lock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

interface ViewerConnectionState {
  id: string;
  status: "Pending" | "Accepted" | "Rejected";
  direction: "incoming" | "outgoing";
  acceptedAt: string | null;
  rejectedAt: string | null;
}

interface NormalizedSocialLink {
  platform: string;
  label: string;
  href: string;
  visibility?: "Public" | "ConnectionsOnly" | "Private";
}

const PLATFORM_LABELS: Record<string, string> = {
  website: "Website",
  twitter: "Twitter / X",
  github: "GitHub",
  instagram: "Instagram",
  behance: "Behance",
  dribbble: "Dribbble",
};

function sanitizeExternalUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

function normalizeSocialLinks(raw: unknown): NormalizedSocialLink[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }

  const list: NormalizedSocialLink[] = [];
  for (const [platform, value] of Object.entries(raw as Record<string, unknown>)) {
    let rawUrl: string | null = null;
    let visibility: "Public" | "ConnectionsOnly" | "Private" | undefined;

    if (typeof value === "string") {
      rawUrl = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.url === "string") {
        rawUrl = obj.url;
      }
      if (
        obj.visibility === "Public" ||
        obj.visibility === "ConnectionsOnly" ||
        obj.visibility === "Private"
      ) {
        visibility = obj.visibility;
      }
    }

    if (!rawUrl) continue;
    const safeHref = sanitizeExternalUrl(rawUrl);
    if (!safeHref) continue;

    list.push({
      platform,
      label:
        PLATFORM_LABELS[platform.toLowerCase()] ||
        platform.charAt(0).toUpperCase() + platform.slice(1),
      href: safeHref,
      visibility,
    });
  }

  return list;
}

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "github":
      return <Github className="w-3.5 h-3.5 text-slate-300" />;
    case "twitter":
      return <Twitter className="w-3.5 h-3.5 text-sky-400" />;
    case "instagram":
      return <Instagram className="w-3.5 h-3.5 text-pink-400" />;
    case "website":
      return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
    default:
      return <ExternalLink className="w-3.5 h-3.5 text-violet-400" />;
  }
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session, status: authStatus } = useSession();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConnectionBusy, setIsConnectionBusy] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [isFollowBusy, setIsFollowBusy] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following" | null>(null);
  const [followListItems, setFollowListItems] = useState<any[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [followListCursor, setFollowListCursor] = useState<string | null>(null);
  const [followListHasMore, setFollowListHasMore] = useState(false);

  const handleToggleFollow = async (targetCreatorId: string, currentlyFollowing: boolean) => {
    if (isFollowBusy) return;
    setIsFollowBusy(true);
    setConnectionError(null);
    try {
      const res = await fetch(`/api/users/${targetCreatorId}/follow`, {
        method: currentlyFollowing ? "DELETE" : "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConnectionError(json.error?.message || "Could not update follow status");
        return;
      }
      await fetchPortfolio(false);
    } catch {
      setConnectionError("Network error while updating follow status.");
    } finally {
      setIsFollowBusy(false);
    }
  };

  const loadFollowList = async (
    creatorId: string,
    type: "followers" | "following",
    cursor?: string | null
  ) => {
    setFollowListLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "20" });
      if (cursor) qs.set("cursor", cursor);
      const res = await fetch(`/api/users/${creatorId}/${type}?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const nextItems = json.data.items || [];
        setFollowListItems((prev) => (cursor ? [...prev, ...nextItems] : nextItems));
        setFollowListHasMore(Boolean(json.data.hasMore));
        setFollowListCursor(json.data.nextCursor ?? null);
      }
    } finally {
      setFollowListLoading(false);
    }
  };

  const openFollowModal = (creatorId: string, type: "followers" | "following") => {
    setFollowModalType(type);
    setFollowListItems([]);
    setFollowListCursor(null);
    setFollowListHasMore(false);
    loadFollowList(creatorId, type, null);
  };

  const fetchPortfolio = useCallback(async (showSpinner = false) => {
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
      setError("Network error loading portfolio");
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  // Wait for NextAuth status to settle before fetching so authenticated viewers
  // immediately receive their authorized socialLinks and connection state.
  useEffect(() => {
    if (authStatus === "loading") return;
    fetchPortfolio(true);
  }, [authStatus, session?.user?.id, fetchPortfolio]);

  const handleSendRequest = async (targetCreatorId: string) => {
    if (isConnectionBusy) return;
    setIsConnectionBusy(true);
    setConnectionError(null);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetCreatorId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConnectionError(json.error?.message || "Could not send connection request");
        return;
      }
      await fetchPortfolio(false);
    } catch {
      setConnectionError("Network error while sending connection request.");
    } finally {
      setIsConnectionBusy(false);
    }
  };

  const handleRespondRequest = async (
    connectionId: string,
    action: "accept" | "reject"
  ) => {
    if (isConnectionBusy) return;
    setIsConnectionBusy(true);
    setConnectionError(null);

    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConnectionError(json.error?.message || `Could not ${action} request`);
        return;
      }
      await fetchPortfolio(false);
    } catch {
      setConnectionError("Network error while updating connection request.");
    } finally {
      setIsConnectionBusy(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (isConnectionBusy) return;
    setIsConnectionBusy(true);
    setConnectionError(null);

    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConnectionError(json.error?.message || "Could not update connection");
        return;
      }
      await fetchPortfolio(false);
    } catch {
      setConnectionError("Network error while updating connection.");
    } finally {
      setIsConnectionBusy(false);
    }
  };

  if (isLoading || authStatus === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <LoadingSpinner className="w-10 h-10 text-violet-500" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex-1 max-w-xl mx-auto py-20 px-4">
        <ErrorState
          title="Creator Not Found"
          message={error || `Could not find any creator with username @${username}.`}
        />
      </div>
    );
  }

  const { creator, portfolio } = profileData;
  const connection: ViewerConnectionState | null = profileData.connection || null;
  const isFollowing: boolean = Boolean(profileData.isFollowing);
  const isOwner = Boolean(session?.user?.id && session.user.id === creator.id);
  const projects = portfolio.projects || [];
  const disciplines = Array.isArray(creator.disciplines) ? creator.disciplines : [];
  const visibleSocialLinks = normalizeSocialLinks(creator.socialLinks);

  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Creator Profile Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-10 backdrop-blur-md mb-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-violet-500/20 overflow-hidden shrink-0">
            {creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              creator.displayName.charAt(0)
            )}
          </div>

          <div className="flex-1 w-full text-center sm:text-left space-y-3">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {creator.displayName}
                  </h1>
                  <span className="text-xs text-slate-400 font-mono">@{creator.username}</span>
                </div>

                {/* Owner Edit Button OR Independent Follow + Peer Connection Actions */}
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                  {!isOwner && authStatus === "authenticated" && (
                    <Button
                      variant={isFollowing ? "secondary" : "outline"}
                      size="sm"
                      disabled={isFollowBusy}
                      isLoading={isFollowBusy}
                      onClick={() => handleToggleFollow(creator.id, isFollowing)}
                      className="gap-1.5 text-xs h-9"
                    >
                      {isFollowing ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Following
                        </>
                      ) : (
                        <>
                          <Users className="w-3.5 h-3.5 text-indigo-300" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}

                  {isOwner ? (
                    <Link href="/settings/profile">
                      <Button variant="secondary" size="sm" className="gap-1.5 text-xs py-1 h-9">
                        <Settings className="w-3.5 h-3.5 text-violet-400" />
                        Edit Profile & Privacy
                      </Button>
                    </Link>
                  ) : authStatus !== "authenticated" ? (
                    <Link href={`/login?callbackUrl=${encodeURIComponent(`/profile/${creator.username}`)}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                        <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                        Sign in to Connect
                      </Button>
                    </Link>
                  ) : !connection || connection.status === "Rejected" ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isConnectionBusy}
                      isLoading={isConnectionBusy}
                      onClick={() => handleSendRequest(creator.id)}
                      className="gap-1.5 text-xs h-9"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Connect
                    </Button>
                  ) : connection.status === "Pending" && connection.direction === "outgoing" ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        <Clock className="w-3.5 h-3.5" />
                        Request Sent
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isConnectionBusy}
                        isLoading={isConnectionBusy}
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="gap-1.5 text-xs h-9 text-slate-300 hover:text-rose-300 hover:border-rose-500/40"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel Request
                      </Button>
                    </>
                  ) : connection.status === "Pending" && connection.direction === "incoming" ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isConnectionBusy}
                        isLoading={isConnectionBusy}
                        onClick={() => handleRespondRequest(connection.id, "accept")}
                        className="gap-1.5 text-xs h-9"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isConnectionBusy}
                        onClick={() => handleRespondRequest(connection.id, "reject")}
                        className="gap-1.5 text-xs h-9 text-slate-300 hover:text-rose-300 hover:border-rose-500/40"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </>
                  ) : connection.status === "Accepted" ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                        <UserCheck className="w-3.5 h-3.5" />
                        Connected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isConnectionBusy}
                        isLoading={isConnectionBusy}
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="gap-1.5 text-xs h-9 text-slate-300 hover:text-rose-300 hover:border-rose-500/40"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        Remove Connection
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {connectionError && (
                <div className="mt-2 p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-center sm:justify-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{connectionError}</span>
                </div>
              )}

              {disciplines.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                  {disciplines.map((d: string) => (
                    <span
                      key={d}
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-800/50"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {creator.bio || "Creative professional on CreativeSpace."}
            </p>

            {/* Server-Authorized Social Links (filtered authoritatively on backend) */}
            {visibleSocialLinks.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {visibleSocialLinks.map((item) => {
                  const effectivePrivacy =
                    item.visibility || creator.socialPrivacy || "Public";
                  return (
                    <a
                      key={item.platform}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950/80 text-slate-200 border border-slate-800 hover:border-violet-500/60 hover:text-white transition-colors"
                    >
                      <PlatformIcon platform={item.platform} />
                      <span>{item.label}</span>
                      {isOwner && effectivePrivacy === "Private" && (
                        <span
                          title="Private (visible only to you)"
                          className="ml-0.5 text-rose-400"
                        >
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                      {isOwner && effectivePrivacy === "ConnectionsOnly" && (
                        <span
                          title="Connections Only"
                          className="ml-0.5 text-amber-400"
                        >
                          <Users className="w-3 h-3" />
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 pt-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => openFollowModal(creator.id, "followers")}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <strong className="text-slate-200">{creator.stats?.followers ?? 0}</strong> Followers
              </button>
              <button
                type="button"
                onClick={() => openFollowModal(creator.id, "following")}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <strong className="text-slate-200">{creator.stats?.following ?? 0}</strong> Following
              </button>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Joined {new Date(creator.joinedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                {creator.stats?.createdProjects || projects.length} Published Projects
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Showcase Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Curated Portfolio Showcase
            </h2>
            <p className="text-xs text-slate-400">
              Completed creative projects verified through project workspaces.
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={<Award className="w-12 h-12 text-slate-600" />}
            title="Portfolio in Progress"
            description="This creator has not published any completed projects to their showcase yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((item: any) => {
              const project = item.project;
              return (
                <Link
                  key={item.id}
                  href={`/projects/${project.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-6 hover:border-violet-500/50 hover:bg-slate-900/80 transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                        {project.category}
                      </span>
                      {item.featured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60">
                          <Award className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1 mb-2">
                      {project.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {project.description || "No project description provided."}
                    </p>

                    {/* Metadata highlights */}
                    {project.metadata && Object.keys(project.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {Object.entries(project.metadata)
                          .slice(0, 3)
                          .map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[10px] rounded bg-slate-950 px-2 py-0.5 text-slate-400 border border-slate-800"
                            >
                              {key}: <strong className="text-slate-300">{String(val)}</strong>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                        {project._count?.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        {project._count?.comments || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileBox className="w-3.5 h-3.5 text-slate-500" />
                        {project.assets?.length || 0}
                      </span>
                    </div>

                    <span className="text-violet-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                      View Project →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Followers / Following Safe Public List Modal */}
      <Modal
        isOpen={followModalType !== null}
        onClose={() => setFollowModalType(null)}
        title={followModalType === "followers" ? "Followers" : "Following"}
        description={
          followModalType === "followers"
            ? `Creators following @${creator.username}`
            : `Creators @${creator.username} follows`
        }
      >
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {followListLoading && followListItems.length === 0 ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner className="w-6 h-6 text-violet-500" />
            </div>
          ) : followListItems.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              {followModalType === "followers"
                ? "No followers yet."
                : "Not following any creators yet."}
            </p>
          ) : (
            <>
              {followListItems.map((entry: any) => (
                <Link
                  key={entry.user.id}
                  href={`/profile/${entry.user.username}`}
                  onClick={() => setFollowModalType(null)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-violet-500/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                    {entry.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.user.avatarUrl}
                        alt={entry.user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      entry.user.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {entry.user.displayName}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      @{entry.user.username}
                    </p>
                  </div>
                  <span className="text-[11px] text-violet-400 font-medium">View →</span>
                </Link>
              ))}

              {followListHasMore && followListCursor && followModalType && (
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={followListLoading}
                    onClick={() =>
                      loadFollowList(creator.id, followModalType, followListCursor)
                    }
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
