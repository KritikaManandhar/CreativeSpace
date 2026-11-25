"use client";

import React from "react";
import Link from "next/link";
import {
  Handshake,
  ArrowUpRight,
  Heart,
  MessageSquare,
  Users,
  Award,
  CheckCircle2,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface CollaboratorPreview {
  id: string;
  role: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface CollaborationItem {
  id: string;
  role: string;
  acceptedAt?: string | null;
  project: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    status: string;
    coverUrl?: string | null;
    creator?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
    collaborators?: CollaboratorPreview[];
    likeCount?: number;
    commentCount?: number;
  };
}

interface ProfileCollaborationsTabProps {
  collaborations: CollaborationItem[];
  creatorUsername: string;
}

export function ProfileCollaborationsTab({
  collaborations,
  creatorUsername,
}: ProfileCollaborationsTabProps) {
  if (collaborations.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto rounded-3xl bg-[#FAF8F3] border border-[#203B35]/10 p-8 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#EFECE2] flex items-center justify-center text-[#203B35]">
          <Handshake className="w-5 h-5 text-[#203B35]" />
        </div>
        <h3 className="text-base font-serif font-bold text-[#203B35]">
          No Public Collaborations Yet
        </h3>
        <p className="text-xs text-[#5D635F] leading-relaxed">
          Completed and published creative projects co-created with other community members will be exhibited here once finalized.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {collaborations.map((colab) => {
        const project = colab.project;
        const allTeam = project.collaborators || [];

        return (
          <article
            key={colab.id}
            className="group flex flex-col justify-between rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 overflow-hidden hover:border-[#203B35]/40 hover:shadow-xl transition-all duration-300"
          >
            <div>
              {/* Project Cover Preview */}
              <Link
                href={`/projects/${project.id}`}
                className="block relative aspect-[16/9] w-full bg-[#EFECE2] overflow-hidden"
              >
                {project.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.coverUrl}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#EFECE2] to-[#FAF8F3]">
                    <CelestialSpark className="w-8 h-8 text-[#203B35]/30" />
                  </div>
                )}

                {/* Role Pill Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#203B35] text-[10px] font-mono text-[#F6F3EB] font-semibold shadow-sm">
                    {colab.role || "Collaborator"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F3]/90 backdrop-blur-md text-[10px] font-mono uppercase text-[#203B35] font-semibold border border-[#203B35]/10 shadow-sm">
                    {project.category}
                  </span>
                </div>
              </Link>

              {/* Collaboration Info */}
              <div className="p-5 sm:p-6 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/projects/${project.id}`}>
                    <h4 className="text-xl font-serif font-semibold text-[#203B35] group-hover:text-[#162A26] transition-colors line-clamp-1">
                      {project.title}
                    </h4>
                  </Link>
                  <span className="h-7 w-7 rounded-full bg-[#203B35]/5 text-[#203B35] group-hover:bg-[#203B35] group-hover:text-[#F6F3EB] flex items-center justify-center transition-colors shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <p className="text-xs text-[#5D635F] line-clamp-2 leading-relaxed">
                  {project.description || "Multi-disciplinary collaborative project."}
                </p>

                {/* Collaborators / Team Previews */}
                <div className="pt-2 border-t border-[#203B35]/10 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#5D635F] font-semibold block">
                    Creative Team
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {/* Project Creator */}
                    {project.creator && (
                      <Link
                        href={`/profile/${project.creator.username}`}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-[#203B35]/15 hover:border-[#203B35]/40 hover:bg-[#EFECE2] transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          {project.creator.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={project.creator.avatarUrl}
                              alt={project.creator.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            project.creator.displayName?.charAt(0) || "C"
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[#203B35]">
                          {project.creator.displayName}
                        </span>
                        <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full bg-[#EFECE2] text-[#5D635F]">
                          Lead
                        </span>
                      </Link>
                    )}

                    {/* Fellow Collaborators */}
                    {allTeam.map((m) => {
                      if (m.user.username === project.creator?.username) return null;
                      return (
                        <Link
                          key={m.id}
                          href={`/profile/${m.user.username}`}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-[#203B35]/15 hover:border-[#203B35]/40 hover:bg-[#EFECE2] transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-[10px] font-bold overflow-hidden">
                            {m.user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.user.avatarUrl}
                                alt={m.user.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              m.user.displayName?.charAt(0) || "C"
                            )}
                          </div>
                          <span className="text-xs font-semibold text-[#203B35]">
                            {m.user.displayName}
                          </span>
                          <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full bg-[#EFECE2] text-[#5D635F]">
                            {m.role}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[#203B35]/10 flex items-center justify-between text-xs text-[#5D635F]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600/30" />
                  <span>{project.likeCount ?? 0}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#5D635F]" />
                  <span>{project.commentCount ?? 0}</span>
                </span>
              </div>

              <Link
                href={`/projects/${project.id}`}
                className="font-mono text-[11px] font-semibold text-[#203B35] hover:text-[#162A26] transition-colors"
              >
                View Project Workspace →
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
