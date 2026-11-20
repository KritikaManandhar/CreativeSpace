"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  Users,
  Globe,
  MessageSquare,
  Sparkles,
  FileImage,
} from "lucide-react";

type VersionKey = "v1" | "v2" | "v3";

interface VersionState {
  key: VersionKey;
  label: string;
  title: string;
  status: "Draft" | "In Review" | "Approved";
  visibility: "Private" | "Collaborators Only" | "Public";
  timestamp: string;
  assetName: string;
  fileSize: string;
  reviewerName: string;
  reviewerRole: string;
  reviewerInitials: string;
  comment: string;
  specs: { label: string; value: string }[];
}

const VERSIONS: VersionState[] = [
  {
    key: "v1",
    label: "v1.0",
    title: "Thumbnails & Line Composition",
    status: "Draft",
    visibility: "Private",
    timestamp: "Oct 14 · 11:20",
    assetName: "wandering_light_rough_v1.psd",
    fileSize: "48.2 MB",
    reviewerName: "Anya Sharma",
    reviewerRole: "Owner",
    reviewerInitials: "AS",
    comment: "Blocking out the horizon rhythm and framing before inviting Rohan for motion cues.",
    specs: [
      { label: "Canvas", value: "4096 × 2560" },
      { label: "Medium", value: "Procreate + PSD" },
      { label: "Stage", value: "Idea & Blocking" },
    ],
  },
  {
    key: "v2",
    label: "v2.0",
    title: "Warm Ochre Lighting Study",
    status: "In Review",
    visibility: "Collaborators Only",
    timestamp: "Oct 19 · 16:45",
    assetName: "wandering_light_color_v2.tiff",
    fileSize: "112.6 MB",
    reviewerName: "David Miller",
    reviewerRole: "Client Reviewer",
    reviewerInitials: "DM",
    comment: "Love the terracotta atmosphere—let's deepen the foreground shadow slightly for title legibility.",
    specs: [
      { label: "Canvas", value: "4096 × 2560" },
      { label: "Profile", value: "Display P3 · 16-bit" },
      { label: "Assets", value: "6 Layered Files" },
    ],
  },
  {
    key: "v3",
    label: "v3.0",
    title: "Final Key Art & Exhibition Master",
    status: "Approved",
    visibility: "Public",
    timestamp: "Oct 24 · 09:12",
    assetName: "wandering_light_master_v3.png",
    fileSize: "86.4 MB",
    reviewerName: "David Miller",
    reviewerRole: "Client Reviewer",
    reviewerInitials: "DM",
    comment: "Approved! Contrast and grain feel cinema-ready. Cleared to publish straight to your portfolio.",
    specs: [
      { label: "Canvas", value: "4096 × 2560" },
      { label: "Sign-off", value: "Approved v3.0" },
      { label: "Portfolio", value: "Featured · Public" },
    ],
  },
];

function ArtworkCanvas({ activeKey }: { activeKey: VersionKey }) {
  return (
    <div className="relative h-60 sm:h-64 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#100E0C]">
      {/* Version 1: Architectural Charcoal Sketch & Guides */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          activeKey === "v1" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(245,240,232,0.06),transparent_65%)]" />
        <svg viewBox="0 0 560 300" className="h-full w-full" fill="none" aria-hidden="true">
          {/* Perspective / Rule of thirds grid */}
          <line x1="186" y1="0" x2="186" y2="300" stroke="#F5F0E8" strokeOpacity="0.08" strokeDasharray="4 4" />
          <line x1="373" y1="0" x2="373" y2="300" stroke="#F5F0E8" strokeOpacity="0.08" strokeDasharray="4 4" />
          <line x1="0" y1="100" x2="560" y2="100" stroke="#F5F0E8" strokeOpacity="0.08" strokeDasharray="4 4" />
          <line x1="0" y1="200" x2="560" y2="200" stroke="#F5F0E8" strokeOpacity="0.08" strokeDasharray="4 4" />
          {/* Sketch sun circle */}
          <circle cx="295" cy="120" r="54" stroke="#E5A93C" strokeOpacity="0.55" strokeWidth="1.4" strokeDasharray="6 4" />
          <circle cx="295" cy="120" r="76" stroke="#F5F0E8" strokeOpacity="0.14" strokeWidth="1" />
          {/* Wireframe terrain contours */}
          <path d="M0 220 Q 130 165 260 205 T 560 185" stroke="#F5F0E8" strokeOpacity="0.45" strokeWidth="1.5" />
          <path d="M0 250 Q 190 195 360 232 T 560 218" stroke="#F5F0E8" strokeOpacity="0.28" strokeWidth="1.2" />
          {/* Monolith wireframe */}
          <rect x="266" y="128" width="58" height="106" stroke="#E85D3F" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="5 3" />
          <line x1="266" y1="128" x2="324" y2="234" stroke="#E85D3F" strokeOpacity="0.28" strokeWidth="1" />
          {/* Editorial annotation callout */}
          <circle cx="324" cy="128" r="3.5" fill="#E85D3F" />
          <line x1="328" y1="128" x2="392" y2="86" stroke="#E85D3F" strokeOpacity="0.7" strokeWidth="1" />
          <text x="398" y="89" fill="#A89F94" fontSize="10" fontFamily="monospace">FOCAL AXIS</text>
          <text x="24" y="276" fill="#756D64" fontSize="9.5" fontFamily="monospace">ROUGH BLOCKING · LAYER 01</text>
        </svg>
      </div>

      {/* Version 2: Warm Ochre & Vermilion Color Pass */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          activeKey === "v2" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#261A14] via-[#1C1410] to-[#110D0B]" />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 h-44 w-72 rounded-full bg-[#E5A93C]/25 blur-3xl" />
        <svg viewBox="0 0 560 300" className="relative h-full w-full" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="v2Sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5C469" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#E85D3F" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#E85D3F" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="v2Ridge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B251B" />
              <stop offset="100%" stopColor="#140F0D" />
            </linearGradient>
          </defs>
          <circle cx="295" cy="122" r="70" fill="url(#v2Sun)" />
          <circle cx="295" cy="122" r="44" fill="#F2B866" fillOpacity="0.88" />
          {/* Layered ridges */}
          <path d="M0 218 Q 130 164 260 202 T 560 182 L 560 300 L 0 300 Z" fill="url(#v2Ridge)" />
          <path d="M0 250 Q 190 198 360 232 T 560 218 L 560 300 L 0 300 Z" fill="#18120F" />
          {/* Monolith silhouette */}
          <rect x="268" y="128" width="54" height="106" fill="#1B1512" stroke="#E5A93C" strokeOpacity="0.4" strokeWidth="1" />
          {/* Pin comment marker from client */}
          <g transform="translate(222, 224)">
            <circle cx="0" cy="0" r="11" fill="#E5A93C" fillOpacity="0.2" />
            <circle cx="0" cy="0" r="5" fill="#E5A93C" />
          </g>
          {/* Swatch bar */}
          <g transform="translate(22, 22)">
            <rect x="0" y="0" width="16" height="16" rx="4" fill="#F2B866" />
            <rect x="22" y="0" width="16" height="16" rx="4" fill="#E85D3F" />
            <rect x="44" y="0" width="16" height="16" rx="4" fill="#3B251B" />
            <rect x="66" y="0" width="16" height="16" rx="4" fill="#18120F" stroke="#F5F0E8" strokeOpacity="0.2" />
          </g>
        </svg>
      </div>

      {/* Version 3: Final Exhibition Master */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          activeKey === "v3" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A1610] via-[#17110E] to-[#0B0A09]" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-52 w-80 rounded-full bg-[#E85D3F]/30 blur-3xl" />
        <svg viewBox="0 0 560 300" className="relative h-full w-full" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="v3Sun" x1="295" y1="68" x2="295" y2="178" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF0D4" />
              <stop offset="45%" stopColor="#F49D52" />
              <stop offset="100%" stopColor="#E85D3F" />
            </linearGradient>
            <linearGradient id="v3Beam" x1="295" y1="128" x2="295" y2="300" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F5C469" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#E85D3F" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="v3Hill1" x1="0" y1="168" x2="0" y2="300" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#462218" />
              <stop offset="100%" stopColor="#120E0C" />
            </linearGradient>
            <linearGradient id="v3Hill2" x1="0" y1="205" x2="0" y2="300" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E1410" />
              <stop offset="100%" stopColor="#0A0908" />
            </linearGradient>
          </defs>
          {/* Subtle starlight specks */}
          <circle cx="84" cy="48" r="1.2" fill="#F5F0E8" fillOpacity="0.55" />
          <circle cx="156" cy="72" r="1" fill="#F5F0E8" fillOpacity="0.4" />
          <circle cx="438" cy="54" r="1.3" fill="#F5F0E8" fillOpacity="0.5" />
          <circle cx="492" cy="96" r="1" fill="#F5F0E8" fillOpacity="0.35" />
          <circle cx="114" cy="112" r="0.9" fill="#E5A93C" fillOpacity="0.6" />
          {/* Halo ring */}
          <circle cx="295" cy="122" r="68" stroke="#F5C469" strokeOpacity="0.22" strokeWidth="1" />
          {/* Luminous sun */}
          <circle cx="295" cy="122" r="49" fill="url(#v3Sun)" />
          {/* Light reflection cone */}
          <polygon points="274,172 316,172 355,300 235,300" fill="url(#v3Beam)" />
          {/* Sculpted dunes / hills */}
          <path d="M0 218 Q 130 164 260 202 T 560 180 L 560 300 L 0 300 Z" fill="url(#v3Hill1)" />
          <path d="M0 248 Q 190 198 360 230 T 560 214 L 560 300 L 0 300 Z" fill="url(#v3Hill2)" />
          {/* Obsidian archway monolith */}
          <rect x="268" y="128" width="54" height="106" rx="2" fill="#0F0C0B" stroke="#F49D52" strokeOpacity="0.45" strokeWidth="1" />
          <rect x="285" y="160" width="20" height="74" rx="10" fill="url(#v3Sun)" fillOpacity="0.88" />
          {/* Fine exhibition framing line */}
          <rect x="14" y="14" width="532" height="272" rx="6" stroke="#F5F0E8" strokeOpacity="0.1" strokeWidth="1" />
        </svg>

        <div className="absolute bottom-3 left-4 flex items-center gap-2 rounded-full border border-[#4E9F76]/40 bg-[#0C0B0A]/80 px-2.5 py-1 backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-[#4E9F76]" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#F5F0E8]">
            Published to Portfolio
          </span>
        </div>
      </div>

      {/* Top right overlay file pill */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#0C0B0A]/75 px-2.5 py-1 backdrop-blur-md">
        <FileImage className="h-3 w-3 text-[#E5A93C]" />
        <span className="font-mono text-[10px] text-[#F5F0E8]/90">
          {VERSIONS.find((v) => v.key === activeKey)?.assetName}
        </span>
      </div>
    </div>
  );
}

export function HeroStudioPreview() {
  const [activeKey, setActiveKey] = useState<VersionKey>("v3");
  const current = VERSIONS.find((v) => v.key === activeKey) ?? VERSIONS[2];

  const visibilityIcon =
    current.visibility === "Private" ? (
      <Lock className="h-3 w-3 text-[#A89F94]" />
    ) : current.visibility === "Collaborators Only" ? (
      <Users className="h-3 w-3 text-[#E5A93C]" />
    ) : (
      <Globe className="h-3 w-3 text-[#4E9F76]" />
    );

  const statusBadgeClass =
    current.status === "Approved"
      ? "border-[#4E9F76]/35 bg-[#4E9F76]/15 text-[#7BD1A4]"
      : current.status === "In Review"
      ? "border-[#E5A93C]/35 bg-[#E5A93C]/15 text-[#F2C76E]"
      : "border-white/[0.12] bg-white/[0.05] text-[#A89F94]";

  return (
    <div className="relative w-full">
      {/* Subtle warm ambient backplate */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#E85D3F]/15 via-[#E5A93C]/8 to-transparent blur-2xl"
        aria-hidden="true"
      />

      <div className="relative rounded-2xl border border-white/[0.1] bg-[#151311]/95 p-4 sm:p-5 shadow-2xl shadow-black/70 backdrop-blur-xl">
        {/* Studio Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.07]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#E85D3F]">
                Illustration · Project
              </span>
              <span className="text-white/20">/</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#A89F94]">
                {visibilityIcon}
                {current.visibility}
              </span>
            </div>
            <h2 className="mt-1 text-base sm:text-lg font-semibold tracking-tight text-[#F5F0E8] truncate">
              Wandering Light — Key Art
            </h2>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium ${statusBadgeClass}`}
          >
            {current.status === "Approved" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : current.status === "In Review" ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {current.status}
          </span>
        </div>

        {/* Interactive Version Tabs */}
        <div className="mt-3.5 mb-3 flex items-center justify-between gap-2">
          <div
            className="inline-flex items-center rounded-xl border border-white/[0.08] bg-[#0C0B0A] p-1"
            role="tablist"
            aria-label="Project draft versions"
          >
            {VERSIONS.map((v) => {
              const isSelected = v.key === activeKey;
              return (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveKey(v.key)}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs transition-all ${
                    isSelected
                      ? "bg-[#E85D3F] text-white shadow-sm"
                      : "text-[#A89F94] hover:text-[#F5F0E8]"
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] text-[#756D64]">
            {current.timestamp} · {current.fileSize}
          </span>
        </div>

        {/* Art-Directed Interactive Preview Canvas */}
        <ArtworkCanvas activeKey={activeKey} />

        {/* Discipline Metadata Strip */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {current.specs.map((spec) => (
            <div
              key={spec.label}
              className="rounded-xl border border-white/[0.06] bg-[#0F0E0C] px-3 py-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#756D64]">
                {spec.label}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#F5F0E8] truncate">
                {spec.value}
              </p>
            </div>
          ))}
        </div>

        {/* Threaded Version Feedback Preview */}
        <div className="mt-3.5 rounded-xl border border-white/[0.07] bg-[#1B1815] p-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E85D3F]/80 to-[#E5A93C]/80 font-mono text-[11px] font-semibold text-white">
              {current.reviewerInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#F5F0E8]">
                    {current.reviewerName}
                  </span>
                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-[#A89F94]">
                    {current.reviewerRole}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#756D64]">
                  <MessageSquare className="h-3 w-3" />
                  {current.label} note
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#C7BEB4]">
                &ldquo;{current.comment}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Interactive hint */}
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-[#756D64]">
          Click <span className="text-[#F5F0E8]">v1.0 · v2.0 · v3.0</span> above to inspect version history
        </p>
      </div>
    </div>
  );
}
