"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  FolderPlus,
  Send,
  CheckCircle2,
  Clock,
  UserCheck,
  UserPlus,
  AlertCircle,
  X,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingState";

interface ViewerConnectionState {
  id: string;
  status: "Pending" | "Accepted" | "Rejected";
  direction: "incoming" | "outgoing";
  acceptedAt: string | null;
  rejectedAt: string | null;
}

interface TargetCreator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  disciplines?: string[];
}

interface OwnedProject {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface CollaborateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCreator: TargetCreator;
  connection: ViewerConnectionState | null;
  onConnectionChange: () => Promise<void>;
  onShowToast: (msg: string, type?: "success" | "error") => void;
}

export function CollaborateModal({
  isOpen,
  onClose,
  targetCreator,
  connection,
  onConnectionChange,
  onShowToast,
}: CollaborateModalProps) {
  const [activeTab, setActiveTab] = useState<"project" | "peer">("project");

  // Invite to Project state
  const [myProjects, setMyProjects] = useState<OwnedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"Collaborator" | "ClientReviewer">("Collaborator");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Peer Connection state
  const [isConnBusy, setIsConnBusy] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);

  // Fetch owned projects when modal opens
  useEffect(() => {
    if (!isOpen) {
      setInviteSuccess(false);
      setInviteError(null);
      setConnError(null);
      return;
    }

    async function loadProjects() {
      setLoadingProjects(true);
      try {
        const res = await fetch("/api/projects?role=Owner");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMyProjects(json.data);
          if (json.data.length > 0) {
            setSelectedProjectId(json.data[0].id);
          }
        }
      } catch {
        // Safe fallback
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Project Collaboration Invite
  const handleInviteToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || isInviting) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdentifier: targetCreator.username,
          role: selectedRole,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setInviteError(json.error?.message || "Could not send collaboration invitation.");
        return;
      }

      setInviteSuccess(true);
      onShowToast(`Invitation sent to @${targetCreator.username}!`, "success");
      await onConnectionChange();
    } catch {
      setInviteError("Network error sending collaboration request.");
    } finally {
      setIsInviting(false);
    }
  };

  // Handle Peer Connection Request
  const handleSendConnection = async () => {
    if (isConnBusy) return;
    setIsConnBusy(true);
    setConnError(null);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetCreator.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConnError(json.error?.message || "Could not send connection request");
        return;
      }
      onShowToast("Connection request sent!", "success");
      await onConnectionChange();
    } catch {
      setConnError("Network error sending connection request.");
    } finally {
      setIsConnBusy(false);
    }
  };

  // Handle Accept / Reject Peer Request
  const handleRespondConnection = async (action: "accept" | "reject") => {
    if (!connection || isConnBusy) return;
    setIsConnBusy(true);
    setConnError(null);

    try {
      const res = await fetch(`/api/connections/${connection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConnError(json.error?.message || `Could not ${action} request`);
        return;
      }
      onShowToast(action === "accept" ? "Connection accepted!" : "Connection rejected", "success");
      await onConnectionChange();
    } catch {
      setConnError("Network error updating connection.");
    } finally {
      setIsConnBusy(false);
    }
  };

  // Handle Cancel / Remove Connection
  const handleDeleteConnection = async () => {
    if (!connection || isConnBusy) return;
    setIsConnBusy(true);
    setConnError(null);

    try {
      const res = await fetch(`/api/connections/${connection.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConnError(json.error?.message || "Could not update connection");
        return;
      }
      onShowToast("Connection updated", "success");
      await onConnectionChange();
    } catch {
      setConnError("Network error updating connection.");
    } finally {
      setIsConnBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F3] border border-[#203B35]/20 shadow-2xl p-6 sm:p-8 text-[#282B2A] overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#203B35]/10">
          <div className="w-12 h-12 rounded-2xl bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
            {targetCreator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={targetCreator.avatarUrl}
                alt={targetCreator.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              targetCreator.displayName.charAt(0)
            )}
          </div>
          <div>
            <h3 className="text-xl font-serif text-[#203B35] font-semibold">
              Collaborate with {targetCreator.displayName}
            </h3>
            <p className="text-xs text-[#5D635F] font-mono">@{targetCreator.username}</p>
          </div>
        </div>

        {/* Tabs for Workflow Selection */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#EFECE2] mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("project")}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "project"
                ? "bg-[#FAF8F3] text-[#203B35] shadow-sm"
                : "text-[#5D635F] hover:text-[#203B35]"
            }`}
          >
            Invite to Project Workspace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("peer")}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "peer"
                ? "bg-[#FAF8F3] text-[#203B35] shadow-sm"
                : "text-[#5D635F] hover:text-[#203B35]"
            }`}
          >
            Peer Creator Connection
          </button>
        </div>

        {/* TAB 1: INVITE TO PROJECT WORKSPACE */}
        {activeTab === "project" && (
          <div>
            {inviteSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#9DB5A5]/20 flex items-center justify-center text-[#203B35]">
                  <CheckCircle2 className="w-6 h-6 text-[#203B35]" />
                </div>
                <h4 className="text-base font-serif font-bold text-[#203B35]">
                  Collaboration Invitation Sent!
                </h4>
                <p className="text-xs text-[#5D635F] max-w-sm mx-auto">
                  @{targetCreator.username} has been invited to collaborate as a{" "}
                  <strong>{selectedRole}</strong>. Once accepted, they can access draft assets, version feedback, and project milestones.
                </p>
                <div className="pt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setInviteSuccess(false);
                      onClose();
                    }}
                    className="bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] rounded-full px-6"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : loadingProjects ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner className="w-6 h-6 text-[#203B35]" />
              </div>
            ) : myProjects.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EFECE2] flex items-center justify-center text-[#5D635F]">
                  <FolderPlus className="w-5 h-5 text-[#203B35]" />
                </div>
                <h4 className="text-sm font-bold text-[#203B35]">No Owned Projects Yet</h4>
                <p className="text-xs text-[#5D635F] max-w-xs mx-auto">
                  You need at least one active project workspace to invite collaborators. You can start a new project from your studio or connect as peers below.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Link href="/dashboard" onClick={onClose}>
                    <Button variant="secondary" size="sm" className="rounded-full text-xs">
                      Go to Studio
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab("peer")}
                    className="bg-[#203B35] text-[#F6F3EB] rounded-full text-xs"
                  >
                    Connect as Peers
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteToProject} className="space-y-4">
                <div>
                  <label htmlFor="collab-project-select" className="block text-xs font-semibold text-[#203B35] mb-1.5">
                    Select Your Project Workspace
                  </label>
                  <select
                    id="collab-project-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#203B35]/20 text-xs text-[#282B2A] focus:outline-none focus:border-[#203B35]"
                  >
                    {myProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.category} — {p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
                    Collaborator Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("Collaborator")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedRole === "Collaborator"
                          ? "border-[#203B35] bg-[#203B35]/5 text-[#203B35]"
                          : "border-[#203B35]/15 bg-white text-[#5D635F] hover:border-[#203B35]/30"
                      }`}
                    >
                      <p className="text-xs font-bold text-[#203B35]">Collaborator</p>
                      <p className="text-[11px] text-[#5D635F] mt-0.5 leading-snug">
                        Can upload version assets, participate in feedback, and co-create drafts.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole("ClientReviewer")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedRole === "ClientReviewer"
                          ? "border-[#203B35] bg-[#203B35]/5 text-[#203B35]"
                          : "border-[#203B35]/15 bg-white text-[#5D635F] hover:border-[#203B35]/30"
                      }`}
                    >
                      <p className="text-xs font-bold text-[#203B35]">Client Reviewer</p>
                      <p className="text-[11px] text-[#5D635F] mt-0.5 leading-snug">
                        Review-focused access for client approvals, revisions sign-off, and feedback.
                      </p>
                    </button>
                  </div>
                </div>

                {inviteError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isInviting}
                    isLoading={isInviting}
                    className="bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] rounded-full text-xs px-5"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send Workspace Invitation
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: PEER CREATOR CONNECTION */}
        {activeTab === "peer" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#EFECE2]/70 border border-[#203B35]/10 text-xs text-[#5D635F] leading-relaxed">
              <p className="font-semibold text-[#203B35] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#203B35]" />
                Creative Community Peer Connection
              </p>
              Connecting as peers establishes a direct creative relationship. Once approved by{" "}
              <strong>@{targetCreator.username}</strong>, you will unlock their Connections-Only contact details, private studio channels, and direct collaborations.
            </div>

            {/* Current Connection Status Box */}
            <div className="p-4 rounded-2xl bg-white border border-[#203B35]/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5D635F]">Relationship Status</span>
                {!connection || connection.status === "Rejected" ? (
                  <span className="text-[11px] font-mono text-[#92958F]">Not connected</span>
                ) : connection.status === "Pending" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3" />
                    Pending Approval
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <UserCheck className="w-3 h-3 text-emerald-700" />
                    Connected Peers
                  </span>
                )}
              </div>

              {connError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{connError}</span>
                </div>
              )}

              {/* Action Buttons based on status */}
              <div className="pt-2">
                {!connection || connection.status === "Rejected" ? (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isConnBusy}
                    isLoading={isConnBusy}
                    onClick={handleSendConnection}
                    className="w-full bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] rounded-full text-xs py-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Send Connection Request
                  </Button>
                ) : connection.status === "Pending" && connection.direction === "outgoing" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#5D635F] text-center">
                      Your connection request is awaiting approval by @{targetCreator.username}.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isConnBusy}
                      isLoading={isConnBusy}
                      onClick={handleDeleteConnection}
                      className="w-full rounded-full text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                    >
                      Cancel Request
                    </Button>
                  </div>
                ) : connection.status === "Pending" && connection.direction === "incoming" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#203B35] font-semibold text-center">
                      @{targetCreator.username} sent you a connection request!
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isConnBusy}
                        isLoading={isConnBusy}
                        onClick={() => handleRespondConnection("accept")}
                        className="bg-[#203B35] text-[#F6F3EB] rounded-full text-xs"
                      >
                        Accept Request
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isConnBusy}
                        onClick={() => handleRespondConnection("reject")}
                        className="rounded-full text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ) : connection.status === "Accepted" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-800 text-center font-medium">
                      You are actively connected as creative peers!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isConnBusy}
                      isLoading={isConnBusy}
                      onClick={handleDeleteConnection}
                      className="w-full rounded-full text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                    >
                      Disconnect Peer
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="text-[11px] text-[#92958F] text-center">
              Private contact information is never shared without verified mutual approval.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
