"use client";

import React from "react";
import {
  Sparkles,
  Wrench,
  Compass,
  Globe,
  Github,
  Twitter,
  Instagram,
  ExternalLink,
  Calendar,
  MapPin,
  Lock,
  Users,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";

interface AboutCreatorProps {
  creator: {
    id: string;
    username: string;
    displayName: string;
    bio?: string | null;
    disciplines?: string[];
    socialLinks?: any;
    location?: string;
    joinedAt: string;
  };
  projects: any[];
  isOwner: boolean;
}

const COMMON_DISCIPLINE_TOOLS: Record<string, string[]> = {
  Illustration: ["Procreate", "Adobe Illustrator", "Photoshop", "Gouache & Ink"],
  Animation: ["Blender 3D", "After Effects", "Clip Studio Paint", "Toon Boom Harmony"],
  Photography: ["Lightroom Classic", "Capture One", "35mm Analog Film", "Medium Format"],
  Music: ["Ableton Live 12 Suite", "Logic Pro", "Analog Synthesizers", "Modular Eurorack"],
  "Sound Design": ["Pro Tools", "Reaper", "Izotope RX", "Field Recording"],
  "UI/UX": ["Figma", "Design Systems", "Prototyping", "Tailwind CSS"],
  "UI/UX Design": ["Figma", "Design Systems", "Prototyping", "Tailwind CSS"],
  Writing: ["Editorial Craft", "Scrivener", "Typography", "Longform Essays"],
  Video: ["DaVinci Resolve", "Premiere Pro", "Color Grading", "Cinematography"],
};

export function ProfileAboutTab({
  creator,
  projects,
  isOwner,
}: AboutCreatorProps) {
  const disciplines = Array.isArray(creator.disciplines) ? creator.disciplines : [];

  // Extract tools from project metadata and known disciplines
  const toolsSet = new Set<string>();
  projects.forEach((p) => {
    if (p.metadata?.software) {
      String(p.metadata.software)
        .split(/[,&]/)
        .forEach((s) => toolsSet.add(s.trim()));
    }
    if (p.metadata?.daw) {
      toolsSet.add(String(p.metadata.daw).trim());
    }
  });

  // Fallback to discipline tools if projects metadata doesn't specify
  disciplines.forEach((d) => {
    const defaultTools = COMMON_DISCIPLINE_TOOLS[d];
    if (defaultTools) {
      defaultTools.forEach((t) => toolsSet.add(t));
    }
  });

  const toolsList = Array.from(toolsSet);

  // Joined date formatted
  const joinedFormatted = (() => {
    try {
      return new Date(creator.joinedAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    } catch {
      return "2026";
    }
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 8 cols: Editorial Story & Disciplines */}
      <div className="lg:col-span-8 space-y-8">
        {/* Creative Statement / Bio Card */}
        <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#203B35]/10">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] font-semibold">
              Creator Narrative
            </span>
          </div>

          <h3 className="text-2xl font-serif text-[#203B35] font-semibold">
            About {creator.displayName}
          </h3>

          <p className="text-sm sm:text-base text-[#282B2A]/90 leading-relaxed font-sans font-normal whitespace-pre-line">
            {creator.bio ||
              `${creator.displayName} is an independent creator and maker contributing to the CreativeSpace community. Explore their published projects, process drafts, and collaboration works.`}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#5D635F]">
            {creator.location && (
              <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-[#9DB5A5]" />
                {creator.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#9DB5A5]" />
              CreativeSpace member since {joinedFormatted}
            </span>
          </div>
        </div>

        {/* Disciplines & Creative Specialties */}
        {disciplines.length > 0 && (
          <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#203B35]/10">
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] font-semibold">
                Fields & Specialties
              </span>
            </div>

            <h3 className="text-xl font-serif text-[#203B35] font-semibold">
              Creative Disciplines
            </h3>

            <div className="flex flex-wrap gap-2 pt-1">
              {disciplines.map((d) => (
                <div
                  key={d}
                  className="px-4 py-2 rounded-2xl bg-white border border-[#203B35]/15 text-xs font-mono font-semibold text-[#203B35] shadow-sm flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9DB5A5]" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Studio Tools & Software */}
        {toolsList.length > 0 && (
          <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#203B35]/10">
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] font-semibold">
                Studio Craft & Stack
              </span>
            </div>

            <h3 className="text-xl font-serif text-[#203B35] font-semibold">
              Tools, Software & Mediums
            </h3>

            <p className="text-xs text-[#5D635F]">
              Primary craft tools, software, and physical mediums utilized across project workspaces.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {toolsList.map((tool) => (
                <span
                  key={tool}
                  className="px-3.5 py-1.5 rounded-full bg-[#EFECE2] text-xs font-mono text-[#203B35] border border-[#203B35]/10 font-medium"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right 4 cols: Collaboration Info & Studio Availability */}
      <div className="lg:col-span-4 space-y-6">
        {/* Availability Card */}
        <div className="rounded-3xl bg-[#203B35] text-[#F6F3EB] p-6 sm:p-7 space-y-3.5 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono text-[#9DB5A5]">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Collaboration Status</span>
          </div>

          <h4 className="text-xl font-serif font-bold text-[#F6F3EB]">
            Open for Collaboration
          </h4>

          <p className="text-xs text-[#F6F3EB]/80 leading-relaxed font-sans">
            Interested in multi-disciplinary projects, peer review, and creative commissions. Use the Collaborate button on the profile to send a workspace invitation or connect as peers.
          </p>

          <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-[#9DB5A5]">
            <CheckCircle2 className="w-4 h-4 text-[#9DB5A5]" />
            <span>Verified community member</span>
          </div>
        </div>

        {/* Studio Guidelines Card */}
        <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 space-y-3">
          <h4 className="text-sm font-serif font-bold text-[#203B35]">
            Privacy & Collaboration Notice
          </h4>
          <p className="text-xs text-[#5D635F] leading-relaxed">
            In accordance with CreativeSpace 2.0 privacy standards, external contact details and private links are visible only through verified, mutual connections.
          </p>
        </div>
      </div>
    </div>
  );
}
