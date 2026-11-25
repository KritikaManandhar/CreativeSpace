"use client";

import React, { useState } from "react";
import {
  Globe,
  Users,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Visibility, ProjectStatus } from "@prisma/client";
import { ConfirmationModal } from "./ConfirmationModal";

export interface PublishingSettingsPanelProps {
  projectId: string;
  visibility: Visibility;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  creatorUsername: string;
  isOwner: boolean;
  onVisibilityChange: (visibility: Visibility) => void;
  onStatusChange: (status: ProjectStatus) => void;
  onDeleteProject?: () => Promise<void>;
  isBusy?: boolean;
}

export function PublishingSettingsPanel({
  projectId,
  visibility,
  status,
  createdAt,
  updatedAt,
  creatorName,
  creatorUsername,
  isOwner,
  onVisibilityChange,
  onStatusChange,
  onDeleteProject,
  isBusy = false,
}: PublishingSettingsPanelProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyId = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(projectId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteProject) return;
    setIsDeleting(true);
    try {
      await onDeleteProject();
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. VISIBILITY SETTINGS                                       */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-5 sm:p-6 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#203B35]" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              Publishing Visibility
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#5D635F]">
            Access Scope
          </span>
        </div>

        <div className="space-y-2.5">
          {/* A. Public */}
          <button
            type="button"
            onClick={() => onVisibilityChange(Visibility.Public)}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
              visibility === Visibility.Public
                ? "bg-white border-[#203B35] ring-1 ring-[#203B35]/20 shadow-xs"
                : "bg-[#F6F3EB]/60 border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-xl mt-0.5 ${
                    visibility === Visibility.Public
                      ? "bg-[#203B35] text-[#FAF8F3]"
                      : "bg-[#EFECE2] text-[#5D635F]"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#203B35] flex items-center gap-1.5">
                    <span>Public Exhibition</span>
                    {visibility === Visibility.Public && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#5D635F] mt-0.5 leading-relaxed">
                    Visible to all visitors in the community feed, explore gallery, and creator search.
                  </p>
                </div>
              </div>
              <div
                className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  visibility === Visibility.Public
                    ? "border-[#203B35] bg-[#203B35]"
                    : "border-[#92958F]"
                }`}
              >
                {visibility === Visibility.Public && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>

          {/* B. Collaborators Only */}
          <button
            type="button"
            onClick={() => onVisibilityChange(Visibility.CollaboratorsOnly)}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
              visibility === Visibility.CollaboratorsOnly
                ? "bg-white border-[#203B35] ring-1 ring-[#203B35]/20 shadow-xs"
                : "bg-[#F6F3EB]/60 border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-xl mt-0.5 ${
                    visibility === Visibility.CollaboratorsOnly
                      ? "bg-[#203B35] text-[#FAF8F3]"
                      : "bg-[#EFECE2] text-[#5D635F]"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#203B35] flex items-center gap-1.5">
                    <span>Collaborators & Reviewers Only</span>
                    {visibility === Visibility.CollaboratorsOnly && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#5D635F] mt-0.5 leading-relaxed">
                    Restricted to invited co-creators and client reviewers. Hidden from public discovery.
                  </p>
                </div>
              </div>
              <div
                className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  visibility === Visibility.CollaboratorsOnly
                    ? "border-[#203B35] bg-[#203B35]"
                    : "border-[#92958F]"
                }`}
              >
                {visibility === Visibility.CollaboratorsOnly && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>

          {/* C. Private */}
          <button
            type="button"
            onClick={() => onVisibilityChange(Visibility.Private)}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
              visibility === Visibility.Private
                ? "bg-white border-[#203B35] ring-1 ring-[#203B35]/20 shadow-xs"
                : "bg-[#F6F3EB]/60 border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-xl mt-0.5 ${
                    visibility === Visibility.Private
                      ? "bg-[#203B35] text-[#FAF8F3]"
                      : "bg-[#EFECE2] text-[#5D635F]"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#203B35] flex items-center gap-1.5">
                    <span>Private Studio Draft</span>
                    {visibility === Visibility.Private && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#5D635F] mt-0.5 leading-relaxed">
                    Only you and platform administrators can view and iterate on this workspace.
                  </p>
                </div>
              </div>
              <div
                className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  visibility === Visibility.Private
                    ? "border-[#203B35] bg-[#203B35]"
                    : "border-[#92958F]"
                }`}
              >
                {visibility === Visibility.Private && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PROJECT STAGE & PROGRESSION                               */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-5 sm:p-6 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#203B35]" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              Project Stage
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#5D635F]">
            Lifecycle State
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Idea */}
          <button
            type="button"
            onClick={() => onStatusChange(ProjectStatus.Idea)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              status === ProjectStatus.Idea
                ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35] shadow-xs"
                : "bg-[#F6F3EB]/60 text-[#282B2A] border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Concept</span>
            </div>
            <p
              className={`text-[10px] mt-1 ${
                status === ProjectStatus.Idea ? "text-[#9DB5A5]" : "text-[#5D635F]"
              }`}
            >
              Early ideation
            </p>
          </button>

          {/* InProgress */}
          <button
            type="button"
            onClick={() => onStatusChange(ProjectStatus.InProgress)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              status === ProjectStatus.InProgress
                ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35] shadow-xs"
                : "bg-[#F6F3EB]/60 text-[#282B2A] border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </div>
            <p
              className={`text-[10px] mt-1 ${
                status === ProjectStatus.InProgress
                  ? "text-[#9DB5A5]"
                  : "text-[#5D635F]"
              }`}
            >
              Active iteration
            </p>
          </button>

          {/* InReview */}
          <button
            type="button"
            onClick={() => onStatusChange(ProjectStatus.InReview)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              status === ProjectStatus.InReview
                ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35] shadow-xs"
                : "bg-[#F6F3EB]/60 text-[#282B2A] border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>In Review</span>
            </div>
            <p
              className={`text-[10px] mt-1 ${
                status === ProjectStatus.InReview ? "text-[#9DB5A5]" : "text-[#5D635F]"
              }`}
            >
              Peer feedback
            </p>
          </button>

          {/* Completed */}
          <button
            type="button"
            onClick={() => onStatusChange(ProjectStatus.Completed)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              status === ProjectStatus.Completed
                ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35] shadow-xs"
                : "bg-[#F6F3EB]/60 text-[#282B2A] border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </div>
            <p
              className={`text-[10px] mt-1 ${
                status === ProjectStatus.Completed ? "text-[#9DB5A5]" : "text-[#5D635F]"
              }`}
            >
              Final deliverable
            </p>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. PROJECT ATTRIBUTION & AUDIT INFO                          */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-5 sm:p-6 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold">
          Attribution & System Info
        </h3>

        <div className="text-xs space-y-2 text-[#5D635F]">
          <div className="flex items-center justify-between">
            <span>Author / Owner</span>
            <span className="font-semibold text-[#203B35]">
              {creatorName} (@{creatorUsername})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Published</span>
            <span className="font-mono text-[11px]">
              {new Date(createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Last Modified</span>
            <span className="font-mono text-[11px]">
              {new Date(updatedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#203B35]/10">
            <span>Project ID</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#203B35] hover:underline"
              title="Copy Project UUID"
            >
              {copiedId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#92958F]" />
                  <span>{projectId.slice(0, 8)}...</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. DESTRUCTIVE ACTIONS / DANGER ZONE                         */}
      {/* ============================================================ */}
      {isOwner && onDeleteProject && (
        <div className="rounded-3xl bg-rose-50/50 border border-rose-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-800 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>Danger Zone</span>
          </div>

          <p className="text-xs text-rose-800/80 leading-relaxed">
            Deleting this creative work permanently removes all version iterations, media assets, feedback comments, and portfolio features.
          </p>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-300 transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Creative Work</span>
          </button>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Work?"
        message="This action cannot be undone. All version iterations, attached media files, discussion feedback, and portfolio links will be permanently erased."
        confirmLabel="Yes, Delete Work"
        cancelLabel="Keep Work"
        variant="danger"
        isBusy={isDeleting}
      />
    </div>
  );
}
