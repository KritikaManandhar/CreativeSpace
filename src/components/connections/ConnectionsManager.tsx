"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Clock,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingState";

interface SafePeerProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  disciplines?: string[];
}

interface ConnectionRequestItem {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  requester?: SafePeerProfile;
  receiver?: SafePeerProfile;
}

interface AcceptedConnectionItem {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
  peer: SafePeerProfile;
}

interface ConnectionsManagerProps {
  onCountsChange?: (counts: { incomingCount: number; connectionsCount: number }) => void;
}

function PeerAvatar({ peer }: { peer: SafePeerProfile }) {
  return (
    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0 border border-slate-700">
      {peer.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={peer.avatarUrl}
          alt={peer.displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        peer.displayName?.charAt(0)?.toUpperCase() || peer.username?.charAt(0)?.toUpperCase() || "C"
      )}
    </div>
  );
}

export function ConnectionsManager({ onCountsChange }: ConnectionsManagerProps) {
  const [incoming, setIncoming] = useState<ConnectionRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequestItem[]>([]);
  const [connections, setConnections] = useState<AcceptedConnectionItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqRes, connRes] = await Promise.all([
        fetch("/api/connections/requests", { cache: "no-store" }),
        fetch("/api/connections", { cache: "no-store" }),
      ]);

      const [reqJson, connJson] = await Promise.all([reqRes.json(), connRes.json()]);

      if (!reqRes.ok || !reqJson.success) {
        setError(reqJson.error?.message || "Failed to load connection requests");
        return;
      }
      if (!connRes.ok || !connJson.success) {
        setError(connJson.error?.message || "Failed to load connections");
        return;
      }

      const incomingList: ConnectionRequestItem[] = reqJson.data.incoming || [];
      const outgoingList: ConnectionRequestItem[] = reqJson.data.outgoing || [];
      const acceptedList: AcceptedConnectionItem[] = connJson.data.connections || [];

      setIncoming(incomingList);
      setOutgoing(outgoingList);
      setConnections(acceptedList);

      onCountsChange?.({
        incomingCount: incomingList.length,
        connectionsCount: acceptedList.length,
      });
    } catch {
      setError("Network error while loading your creator connections.");
    } finally {
      setIsLoading(false);
    }
  }, [onCountsChange]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const setBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => ({ ...prev, [id]: busy }));
  };

  const handleRespond = async (connectionId: string, action: "accept" | "reject") => {
    if (busyIds[connectionId]) return;
    setBusy(connectionId, true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setActionError(json.error?.message || `Could not ${action} connection request`);
        return;
      }

      setActionSuccess(
        action === "accept"
          ? "Connection request accepted."
          : "Connection request declined."
      );
      await fetchAll();
    } catch {
      setActionError("Network error while updating connection request.");
    } finally {
      setBusy(connectionId, false);
    }
  };

  const handleDelete = async (connectionId: string, kind: "cancel" | "remove") => {
    if (busyIds[connectionId]) return;
    setBusy(connectionId, true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setActionError(
          json.error?.message ||
            (kind === "cancel"
              ? "Could not cancel connection request"
              : "Could not remove connection")
        );
        return;
      }

      setActionSuccess(
        kind === "cancel"
          ? "Outgoing connection request cancelled."
          : "Connection removed."
      );
      await fetchAll();
    } catch {
      setActionError("Network error while modifying connection.");
    } finally {
      setBusy(connectionId, false);
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
        <ErrorState message={error} onRetry={fetchAll} />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {/* Status Banners */}
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

      {/* Connection Requests Grid (Incoming + Outgoing) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Requests */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-violet-400" />
              Incoming Requests
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-violet-950/70 text-violet-300 border border-violet-800/60">
              {incoming.length}
            </span>
          </div>

          {incoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
              <p className="text-sm font-medium text-slate-300">No pending incoming requests</p>
              <p className="text-xs text-slate-500 mt-1">
                When other creators request to connect with you, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incoming.map((req) => {
                const peer = req.requester;
                if (!peer) return null;
                const isBusy = Boolean(busyIds[req.id]);
                const disciplines = Array.isArray(peer.disciplines) ? peer.disciplines : [];

                return (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/90 bg-slate-950/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PeerAvatar peer={peer} />
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${peer.username}`}
                          className="text-sm font-semibold text-white hover:text-violet-300 transition-colors block truncate"
                        >
                          {peer.displayName}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono truncate">@{peer.username}</p>
                        {disciplines.length > 0 && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {disciplines.slice(0, 3).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isBusy}
                        isLoading={isBusy}
                        onClick={() => handleRespond(req.id, "accept")}
                        className="gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleRespond(req.id, "reject")}
                        className="gap-1.5 text-slate-300 hover:text-rose-300 hover:border-rose-500/40"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Outgoing Requests */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Outgoing Requests
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {outgoing.length}
            </span>
          </div>

          {outgoing.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
              <p className="text-sm font-medium text-slate-300">No outgoing requests</p>
              <p className="text-xs text-slate-500 mt-1">
                Visit a creator&apos;s profile to send a peer connection request.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {outgoing.map((req) => {
                const peer = req.receiver;
                if (!peer) return null;
                const isBusy = Boolean(busyIds[req.id]);

                return (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/90 bg-slate-950/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PeerAvatar peer={peer} />
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${peer.username}`}
                          className="text-sm font-semibold text-white hover:text-violet-300 transition-colors block truncate"
                        >
                          {peer.displayName}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono truncate">@{peer.username}</p>
                        <p className="text-[11px] text-amber-400/90 mt-0.5">Request Sent · Pending</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        isLoading={isBusy}
                        onClick={() => handleDelete(req.id, "cancel")}
                        className="gap-1.5 text-slate-300 hover:text-rose-300 hover:border-rose-500/40"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel Request
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Accepted Connections List */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Connected Creators ({connections.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Peer creator connections unlock Connections-Only social links. Connections are independent from project collaborators and do not grant workspace access.
            </p>
          </div>
          <Link href="/discover" className="self-start sm:self-auto">
            <Button variant="secondary" size="sm" className="text-xs">
              Discover Creators
            </Button>
          </Link>
        </div>

        {connections.length === 0 ? (
          <EmptyState
            icon={<Users className="w-11 h-11 text-slate-600" />}
            title="No connected creators yet"
            description="Connect with illustrators, animators, musicians, and designers across CreativeSpace to build your creative network."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((conn) => {
              const peer = conn.peer;
              const isBusy = Boolean(busyIds[conn.id]);
              const disciplines = Array.isArray(peer.disciplines) ? peer.disciplines : [];

              return (
                <div
                  key={conn.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <PeerAvatar peer={peer} />
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${peer.username}`}
                        className="text-sm font-bold text-white hover:text-violet-300 transition-colors block truncate"
                      >
                        {peer.displayName}
                      </Link>
                      <p className="text-xs text-slate-400 font-mono truncate">@{peer.username}</p>
                      {disciplines.length > 0 && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {disciplines.slice(0, 3).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/profile/${peer.username}`}>
                      <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      isLoading={isBusy}
                      onClick={() => handleDelete(conn.id, "remove")}
                      className="gap-1.5 text-xs text-slate-300 hover:text-rose-300 hover:border-rose-500/40"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      Remove
                    </Button>
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
