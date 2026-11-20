"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  AlertCircle,
  FolderKanban,
  ExternalLink,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import type { CollaboratorRole } from "@prisma/client";

interface SafeUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

type InvitationStatusType = "Pending" | "Accepted" | "Rejected" | "Cancelled";

interface IncomingInvitationItem {
  id: string;
  projectId: string;
  userId: string;
  role: CollaboratorRole;
  status: InvitationStatusType;
  invitedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  inviter: SafeUser;
  project: {
    id: string;
    title: string;
    category: string;
    visibility: string;
    thumbnailUrl: string | null;
  };
}

interface OutgoingInvitationItem {
  id: string;
  projectId: string;
  userId: string;
  role: CollaboratorRole;
  status: InvitationStatusType;
  invitedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  invitee: SafeUser;
  project: {
    id: string;
    title: string;
    category: string;
    visibility: string;
  };
}

interface InvitationsDashboardProps {
  onCountsChange?: (counts: { pendingIncoming: number }) => void;
  onMembershipActivated?: () => void;
}

function StatusPill({ status }: { status: InvitationStatusType }) {
  switch (status) {
    case "Pending":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "Accepted":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3" />
          Accepted
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/60">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    case "Cancelled":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          <Ban className="w-3 h-3" />
          Cancelled
        </span>
      );
  }
}

export function InvitationsDashboard({
  onCountsChange,
  onMembershipActivated,
}: InvitationsDashboardProps) {
  const [incoming, setIncoming] = useState<IncomingInvitationItem[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingInvitationItem[]>([]);
  const [activeCollaborations, setActiveCollaborations] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invitations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to load project invitations");
        return;
      }

      const inc: IncomingInvitationItem[] = json.data.incoming || [];
      const out: OutgoingInvitationItem[] = json.data.outgoing || [];
      const activeCount: number = json.data.summary?.activeCollaborations ?? 0;

      setIncoming(inc);
      setOutgoing(out);
      setActiveCollaborations(activeCount);
      onCountsChange?.({
        pendingIncoming: json.data.summary?.pendingIncoming ?? 0,
      });
    } catch {
      setError("Network error while loading invitations.");
    } finally {
      setIsLoading(false);
    }
  }, [onCountsChange]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const runAction = async (
    id: string,
    projectId: string,
    userId: string,
    action: "accept" | "reject" | "cancel"
  ) => {
    if (busyIds[id]) return;
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || `Could not ${action} invitation`);
        return;
      }

      if (action === "accept") {
        setActionSuccess("Invitation accepted! You now have access to the project workspace.");
        onMembershipActivated?.();
      } else if (action === "reject") {
        setActionSuccess("Invitation declined.");
      } else {
        setActionSuccess("Pending invitation cancelled.");
      }

      await fetchInvitations();
    } catch {
      setActionError("Network error while updating invitation.");
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="mt-10 flex items-center justify-center py-16">
        <LoadingSpinner className="w-8 h-8 text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <ErrorState message={error} onRetry={fetchInvitations} />
      </div>
    );
  }

  const pendingIncoming = incoming.filter((i) => i.status === "Pending");
  const pastIncoming = incoming.filter((i) => i.status !== "Pending");

  return (
    <div className="mt-8 space-y-8">
      {/* Feedback Banners */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Active Collaborations Overview Strip */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-violet-950/70 text-violet-400 border border-violet-800/50 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Active Collaborations ({activeCollaborations})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeCollaborations === 0
                ? "You have no active collaborations on other creators' projects yet. Accept an incoming invitation below to join a workspace."
                : `You are an active member on ${activeCollaborations} collaborative ${activeCollaborations === 1 ? "project" : "projects"}. Pending invitations never grant workspace access until accepted.`}
            </p>
          </div>
        </div>
      </div>

      {/* Incoming Invitations */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-400" />
              Incoming Project Invitations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review invitations to join other creators&apos; workspaces as a Collaborator or Client Reviewer.
            </p>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-950/70 text-violet-300 border border-violet-800/60">
            {pendingIncoming.length} Pending
          </span>
        </div>

        {incoming.length === 0 ? (
          <EmptyState
            icon={<Mail className="w-10 h-10 text-slate-600" />}
            title="No incoming project invitations"
            description="When a project owner invites you to collaborate or review drafts, your invitation will appear here."
          />
        ) : (
          <div className="space-y-3">
            {[...pendingIncoming, ...pastIncoming].map((inv) => {
              const isBusy = Boolean(busyIds[inv.id]);
              return (
                <div
                  key={inv.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/90 bg-slate-950/60"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Project Thumbnail / Cover (only when safely available) */}
                    <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {inv.project.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={inv.project.thumbnailUrl}
                          alt={inv.project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FolderKanban className="w-6 h-6 text-violet-400" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {inv.project.title}
                        </h4>
                        <StatusPill status={inv.status} />
                        <Badge variant="role" role={inv.role} />
                      </div>

                      <p className="text-xs text-slate-400">
                        Invited by{" "}
                        <Link
                          href={`/profile/${inv.inviter.username}`}
                          className="font-semibold text-slate-200 hover:text-violet-300"
                        >
                          {inv.inviter.displayName}
                        </Link>{" "}
                        <span className="font-mono text-slate-500">
                          (@{inv.inviter.username})
                        </span>
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {inv.project.category} · Invited{" "}
                        {new Date(inv.invitedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {inv.status === "Pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isBusy}
                          isLoading={isBusy}
                          onClick={() =>
                            runAction(inv.id, inv.projectId, inv.userId, "accept")
                          }
                          className="gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() =>
                            runAction(inv.id, inv.projectId, inv.userId, "reject")
                          }
                          className="gap-1.5 text-slate-300 hover:text-rose-300 hover:border-rose-500/40"
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </Button>
                      </>
                    ) : inv.status === "Accepted" ? (
                      <Link href={`/projects/${inv.projectId}`}>
                        <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Workspace
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Outgoing Invitations (For Project Owners) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" />
              Outgoing Invitations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Track invitations you have sent to collaborators and reviewers for your projects.
            </p>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {outgoing.length} Total
          </span>
        </div>

        {outgoing.length === 0 ? (
          <EmptyState
            icon={<Send className="w-10 h-10 text-slate-600" />}
            title="No outgoing invitations sent"
            description="Open any project you own and use the Collaborators tab to invite team members or client reviewers."
          />
        ) : (
          <div className="space-y-3">
            {outgoing.map((inv) => {
              const isBusy = Boolean(busyIds[inv.id]);
              return (
                <div
                  key={inv.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/90 bg-slate-950/60"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                      {inv.invitee.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={inv.invitee.avatarUrl}
                          alt={inv.invitee.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        inv.invitee.displayName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/profile/${inv.invitee.username}`}
                          className="text-sm font-bold text-white hover:text-violet-300 truncate"
                        >
                          {inv.invitee.displayName}
                        </Link>
                        <span className="text-xs font-mono text-slate-500">
                          @{inv.invitee.username}
                        </span>
                        <StatusPill status={inv.status} />
                        <Badge variant="role" role={inv.role} />
                      </div>

                      <p className="text-xs text-slate-400">
                        Project:{" "}
                        <Link
                          href={`/projects/${inv.projectId}`}
                          className="text-violet-400 hover:underline font-medium"
                        >
                          {inv.project.title}
                        </Link>{" "}
                        · Sent{" "}
                        {new Date(inv.invitedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {inv.status === "Pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        isLoading={isBusy}
                        onClick={() =>
                          runAction(inv.id, inv.projectId, inv.userId, "cancel")
                        }
                        className="gap-1.5 text-slate-300 hover:text-rose-300 hover:border-rose-500/40"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancel Invitation
                      </Button>
                    )}
                    <Link href={`/projects/${inv.projectId}?tab=collaborators`}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
