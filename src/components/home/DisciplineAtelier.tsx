"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Brush,
  Camera,
  Music,
  PenTool,
  Film,
  Video,
  Layout,
  ArrowUpRight,
  Layers,
  Users,
} from "lucide-react";

interface DisciplineProfile {
  id: string;
  name: string;
  tagline: string;
  description: string;
  sampleTitle: string;
  sampleCreator: string;
  accentColor: string;
  icon: React.ComponentType<{ className?: string }>;
  specs: { field: string; value: string }[];
  formats: string[];
  roles: string[];
}

const DISCIPLINES: DisciplineProfile[] = [
  {
    id: "Illustration",
    name: "Illustration",
    tagline: "From charcoal studies to print-ready editions.",
    description:
      "Track canvas dimensions, color profiles, brush packs, and layered drafts cleanly alongside client sign-offs.",
    sampleTitle: "Solstice Editorial Series",
    sampleCreator: "Anya Sharma",
    accentColor: "#E85D3F",
    icon: Brush,
    specs: [
      { field: "Canvas Size", value: "4096 × 5120 px" },
      { field: "Color Space", value: "Display P3 · 300 DPI" },
      { field: "Primary Tools", value: "Procreate, Photoshop" },
      { field: "Style", value: "Editorial Gouache & Vector" },
    ],
    formats: ["PSD", "PROCREATE", "SVG", "TIFF", "PNG"],
    roles: ["Lead Illustrator", "Art Director", "Client Reviewer"],
  },
  {
    id: "Photography",
    name: "Photography",
    tagline: "A digital darkroom built for selects and light.",
    description:
      "Preserve camera gear, lens choices, lighting setups, and color grades right next to contact sheets and final masters.",
    sampleTitle: "Monsoon Quiet — Architectural Study",
    sampleCreator: "Karan Thapa",
    accentColor: "#E5A93C",
    icon: Camera,
    specs: [
      { field: "Camera Body", value: "Leica Q3 · Full Frame" },
      { field: "Optics", value: "28mm Summilux f/1.7" },
      { field: "Exposure", value: "1/250s · f/2.8 · ISO 200" },
      { field: "Format", value: "14-bit DNG RAW + WebP" },
    ],
    formats: ["RAW", "DNG", "TIFF", "JPG", "XMP"],
    roles: ["Photographer", "Retoucher", "Editorial Client"],
  },
  {
    id: "Music",
    name: "Music & Audio",
    tagline: "Stems, mixes, and masters in clear version order.",
    description:
      "Keep tempo, musical key, DAW session info, and revision bounce notes attached to every draft mix.",
    sampleTitle: "Nocturne in Terracotta (Film Cue)",
    sampleCreator: "Grace Chen",
    accentColor: "#4E9F76",
    icon: Music,
    specs: [
      { field: "Tempo & Key", value: "114 BPM · D Minor" },
      { field: "DAW Environment", value: "Ableton Live 12 + Logic" },
      { field: "Master Spec", value: "24-bit · 48 kHz WAV" },
      { field: "Stems Included", value: "Strings, Synth, Foley" },
    ],
    formats: ["WAV", "FLAC", "MP3", "MIDI", "ZIP STEMS"],
    roles: ["Composer", "Mix Engineer", "Film Director"],
  },
  {
    id: "Writing",
    name: "Writing",
    tagline: "Drafts, manuscripts, and line notes in one room.",
    description:
      "Organize scripts, chapters, and worldbuilding lore with target word counts, revision states, and editor critiques.",
    sampleTitle: "The Glass Cartographer — Pilot Script",
    sampleCreator: "Mira Joshi",
    accentColor: "#D98A4E",
    icon: PenTool,
    specs: [
      { field: "Format", value: "60-Min Pilot Teleplay" },
      { field: "Word Count", value: "14,820 / 16,000 words" },
      { field: "Draft Stage", value: "Second Revision Pass" },
      { field: "Genre", value: "Speculative Literary Drama" },
    ],
    formats: ["PDF", "FDX", "MD", "DOCX", "EPUB"],
    roles: ["Screenwriter", "Story Editor", "Showrunner"],
  },
  {
    id: "Animation",
    name: "Animation",
    tagline: "Bring writers, riggers, and composers into sync.",
    description:
      "Coordinate animatics, character turnarounds, lighting tests, and rough cuts across multi-disciplinary teams.",
    sampleTitle: "Wandering Light — Short Film",
    sampleCreator: "Rohan Verma",
    accentColor: "#F47652",
    icon: Film,
    specs: [
      { field: "Pipeline", value: "2D Frame + Blender 3D" },
      { field: "Frame Rate", value: "24 fps · On Twos" },
      { field: "Aspect Ratio", value: "2.39:1 Anamorphic" },
      { field: "Runtime", value: "04:18 Rough Cut v4" },
    ],
    formats: ["MP4", "MOV", "BLEND", "AEP", "EXR"],
    roles: ["Director", "Character Artist", "Sound Designer"],
  },
  {
    id: "Video",
    name: "Video & Film",
    tagline: "Cut, grade, and deliver client edits cleanly.",
    description:
      "Store color spaces, LUT references, aspect deliverables, and timecoded client approvals without chaotic file links.",
    sampleTitle: "Crafted by Hand — Brand Documentary",
    sampleCreator: "Sora Lind",
    accentColor: "#C96A55",
    icon: Video,
    specs: [
      { field: "Resolution", value: "4K DCI · 4096 × 2160" },
      { field: "Color Space", value: "ARRI LogC4 → Rec.709" },
      { field: "Edit Suite", value: "DaVinci Resolve Studio" },
      { field: "Deliverables", value: "Master 16:9 + Social 9:16" },
    ],
    formats: ["MOV", "MP4", "CUBE LUT", "DRP", "SRT"],
    roles: ["Editor", "Colorist", "Brand Reviewer"],
  },
  {
    id: "UI/UX",
    name: "UI / UX Design",
    tagline: "Design systems, flows, and stakeholder sign-off.",
    description:
      "Pair prototype iterations, component specs, and usability notes into a single showcase-ready case study.",
    sampleTitle: "Kanso Audio — Spatial Mobile System",
    sampleCreator: "Nadia Park",
    accentColor: "#63A389",
    icon: Layout,
    specs: [
      { field: "Platform", value: "iOS 18 · Adaptive Web" },
      { field: "Design System", value: "48 Tokens · 94 Components" },
      { field: "Tooling", value: "Figma + Interactive Proto" },
      { field: "Accessibility", value: "WCAG AA Verified" },
    ],
    formats: ["FIG", "SVG", "PDF", "JSON TOKENS", "MP4"],
    roles: ["Product Designer", "UX Researcher", "Client Lead"],
  },
];

export function DisciplineAtelier() {
  const [selectedId, setSelectedId] = useState<string>(DISCIPLINES[0].id);
  const active = DISCIPLINES.find((d) => d.id === selectedId) ?? DISCIPLINES[0];
  const ActiveIcon = active.icon;

  return (
    <div className="space-y-8">
      {/* Discipline Selector Ribbon */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Creative disciplines"
      >
        {DISCIPLINES.map((discipline) => {
          const Icon = discipline.icon;
          const isActive = discipline.id === selectedId;
          return (
            <button
              key={discipline.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedId(discipline.id)}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "border-[#E85D3F]/60 bg-[#E85D3F] text-white shadow-md shadow-[#E85D3F]/20"
                  : "border-white/[0.09] bg-[#151311] text-[#A89F94] hover:border-white/[0.2] hover:text-[#F5F0E8]"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${
                  isActive ? "text-white" : "text-[#A89F94] group-hover:text-[#F5F0E8]"
                }`}
              />
              <span>{discipline.name}</span>
            </button>
          );
        })}
      </div>

      {/* Editorial Spec Showcase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#151311]">
        {/* Left: Discipline Narrative */}
        <div className="lg:col-span-5 p-7 sm:p-9 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-20 transition-colors duration-500"
            style={{ backgroundColor: active.accentColor }}
            aria-hidden="true"
          />

          <div className="relative space-y-5">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.1] bg-[#0C0B0A]">
              <ActiveIcon className="h-5 w-5 text-[#F47652]" />
            </div>

            <div className="space-y-2.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#A89F94]">
                Tailored Studio Schema · {active.name}
              </p>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#F5F0E8] leading-[1.12]">
                {active.tagline}
              </h3>
              <p className="text-sm leading-relaxed text-[#A89F94] pt-1">
                {active.description}
              </p>
            </div>
          </div>

          <div className="relative mt-8 pt-6 border-t border-white/[0.07] flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#756D64]">
                Example Workspace
              </p>
              <p className="text-sm font-medium text-[#F5F0E8] mt-0.5">
                {active.sampleTitle}
              </p>
              <p className="text-xs text-[#8F877D]">by {active.sampleCreator}</p>
            </div>

            <Link
              href={`/discover?category=${encodeURIComponent(active.id)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.03] px-4 py-2 text-xs font-medium text-[#F5F0E8] hover:border-[#E85D3F]/60 hover:bg-[#E85D3F]/10 transition-colors shrink-0"
            >
              Browse {active.id}
              <ArrowUpRight className="h-3.5 w-3.5 text-[#F47652]" />
            </Link>
          </div>
        </div>

        {/* Right: Structured Project Metadata Blueprint */}
        <div className="lg:col-span-7 p-7 sm:p-9 bg-[#110F0D] flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#A89F94]">
                <Layers className="h-3.5 w-3.5 text-[#E5A93C]" />
                Discipline-Native Project Fields
              </span>
              <span className="font-mono text-[11px] text-[#4E9F76]">
                Auto-configured on creation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {active.specs.map((spec) => (
                <div
                  key={spec.field}
                  className="rounded-xl border border-white/[0.07] bg-[#171412] p-4 transition-colors hover:border-white/[0.14]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#756D64]">
                    {spec.field}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-[#F5F0E8]">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-white/[0.07]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#756D64] mb-2.5">
                Supported Asset Formats
              </p>
              <div className="flex flex-wrap gap-1.5">
                {active.formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="rounded-md border border-white/[0.08] bg-[#0C0B0A] px-2.5 py-1 font-mono text-[11px] text-[#C7BEB4]"
                  >
                    .{fmt.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#756D64] mb-2.5">
                <Users className="h-3 w-3 text-[#A89F94]" />
                Typical Studio Crew
              </p>
              <div className="flex flex-wrap gap-1.5">
                {active.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-[#E5A93C]/25 bg-[#E5A93C]/10 px-2.5 py-1 text-[11px] font-medium text-[#F2C76E]"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
