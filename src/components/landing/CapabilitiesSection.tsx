"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, GitBranch, MessageCircle, Sparkles, UserPlus } from "lucide-react";
import { CelestialSpark, CreatorAvatar } from "./CreativeSpaceBrand";

const EASE_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PROCESS_VERSIONS = [
  {
    version: "v1.0",
    label: "Composition Study",
    date: "May 04",
    status: "Archived",
    note: "Pencil blocking & botanical silhouette balance.",
    image: "/images/landing/artwork-graphic-design.jpg",
  },
  {
    version: "v2.0",
    label: "Palette & Gouache Test",
    date: "May 11",
    status: "Reviewed",
    note: "Refined forest green wash and soft lavender crescent.",
    image: "/images/landing/artwork-ceramics.jpg",
  },
  {
    version: "v3.0",
    label: "Exhibition Plate",
    date: "May 18",
    status: "Published",
    note: "Final high-resolution scan shared to community.",
    image: "/images/landing/artwork-illustration.jpg",
  },
];

const CONSTELLATION_CREATORS = [
  {
    name: "Anya Sharma",
    handle: "@anya_art",
    discipline: "Illustration",
    initials: "AS",
    tone: "#203B35",
    accent: "#C8BDE0",
    works: 18,
  },
  {
    name: "Kenji Sato",
    handle: "@kenji_film",
    discipline: "Photography",
    initials: "KS",
    tone: "#384A43",
    accent: "#9DB5A5",
    works: 24,
  },
  {
    name: "Rohan Verma",
    handle: "@rohan_anim",
    discipline: "Animation",
    initials: "RV",
    tone: "#28423C",
    accent: "#C8BDE0",
    works: 11,
  },
  {
    name: "Hannah Lindqvist",
    handle: "@hannah_prose",
    discipline: "Writing",
    initials: "HL",
    tone: "#45544E",
    accent: "#EFECE2",
    works: 32,
  },
];

/** Visual Composition 1: Interactive Process & Version Atelier Preview */
function CreateShareMockup() {
  const [selectedIdx, setSelectedIdx] = useState(2);
  const current = PROCESS_VERSIONS[selectedIdx];

  return (
    <div className="relative rounded-xl border border-[#203B35]/12 bg-[#FAF8F3] p-5 sm:p-7 overflow-hidden">
      {/* Quiet top bar */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#203B35]/10">
        <div className="flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-[#203B35]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#203B35]">
            Process History
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9DB5A5]/25 px-2.5 py-0.5 text-[11px] font-medium text-[#203B35]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#203B35]" />
          {current.status}
        </span>
      </div>

      {/* Main Preview + Version Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        <div className="sm:col-span-7">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#EFECE2] border border-[#203B35]/10">
            <Image
              src={current.image}
              alt={`${current.label} preview`}
              fill
              sizes="(max-width: 640px) 84vw, 280px"
              className="object-cover transition-all duration-500"
            />
            <div className="absolute bottom-3 left-3 right-3 rounded-md bg-[#FAF8F3]/92 backdrop-blur-sm px-3 py-2 border border-[#203B35]/10">
              <p className="text-[11.5px] font-medium text-[#203B35]">
                {current.version} — {current.label}
              </p>
              <p className="text-[11px] text-[#5D635F] mt-0.5 line-clamp-1">{current.note}</p>
            </div>
          </div>
        </div>

        {/* Interactive Version Timeline */}
        <div className="sm:col-span-5 space-y-2.5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#5D635F] mb-2">
            Select Revision
          </p>
          {PROCESS_VERSIONS.map((item, idx) => {
            const active = idx === selectedIdx;
            return (
              <button
                key={item.version}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left rounded-lg p-3 border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  active
                    ? "border-[#203B35] bg-[#203B35] text-[#F6F3EB]"
                    : "border-[#203B35]/10 bg-[#F6F3EB]/70 text-[#282B2A] hover:border-[#203B35]/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium">{item.version}</span>
                  <span
                    className={`text-[10.5px] ${
                      active ? "text-[#9DB5A5]" : "text-[#92958F]"
                    }`}
                  >
                    {item.date}
                  </span>
                </div>
                <p
                  className={`mt-1 text-[12.5px] font-medium ${
                    active ? "text-[#F6F3EB]" : "text-[#203B35]"
                  }`}
                >
                  {item.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Visual Composition 2: Creator Constellation & Discipline Discovery */
function DiscoverConnectMockup() {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    "@anya_art": true,
  });

  const toggleConnect = (handle: string) => {
    setConnected((prev) => ({ ...prev, [handle]: !prev[handle] }));
  };

  return (
    <div className="relative rounded-xl border border-[#203B35]/12 bg-[#FAF8F3] p-5 sm:p-7 overflow-hidden">
      {/* Delicate cosmic orbit background lines */}
      <svg
        viewBox="0 0 420 280"
        fill="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
        aria-hidden="true"
      >
        <ellipse
          cx="210"
          cy="140"
          rx="182"
          ry="98"
          transform="rotate(-11 210 140)"
          stroke="#9DB5A5"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        <circle cx="355" cy="58" r="3" fill="#C8BDE0" />
        <circle cx="52" cy="212" r="2.5" fill="#9DB5A5" />
      </svg>

      <div className="relative z-10">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#203B35]/10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#203B35]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#203B35]">
              Creators In Your Orbit
            </span>
          </div>
          <span className="text-[11px] text-[#5D635F]">4 Disciplines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONSTELLATION_CREATORS.map((creator) => {
            const isConnected = Boolean(connected[creator.handle]);
            return (
              <div
                key={creator.handle}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#203B35]/10 bg-[#F6F3EB]/90 p-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CreatorAvatar
                    initials={creator.initials}
                    tone={creator.tone}
                    accent={creator.accent}
                    name={creator.name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-[#203B35] truncate">
                      {creator.name}
                    </p>
                    <p className="text-[11.5px] text-[#5D635F] truncate">
                      {creator.discipline} · {creator.works} works
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleConnect(creator.handle)}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                    isConnected
                      ? "bg-[#203B35] text-[#F6F3EB]"
                      : "border border-[#203B35]/20 bg-[#FAF8F3] text-[#203B35] hover:border-[#203B35]"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Check className="h-3 w-3 text-[#9DB5A5]" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3" />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Mini cross-discipline ribbon */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#EFECE2]/85 px-4 py-2.5 text-[12px] text-[#282B2A]/80">
          <span>Discovering new voices across Illustration, Film &amp; Print</span>
          <CelestialSpark className="h-3.5 w-3.5 text-[#C8BDE0] shrink-0" />
        </div>
      </div>
    </div>
  );
}

/** Visual Composition 3: Editorial Critique & Co-Creation Board */
function FeedbackCollabMockup() {
  return (
    <div className="relative rounded-xl border border-[#203B35]/12 bg-[#FAF8F3] p-5 sm:p-7 overflow-hidden">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#203B35]/10">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5 text-[#203B35]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#203B35]">
            Studio Critique · Shared Draft
          </span>
        </div>

        {/* Collaborator Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <CreatorAvatar initials="RV" tone="#203B35" accent="#C8BDE0" name="Rohan Verma" size="xs" />
            <CreatorAvatar initials="ER" tone="#3A4B44" accent="#9DB5A5" name="Elena Rostova" size="xs" />
            <CreatorAvatar initials="MS" tone="#4F5E58" accent="#EFECE2" name="Mateo Silva" size="xs" />
          </div>
          <span className="text-[11px] text-[#5D635F]">3 collaborators</span>
        </div>
      </div>

      {/* Shared Artwork Frame with Pinned Review Notes */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-[#EFECE2] border border-[#203B35]/10">
        <Image
          src="/images/landing/artwork-animation.jpg"
          alt="Animated film frame under collaborative review"
          fill
          sizes="(max-width: 1024px) 90vw, 520px"
          className="object-cover"
        />

        {/* Pinned Annotation Marker 1 */}
        <div
          className="absolute top-[30%] left-[28%] flex h-6 w-6 items-center justify-center rounded-full bg-[#F6F3EB] text-[#203B35] font-mono text-[10px] font-semibold ring-4 ring-[#C8BDE0]/50 shadow-sm"
          aria-hidden="true"
        >
          1
        </div>

        {/* Pinned Annotation Marker 2 */}
        <div
          className="absolute bottom-[32%] right-[26%] flex h-6 w-6 items-center justify-center rounded-full bg-[#203B35] text-[#F6F3EB] font-mono text-[10px] font-semibold ring-4 ring-[#9DB5A5]/45 shadow-sm"
          aria-hidden="true"
        >
          2
        </div>
      </div>

      {/* Threaded Feedback Notes */}
      <div className="mt-4 space-y-2.5">
        <div className="flex items-start gap-3 rounded-lg bg-[#F6F3EB] p-3 border border-[#203B35]/8">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C8BDE0]/45 font-mono text-[10px] font-semibold text-[#203B35]">
            1
          </span>
          <div className="min-w-0 text-[12.5px]">
            <p className="text-[#203B35] font-medium">
              Elena Rostova{" "}
              <span className="font-normal text-[#5D635F] ml-1">· Color Lead</span>
            </p>
            <p className="mt-0.5 text-[#282B2A]/80 leading-relaxed">
              The soft twilight lavender over the glass roof balances the warm lantern glow beautifully.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-[#F6F3EB] p-3 border border-[#203B35]/8">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#203B35] font-mono text-[10px] font-semibold text-[#F6F3EB]">
            2
          </span>
          <div className="min-w-0 text-[12.5px]">
            <p className="text-[#203B35] font-medium">
              Rohan Verma{" "}
              <span className="font-normal text-[#5D635F] ml-1">· Director</span>
            </p>
            <p className="mt-0.5 text-[#282B2A]/80 leading-relaxed">
              Agreed — locking lighting pass for Frame 042 and uploading the updated sequence now.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CapabilitiesSection() {
  return (
    <section
      id="about"
      aria-labelledby="capabilities-heading"
      className="relative w-full bg-[#F6F3EB] border-t border-[#203B35]/10 py-24 sm:py-28 lg:py-36 scroll-mt-16"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75, ease: EASE_EDITORIAL }}
          className="max-w-2xl mb-16 sm:mb-20 lg:mb-24"
        >
          <div className="inline-flex items-center gap-2.5 mb-5">
            <span className="font-mono text-[11px] tracking-[0.18em] text-[#5D635F]">02</span>
            <span className="h-[1px] w-7 bg-[#9DB5A5]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#203B35]/75">
              Create, Share &amp; Collaborate
            </span>
          </div>

          <h2
            id="capabilities-heading"
            className="font-serif text-[2.65rem] sm:text-[3.5rem] lg:text-[4.1rem] font-normal leading-[1.03] tracking-[-0.02em] text-[#203B35]"
          >
            More than a place to{" "}
            <span className="italic font-normal">showcase.</span>
          </h2>

          <p className="mt-5 max-w-xl text-[15.5px] sm:text-[16.5px] leading-[1.7] text-[#282B2A]/80">
            CreativeSpace brings creators together to share their process, exchange ideas,
            and make something meaningful.
          </p>
        </motion.div>

        {/* Three Distinct Asymmetric Feature Compositions */}
        <div className="space-y-20 sm:space-y-24 lg:space-y-32">
          {/* ---------------------------------------------------------- */}
          {/* 1. CREATE & SHARE (Visual Left / Narrative Right)          */}
          {/* ---------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
          >
            <div className="lg:col-span-7">
              <CreateShareMockup />
            </div>

            <div className="lg:col-span-5 lg:pl-4">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-serif italic text-[2.1rem] leading-none text-[#9DB5A5]">
                  01
                </span>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[#203B35]">
                  Create &amp; Share
                </span>
              </div>

              <h3 className="font-serif text-[2rem] sm:text-[2.4rem] leading-[1.1] text-[#203B35]">
                Present the finished piece — and the craft behind it.
              </h3>

              <p className="mt-4 text-[15.5px] leading-[1.7] text-[#282B2A]/80">
                Creators can upload projects, showcase their work, and share different
                versions of their creative process.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {["Versioned Drafts", "Visual Process Logs", "Curated Portfolios"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[#203B35]/12 bg-[#EFECE2]/70 px-3.5 py-1 text-[12px] text-[#203B35]/85"
                    >
                      {chip}
                    </span>
                  )
                )}
              </div>
            </div>
          </motion.div>

          {/* ---------------------------------------------------------- */}
          {/* 2. DISCOVER & CONNECT (Narrative Left / Visual Right)      */}
          {/* ---------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
          >
            <div className="lg:col-span-5 lg:pr-4 order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-serif italic text-[2.1rem] leading-none text-[#9DB5A5]">
                  02
                </span>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[#203B35]">
                  Discover &amp; Connect
                </span>
              </div>

              <h3 className="font-serif text-[2rem] sm:text-[2.4rem] leading-[1.1] text-[#203B35]">
                Wander across disciplines and find kindred makers.
              </h3>

              <p className="mt-4 text-[15.5px] leading-[1.7] text-[#282B2A]/80">
                Explore other creators, discover different creative disciplines, and
                engage with their work.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {["Cross-Discipline Discovery", "Creator Profiles", "Thoughtful Following"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[#203B35]/12 bg-[#EFECE2]/70 px-3.5 py-1 text-[12px] text-[#203B35]/85"
                    >
                      {chip}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <DiscoverConnectMockup />
            </div>
          </motion.div>

          {/* ---------------------------------------------------------- */}
          {/* 3. FEEDBACK & COLLABORATION (Visual Left / Narrative Right)*/}
          {/* ---------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
          >
            <div className="lg:col-span-7">
              <FeedbackCollabMockup />
            </div>

            <div className="lg:col-span-5 lg:pl-4">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-serif italic text-[2.1rem] leading-none text-[#9DB5A5]">
                  03
                </span>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[#203B35]">
                  Feedback &amp; Collaboration
                </span>
              </div>

              <h3 className="font-serif text-[2rem] sm:text-[2.4rem] leading-[1.1] text-[#203B35]">
                Grow stronger through generous critique and co-creation.
              </h3>

              <p className="mt-4 text-[15.5px] leading-[1.7] text-[#282B2A]/80">
                Exchange feedback, connect with other creators, and collaborate on
                creative projects.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {["Contextual Critique", "Shared Workspaces", "Co-Creator Roles"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[#203B35]/12 bg-[#EFECE2]/70 px-3.5 py-1 text-[12px] text-[#203B35]/85"
                    >
                      {chip}
                    </span>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
