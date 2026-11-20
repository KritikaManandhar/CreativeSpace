"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FolderPlus,
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Compass,
  Bell,
  CheckCheck,
  ChevronRight,
  Shield,
  FileBox,
  UserPlus,
  UserCheck,
  Heart,
  MessageSquare,
  XCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConnectionsManager } from "@/components/connections/ConnectionsManager";
import { InvitationsDashboard } from "@/components/collaboration/InvitationsDashboard";
import { ProjectStatus, Visibility, CollaboratorRole } from "@prisma/client";

const CATEGORIES = [
  "Illustration",
  "Photography",
  "Music",
  "Writing",
  "Animation",
  "Video",
  "UI/UX",
];

function DashboardContent() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTabParam = searchParams.get("tab") || "projects";

  const resolveTab = (
    param: string
  ): "projects" | "invitations" | "connections" | "notifications" => {
    if (param === "notifications") return "notifications";
    if (param === "connections") return "connections";
    if (param === "invitations") return "invitations";
    return "projects";
  };

  const [activeTab, setActiveTab] = useState<
    "projects" | "invitations" | "connections" | "notifications"
  >(resolveTab(activeTabParam));

  useEffect(() => {
    setActiveTab(resolveTab(activeTabParam));
  }, [activeTabParam]);

  const [projects, setProjects] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Illustration",
    status: ProjectStatus.Idea as ProjectStatus,
    visibility: Visibility.Private as Visibility,
    tags: "",
    // Category metadata fields
    metadata: {} as Record<string, any>,
  });

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [authStatus, router]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projRes, notifRes, connReqRes, invRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/notifications"),
        fetch("/api/connections/requests?direction=incoming", { cache: "no-store" }),
        fetch("/api/invitations", { cache: "no-store" }),
      ]);

      const projData = await projRes.json();
      const notifData = await notifRes.json();
      const connReqData = await connReqRes.json();
      const invData = await invRes.json();

      if (projData.success) {
        setProjects(projData.data || []);
      } else {
        setError(projData.error?.message || "Failed to load projects");
      }

      if (notifData.success) {
        setNotifications(notifData.data.notifications || []);
        setUnreadNotifications(notifData.data.unreadCount || 0);
      }

      if (connReqData.success) {
        setIncomingRequestsCount((connReqData.data.incoming || []).length);
      }

      if (invData.success) {
        setPendingInvitationsCount(invData.data.summary?.pendingIncoming ?? 0);
      }
    } catch (err: any) {
      setError("An unexpected network error occurred while loading dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    const target = notifications.find((n) => n.id === notificationId);
    if (!target || target.isRead) return;
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch {
      // Non-blocking read-status update
    }
  };

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchData();
    }
  }, [authStatus]);

  const handleMetadataChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const tagList = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          status: formData.status,
          visibility: formData.visibility,
          metadata: formData.metadata,
          tags: tagList,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to create project");
        setIsSubmitting(false);
        return;
      }

      setIsCreateModalOpen(false);
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "Illustration",
        status: ProjectStatus.Idea,
        visibility: Visibility.Private,
        tags: "",
        metadata: {},
      });
      // Refresh projects
      await fetchData();
      router.push(`/projects/${data.data.id}`);
    } catch (err: any) {
      setFormError("Network error while creating project.");
      setIsSubmitting(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "POST" });
      setUnreadNotifications(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter projects client-side for instant UX
  const filteredProjects = projects.filter((p) => {
    if (roleFilter !== "ALL" && p.userRole !== roleFilter) return false;
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchTag = p.tags?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchCat && !matchTag) return false;
    }
    return true;
  });

  if (authStatus === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <LoadingSpinner className="w-8 h-8 text-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              Creator Workspace
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">@{session?.user?.username}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Projects & Studio
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 shadow-lg shadow-violet-600/25"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "projects"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4 text-violet-400" />
          My Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "invitations"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Mail className="w-4 h-4 text-amber-400" />
          Invitations
          {pendingInvitationsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-600 text-white">
              {pendingInvitationsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("connections")}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "connections"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          Connections
          {incomingRequestsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-600 text-white">
              {incomingRequestsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "notifications"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bell className="w-4 h-4 text-indigo-400" />
          Notifications
          {unreadNotifications > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full bg-violet-600 text-white">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>

      {activeTab === "projects" ? (
        <>
          {/* Controls & Filters Bar */}
          <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects by title, description, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-1 text-xs">
                <span className="text-slate-500 px-2 font-medium">Role:</span>
                {(["ALL", "Owner", "Collaborator", "ClientReviewer"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      roleFilter === r
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {r === "ALL" ? "All" : r === "ClientReviewer" ? "Reviewer" : r}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-1 text-xs">
                <span className="text-slate-500 px-2 font-medium">Status:</span>
                {(["ALL", "Idea", "InProgress", "InReview", "Completed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      statusFilter === s
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {s === "ALL" ? "All" : s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Project Grid */}
          <div className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={fetchData} />
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={<FolderPlus className="w-12 h-12 text-violet-400" />}
                title={projects.length === 0 ? "No creative projects yet" : "No matching projects"}
                description={
                  projects.length === 0
                    ? "Start your first project to organize assets, coordinate collaborator drafts, and showcase finished work in your portfolio."
                    : "Try adjusting your search terms, role filters, or status toggles."
                }
                actionLabel={projects.length === 0 ? "Create First Project" : undefined}
                onAction={() => setIsCreateModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-violet-500/50 hover:bg-slate-900/80 transition-all shadow-sm"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-semibold text-violet-400 tracking-wide uppercase">
                          {project.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="role" role={project.userRole} />
                          <Badge variant="status" status={project.status} />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1 mb-2">
                        {project.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {project.description || "No project description provided."}
                      </p>

                      {/* Discipline Metadata Highlights */}
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

                    <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FileBox className="w-3.5 h-3.5 text-slate-500" />
                          {project._count?.assets || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {project.collaborators?.length || 1}
                        </span>
                        <Badge variant="visibility" visibility={project.visibility} />
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : activeTab === "invitations" ? (
        <InvitationsDashboard
          onCountsChange={({ pendingIncoming }) => {
            setPendingInvitationsCount(pendingIncoming);
          }}
          onMembershipActivated={() => {
            fetchData();
          }}
        />
      ) : activeTab === "connections" ? (
        <ConnectionsManager
          onCountsChange={({ incomingCount }) => {
            setIncomingRequestsCount(incomingCount);
          }}
        />
      ) : (
        /* Notifications Tab */
        <div className="mt-8 max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Activity &amp; Alerts</h3>
            {unreadNotifications > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs gap-1 text-violet-400"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-10 h-10 text-slate-600" />}
              title="No notifications yet"
              description="You will receive alerts when creators connect with you, collaborators invite you, leave comments, or review draft deliverables."
            />
          ) : (
            <div className="space-y-2.5">
              {notifications.map((n) => {
                const isConnectionNotif =
                  n.type === "ConnectionRequest" || n.type === "ConnectionAccepted";
                const actorName = n.relatedUser?.displayName || "A creator";
                const actorUsername = n.relatedUser?.username;

                // Construct deep link to the relevant project, version, or comment when accessible
                let projectHref: string | null = null;
                if (n.relatedProject?.id) {
                  const params = new URLSearchParams();
                  const targetVersionId =
                    n.relatedVersion?.id || n.relatedComment?.versionId || null;
                  if (targetVersionId) {
                    params.set("tab", "versions");
                    params.set("versionId", targetVersionId);
                  } else if (n.relatedComment?.id) {
                    params.set("tab", "overview");
                  }
                  if (n.relatedComment?.id) {
                    params.set("commentId", n.relatedComment.id);
                  }
                  const qs = params.toString();
                  projectHref = `/projects/${n.relatedProject.id}${qs ? `?${qs}` : ""}`;
                }

                const actorLink = actorUsername ? (
                  <Link
                    href={`/profile/${actorUsername}`}
                    onClick={() => handleMarkNotificationRead(n.id)}
                    className="font-semibold text-white hover:text-violet-300"
                  >
                    {actorName}
                  </Link>
                ) : (
                  <span className="font-semibold text-white">{actorName}</span>
                );

                return (
                  <div
                    key={n.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${
                      !n.isRead
                        ? "border-violet-500/40 bg-violet-950/20"
                        : "border-slate-800/80 bg-slate-900/30 text-slate-400"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                          n.type === "ConnectionAccepted" ||
                          n.type === "Approval" ||
                          n.type === "InvitationAccepted"
                            ? "bg-emerald-950/80 text-emerald-400"
                            : n.type === "Rejection" ||
                                n.type === "InvitationRejected" ||
                                n.type === "InvitationCancelled" ||
                                n.type === "CollaboratorRemoved"
                              ? "bg-rose-950/80 text-rose-400"
                              : n.type === "Invitation"
                                ? "bg-amber-950/80 text-amber-400"
                                : n.type === "Like"
                                  ? "bg-pink-950/80 text-pink-400"
                                  : n.type === "Reply" || n.type === "Comment"
                                    ? "bg-violet-950/80 text-violet-400"
                                    : n.type === "ConnectionRequest"
                                      ? "bg-indigo-950/80 text-indigo-400"
                                      : "bg-slate-800 text-violet-400"
                        }`}
                      >
                        {n.type === "ConnectionRequest" ? (
                          <UserPlus className="w-4 h-4" />
                        ) : n.type === "ConnectionAccepted" ||
                          n.type === "InvitationAccepted" ? (
                          <UserCheck className="w-4 h-4" />
                        ) : n.type === "Invitation" ? (
                          <Mail className="w-4 h-4" />
                        ) : n.type === "Approval" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : n.type === "Rejection" ||
                          n.type === "InvitationRejected" ||
                          n.type === "InvitationCancelled" ||
                          n.type === "CollaboratorRemoved" ? (
                          <XCircle className="w-4 h-4" />
                        ) : n.type === "Like" ? (
                          <Heart className="w-4 h-4" />
                        ) : n.type === "Reply" || n.type === "Comment" ? (
                          <MessageSquare className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {n.type === "Invitation" && (
                            <>{actorLink} invited you to collaborate on a project</>
                          )}
                          {n.type === "InvitationAccepted" && (
                            <>{actorLink} accepted your project invitation</>
                          )}
                          {n.type === "InvitationRejected" && (
                            <>{actorLink} declined your project invitation</>
                          )}
                          {n.type === "InvitationCancelled" && (
                            <>{actorLink} cancelled a project invitation</>
                          )}
                          {n.type === "CollaboratorRemoved" && (
                            <>{actorLink} removed you from a project workspace</>
                          )}
                          {n.type === "Comment" && (
                            <>{actorLink} commented on your project</>
                          )}
                          {n.type === "Reply" && (
                            <>{actorLink} replied to your comment</>
                          )}
                          {n.type === "Like" && (
                            <>{actorLink} liked your comment</>
                          )}
                          {n.type === "Approval" && (
                            <>
                              {actorLink} approved{" "}
                              {n.relatedVersion
                                ? `Version v${n.relatedVersion.versionNumber}`
                                : "your version"}
                            </>
                          )}
                          {n.type === "Rejection" && (
                            <>
                              {actorLink} requested revisions on{" "}
                              {n.relatedVersion
                                ? `Version v${n.relatedVersion.versionNumber}`
                                : "your version"}
                            </>
                          )}
                          {n.type === "ConnectionRequest" && (
                            <>{actorLink} sent you a connection request</>
                          )}
                          {n.type === "ConnectionAccepted" && (
                            <>{actorLink} accepted your connection request</>
                          )}
                          {n.type === "Follow" && (
                            <>{actorLink} started following you</>
                          )}
                        </p>

                        {n.relatedProject && projectHref && (
                          <Link
                            href={projectHref}
                            onClick={() => handleMarkNotificationRead(n.id)}
                            className="text-xs text-violet-400 hover:underline inline-block mt-0.5"
                          >
                            Project: {n.relatedProject.title}
                            {n.relatedVersion ? ` · v${n.relatedVersion.versionNumber}` : ""}
                          </Link>
                        )}

                        {isConnectionNotif && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {actorUsername ? `@${actorUsername} · ` : ""}
                            {n.type === "ConnectionRequest"
                              ? "Peer connection request — review in Connections"
                              : "You are now connected peers"}
                          </p>
                        )}

                        <p className="text-[11px] text-slate-500 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {n.type === "Invitation" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            handleMarkNotificationRead(n.id);
                            setActiveTab("invitations");
                          }}
                        >
                          Review Invitation
                        </Button>
                      )}

                      {n.relatedProject && projectHref && n.type !== "Invitation" && (
                        <Link
                          href={projectHref}
                          onClick={() => handleMarkNotificationRead(n.id)}
                        >
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      )}

                      {n.type === "ConnectionRequest" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            handleMarkNotificationRead(n.id);
                            setActiveTab("connections");
                          }}
                        >
                          Review Request
                        </Button>
                      )}

                      {(isConnectionNotif || n.type === "Follow") && actorUsername && (
                        <Link
                          href={`/profile/${actorUsername}`}
                          onClick={() => handleMarkNotificationRead(n.id)}
                        >
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project"
        description="Anchor your idea, files, draft versions, and feedback in a structured project workspace."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg border border-rose-800 bg-rose-950/40 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Project Title"
              placeholder="Client Logo Set, Short Film, or EP Master"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category / Discipline
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                    metadata: {}, // reset metadata when category changes
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              placeholder="Outline project goals, scope, and key deliverables..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Lifecycle Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ProjectStatus })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={ProjectStatus.Idea}>Idea / Planning</option>
                <option value={ProjectStatus.InProgress}>In Progress</option>
                <option value={ProjectStatus.InReview}>In Review</option>
                <option value={ProjectStatus.Completed}>Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({ ...formData, visibility: e.target.value as Visibility })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={Visibility.Private}>Private (Only You & Invited Members)</option>
                <option value={Visibility.CollaboratorsOnly}>Collaborators Only</option>
                <option value={Visibility.Public}>Public (Visible in Discovery & Showcase)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Discipline-Specific Metadata Inputs */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
              {formData.category} Discipline Metadata
            </h4>

            {formData.category === "Illustration" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Software"
                  placeholder="Procreate, Photoshop"
                  onChange={(e) => handleMetadataChange("software", e.target.value)}
                  required
                />
                <Input
                  label="Style"
                  placeholder="Flat, Vector, Concept Art"
                  onChange={(e) => handleMetadataChange("style", e.target.value)}
                  required
                />
                <Input
                  label="Canvas Width (px)"
                  type="number"
                  placeholder="4000"
                  onChange={(e) => handleMetadataChange("canvasWidth", parseInt(e.target.value, 10))}
                  required
                />
                <Input
                  label="Canvas Height (px)"
                  type="number"
                  placeholder="4000"
                  onChange={(e) => handleMetadataChange("canvasHeight", parseInt(e.target.value, 10))}
                  required
                />
              </div>
            )}

            {formData.category === "Photography" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Camera Body"
                  placeholder="Sony A7 IV"
                  onChange={(e) => handleMetadataChange("camera", e.target.value)}
                  required
                />
                <Input
                  label="Lens"
                  placeholder="24-70mm f/2.8"
                  onChange={(e) => handleMetadataChange("lens", e.target.value)}
                  required
                />
                <Input
                  label="Aperture"
                  placeholder="f/2.8"
                  onChange={(e) => handleMetadataChange("aperture", e.target.value)}
                  required
                />
                <Input
                  label="ISO"
                  type="number"
                  placeholder="400"
                  onChange={(e) => handleMetadataChange("iso", parseInt(e.target.value, 10))}
                  required
                />
              </div>
            )}

            {formData.category === "Music" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="BPM"
                  type="number"
                  placeholder="128"
                  onChange={(e) => handleMetadataChange("bpm", parseInt(e.target.value, 10))}
                  required
                />
                <Input
                  label="Key"
                  placeholder="C Major, F# Minor"
                  onChange={(e) => handleMetadataChange("key", e.target.value)}
                  required
                />
                <Input
                  label="DAW"
                  placeholder="Ableton Live, FL Studio"
                  onChange={(e) => handleMetadataChange("daw", e.target.value)}
                  required
                />
                <Input
                  label="Genre"
                  placeholder="Ambient, Lo-Fi, Synthwave"
                  onChange={(e) => handleMetadataChange("genre", e.target.value)}
                  required
                />
              </div>
            )}

            {formData.category === "Writing" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Genre"
                  placeholder="Fiction, Non-Fiction, Sci-Fi"
                  onChange={(e) => handleMetadataChange("genre", e.target.value)}
                  required
                />
                <Input
                  label="Target Word Count"
                  type="number"
                  placeholder="50000"
                  onChange={(e) => handleMetadataChange("wordCountTarget", parseInt(e.target.value, 10))}
                  required
                />
                <Input
                  label="Format"
                  placeholder="Novel, Short Story, Screenplay"
                  onChange={(e) => handleMetadataChange("format", e.target.value)}
                  required
                />
                <Input
                  label="Language"
                  placeholder="English"
                  onChange={(e) => handleMetadataChange("language", e.target.value)}
                  required
                />
              </div>
            )}

            {formData.category === "Animation" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="FPS"
                  type="number"
                  placeholder="24"
                  onChange={(e) => handleMetadataChange("fps", parseInt(e.target.value, 10))}
                  required
                />
                <Input
                  label="Resolution"
                  placeholder="1920x1080 (FHD)"
                  onChange={(e) => handleMetadataChange("resolution", e.target.value)}
                  required
                />
                <Input
                  label="Software"
                  placeholder="Blender, After Effects"
                  onChange={(e) => handleMetadataChange("software", e.target.value)}
                  required
                />
                <Input
                  label="Technique"
                  placeholder="2D Frame-by-Frame, 3D CGI"
                  onChange={(e) => handleMetadataChange("technique", e.target.value)}
                  required
                />
              </div>
            )}

            {formData.category === "Video" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Resolution"
                  placeholder="4K, 1080p"
                  onChange={(e) => handleMetadataChange("resolution", e.target.value)}
                  required
                />
                <Input
                  label="Aspect Ratio"
                  placeholder="16:9, 2.39:1"
                  onChange={(e) => handleMetadataChange("aspectRatio", e.target.value)}
                  required
                />
                <Input
                  label="Frame Rate"
                  type="number"
                  placeholder="60"
                  onChange={(e) => handleMetadataChange("frameRate", parseInt(e.target.value, 10))}
                  required
                />
                <Input
                  label="Color Space"
                  placeholder="Rec.709, DCI-P3"
                  onChange={(e) => handleMetadataChange("colorSpace", e.target.value)}
                />
              </div>
            )}

            {formData.category === "UI/UX" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Design Tool"
                  placeholder="Figma, Framer"
                  onChange={(e) => handleMetadataChange("designTool", e.target.value)}
                  required
                />
                <Input
                  label="Platform"
                  placeholder="Web, iOS, Android"
                  onChange={(e) => handleMetadataChange("platform", e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <Input
            label="Tags (Comma-Separated)"
            placeholder="logo, branding, minimal, dark"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            helperText="Tags improve discovery ranking and recommendation matching."
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="w-8 h-8 text-violet-500 mx-auto py-20" />}>
      <DashboardContent />
    </Suspense>
  );
}
