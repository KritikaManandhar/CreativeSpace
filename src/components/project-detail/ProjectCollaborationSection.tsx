"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  UserPlus,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import { ProjectCollaborator, CollaboratorRole } from "./projectTypes";

interface ProjectCollaborationSectionProps {
  collaborators: ProjectCollaborator[];
  creatorId: string;
  isOwner?: boolean;
  onOpenInviteModal?: () => void;
  onSendConnectRequest?: () => Promise<void>;
  connectionStatus?: "none" | "pending" | "accepted";
  isConnectBusy?: boolean;
  isCurrentUser?: boolean;
}

export function ProjectCollaborationSection({
  collaborators,
  creatorId,
  isOwner = false,
  onOpenInviteModal,
  onSendConnectRequest,
  connectionStatus = "none",
  isConnectBusy = false,
  isCurrentUser = false,
}: ProjectCollaborationSectionProps) {
  // If no collaborators exist besides creator, and user is not owner, show a clean invitation banner
  const hasCollaborators = collaborators && collaborators.length > 0;

  // Format role label
  const formatRoleLabel = (role: CollaboratorRole) => {
    switch (role) {
      case "Owner":
        return "Studio Lead & Owner";
      case "Collaborator":
        return "Co-Creator / Contributor";
      case "ClientReviewer":
        return "Client Reviewer";
      default:
        return "Contributor";
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-10">
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#203B35]/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#203B35]" />
              <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#203B35] font-semibold">
                Studio Collaboration & Collective
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5D635F]">
              {hasCollaborators
                ? "This project is developed across an independent creative collaboration with role-based sign-off."
                : "Open for verified peer collaboration, interdisciplinary score, or editorial critique."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && onOpenInviteModal && (
              <button
                type="button"
                onClick={onOpenInviteModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-medium hover:bg-[#162A26] transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Collaborator</span>
              </button>
            )}

            {!isCurrentUser && onSendConnectRequest && connectionStatus !== "accepted" && (
              <button
                type="button"
                disabled={isConnectBusy || connectionStatus === "pending"}
                onClick={onSendConnectRequest}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#203B35] text-xs font-medium border border-[#203B35]/15 hover:border-[#203B35]/35 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#203B35]" />
                <span>
                  {connectionStatus === "pending"
                    ? "Collaboration Requested"
                    : "Connect for Collaboration"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Collaborators List */}
        {hasCollaborators ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collaborators.map((c) => {
              const u = c.user;
              const isLead = c.role === "Owner";

              return (
                <div
                  key={c.id || c.userId}
                  className="rounded-2xl bg-white border border-[#203B35]/10 p-4 flex items-center justify-between gap-3 shadow-sm hover:border-[#203B35]/25 transition-all"
                >
                  <Link
                    href={`/profile/${u.username}`}
                    className="flex items-center gap-3 min-w-0 group/collab"
                  >
                    <div className="h-10 w-10 rounded-full bg-[#203B35] text-[#FAF8F3] flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0 ring-1 ring-[#203B35]/15">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                      <CreatorAvatar
                        name={u.displayName}
                        initials={u.displayName.slice(0, 2).toUpperCase()}
                        tone="#203B35"
                        accent="#C8BDE0"
                        size="xs"
                      />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#203B35] group-hover/collab:underline truncate">
                        {u.displayName}
                      </p>
                      <p className="text-[11px] font-mono text-[#92958F] truncate">
                        @{u.username}
                      </p>
                    </div>
                  </Link>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                      isLead
                        ? "bg-[#203B35] text-[#FAF8F3] font-semibold"
                        : c.role === "ClientReviewer"
                        ? "bg-[#C8BDE0]/40 text-[#203B35] font-semibold"
                        : "bg-[#EFECE2] text-[#203B35]"
                    }`}
                  >
                    {c.role}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#EFECE2]/50 text-center space-y-2">
            <p className="text-xs text-[#282B2A] font-medium">
              Solo studio creation by lead practitioner.
            </p>
            <p className="text-[11px] text-[#5D635F]">
              Interested in collaborating on sound scoring, 3D assets, or exhibition monographs? Connect directly.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
