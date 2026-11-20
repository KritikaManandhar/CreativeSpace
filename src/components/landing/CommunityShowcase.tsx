"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Heart } from "lucide-react";
import {
  SHOWCASE_DISCIPLINES,
  SHOWCASE_PROJECTS,
  type CreativeDiscipline,
  type ShowcaseProject,
} from "./landingData";
import { CelestialSpark, CreatorAvatar } from "./CreativeSpaceBrand";

const EASE_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface ShowcaseCardProps {
  project: ShowcaseProject;
  index: number;
  liked: boolean;
  onToggleLike: (id: string) => void;
}

function ShowcaseCard({ project, index, liked, onToggleLike }: ShowcaseCardProps) {
  const displayLikes = project.likes + (liked ? 1 : 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{
        duration: 0.72,
        delay: Math.min((index % 3) * 0.08, 0.24),
        ease: EASE_EDITORIAL,
      }}
      className="group flex flex-col"
    >
      {/* Artwork Frame */}
      <Link
        href={`/discover?category=${encodeURIComponent(project.discoverCategory)}`}
        className="relative block w-full overflow-hidden rounded-[6px] bg-[#EFECE2] border border-[#203B35]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F3EB]"
        aria-label={`View ${project.title} by ${project.creatorName}`}
      >
        <div className={`relative w-full overflow-hidden ${project.aspectClass}`}>
          <Image
            src={project.imageSrc}
            alt={project.imageAlt}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Subtle top-left discipline tag */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-[#F6F3EB]/92 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-medium tracking-[0.04em] text-[#203B35] border border-[#203B35]/10">
              {project.discipline}
            </span>
          </div>

          {/* Subtle hover indicator top-right */}
          <div
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#203B35]/85 text-[#F6F3EB] opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
            aria-hidden="true"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Link>

      {/* Clean Minimal Metadata */}
      <div className="mt-3.5 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <Link
            href={`/discover?category=${encodeURIComponent(project.discoverCategory)}`}
            className="block text-[16px] font-medium tracking-[-0.01em] text-[#203B35] group-hover:text-[#162A26] transition-colors truncate"
          >
            {project.title}
          </Link>

          <div className="mt-2 flex items-center gap-2">
            <CreatorAvatar
              initials={project.avatarInitials}
              tone={project.avatarTone}
              accent={project.avatarAccent}
              name={project.creatorName}
              size="xs"
            />
            <span className="text-[13px] text-[#282B2A]/80 truncate">
              {project.creatorName}
            </span>
            <span className="text-[#9DB5A5]" aria-hidden="true">
              ·
            </span>
            <span className="text-[12px] text-[#5D635F] truncate">
              {project.editionNote}
            </span>
          </div>
        </div>

        {/* Subtle Like / Appreciation Indicator */}
        <button
          type="button"
          onClick={() => onToggleLike(project.id)}
          aria-pressed={liked}
          aria-label={liked ? `Remove appreciation from ${project.title}` : `Appreciate ${project.title}`}
          className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
            liked
              ? "bg-[#203B35]/10 text-[#203B35] font-medium"
              : "text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35]"
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              liked ? "fill-[#203B35] text-[#203B35] scale-110" : "text-[#92958F]"
            }`}
          />
          <span className="tabular-nums">{displayLikes}</span>
        </button>
      </div>
    </motion.article>
  );
}

export function CommunityShowcase() {
  const [activeDiscipline, setActiveDiscipline] = useState<CreativeDiscipline>("All");
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProjects = useMemo(() => {
    if (activeDiscipline === "All") return SHOWCASE_PROJECTS;
    return SHOWCASE_PROJECTS.filter((p) => p.discipline === activeDiscipline);
  }, [activeDiscipline]);

  // Split into 3 curated editorial columns for desktop masonry when showing All
  const columns = useMemo(() => {
    const col0: ShowcaseProject[] = [];
    const col1: ShowcaseProject[] = [];
    const col2: ShowcaseProject[] = [];

    filteredProjects.forEach((project, idx) => {
      if (activeDiscipline === "All") {
        if (project.columnIndex === 0) col0.push(project);
        else if (project.columnIndex === 1) col1.push(project);
        else col2.push(project);
      } else {
        const mod = idx % 3;
        if (mod === 0) col0.push(project);
        else if (mod === 1) col1.push(project);
        else col2.push(project);
      }
    });

    return [col0, col1, col2];
  }, [filteredProjects, activeDiscipline]);

  return (
    <section
      id="explore"
      aria-labelledby="showcase-heading"
      className="relative w-full bg-[#EFECE2]/65 border-t border-[#203B35]/10 py-24 sm:py-28 lg:py-36 scroll-mt-16"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* Asymmetric Editorial Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.75, ease: EASE_EDITORIAL }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2.5 mb-5">
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#5D635F]">01</span>
              <span className="h-[1px] w-7 bg-[#9DB5A5]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#203B35]/75">
                Community Showcase
              </span>
            </div>

            <h2
              id="showcase-heading"
              className="font-serif text-[2.65rem] sm:text-[3.5rem] lg:text-[4.1rem] font-normal leading-[1.03] tracking-[-0.02em] text-[#203B35]"
            >
              A little world of{" "}
              <span className="italic font-normal">creativity.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.75, delay: 0.1, ease: EASE_EDITORIAL }}
            className="lg:col-span-5 lg:pb-1.5 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-5"
          >
            <p className="max-w-md text-[15.5px] leading-[1.65] text-[#282B2A]/80 lg:text-right">
              Explore ideas, perspectives, and creations shared by the community.
            </p>

            <Link
              href="/discover"
              className="group inline-flex items-center gap-2 text-[13.5px] font-medium text-[#203B35] border-b border-[#203B35]/35 pb-1 hover:border-[#203B35] transition-colors"
            >
              <span>Explore Community</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#203B35] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Quiet Editorial Discipline Filter Strip */}
        <div
          className="mb-12 flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1"
          role="tablist"
          aria-label="Filter showcased projects by creative discipline"
        >
          {SHOWCASE_DISCIPLINES.map((discipline) => {
            const active = activeDiscipline === discipline;
            return (
              <button
                key={discipline}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveDiscipline(discipline)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  active
                    ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                    : "bg-[#F6F3EB]/80 text-[#282B2A]/75 border border-[#203B35]/12 hover:border-[#203B35]/30 hover:text-[#203B35]"
                }`}
              >
                {discipline}
              </button>
            );
          })}
        </div>

        {/* Asymmetric Editorial Masonry Gallery */}
        {activeDiscipline === "All" ? (
          <>
            {/* Desktop 3-Column Offset Masonry */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-x-8 xl:gap-x-10 items-start">
              {/* Column 1 */}
              <div className="space-y-12">
                {columns[0].map((project, idx) => (
                  <ShowcaseCard
                    key={project.id}
                    project={project}
                    index={idx}
                    liked={Boolean(likedIds[project.id])}
                    onToggleLike={toggleLike}
                  />
                ))}
              </div>

              {/* Column 2 — intentionally staggered downward for gallery rhythm */}
              <div className="space-y-12 mt-14">
                {columns[1].map((project, idx) => (
                  <ShowcaseCard
                    key={project.id}
                    project={project}
                    index={idx + 1}
                    liked={Boolean(likedIds[project.id])}
                    onToggleLike={toggleLike}
                  />
                ))}
              </div>

              {/* Column 3 — subtle intermediate offset + quiet editorial curator note */}
              <div className="space-y-12 mt-5">
                {columns[2].map((project, idx) => (
                  <ShowcaseCard
                    key={project.id}
                    project={project}
                    index={idx + 2}
                    liked={Boolean(likedIds[project.id])}
                    onToggleLike={toggleLike}
                  />
                ))}

                {/* Editorial Gallery Footnote Card to balance column 3 organically */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.75, ease: EASE_EDITORIAL }}
                  className="rounded-[6px] border border-[#203B35]/12 bg-[#FAF8F3] p-7 relative overflow-hidden"
                >
                  <div
                    className="pointer-events-none absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-[#C8BDE0]/25 blur-2xl"
                    aria-hidden="true"
                  />
                  <CelestialSpark className="h-4 w-4 text-[#9DB5A5] mb-4" />
                  <p className="font-serif text-[26px] leading-[1.2] text-[#203B35]">
                    Every medium has a seat at the table.
                  </p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-[#282B2A]/75">
                    From rough pencil studies and essays to 24-fps animation frames and stoneware
                    experiments — discover work curated by real makers.
                  </p>
                  <Link
                    href="/discover"
                    className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#203B35] hover:gap-2.5 transition-all"
                  >
                    <span>Browse all disciplines</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#9DB5A5]" />
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Tablet & Mobile Masonry Flow (< lg) */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10 items-start">
              {filteredProjects.map((project, idx) => (
                <div key={project.id} className={idx % 2 === 1 ? "sm:mt-10" : ""}>
                  <ShowcaseCard
                    project={project}
                    index={idx}
                    liked={Boolean(likedIds[project.id])}
                    onToggleLike={toggleLike}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Filtered Discipline Focused View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filteredProjects.map((project, idx) => (
              <ShowcaseCard
                key={project.id}
                project={project}
                index={idx}
                liked={Boolean(likedIds[project.id])}
                onToggleLike={toggleLike}
              />
            ))}
          </div>
        )}

        {/* Bottom Section CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: EASE_EDITORIAL }}
          className="mt-16 lg:mt-20 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[#203B35]/10 pt-10"
        >
          <p className="text-[14px] text-[#5D635F]">
            New creative editions, studio studies, and works-in-progress published daily.
          </p>
          <Link
            href="/discover"
            className="group inline-flex items-center gap-2.5 rounded-full bg-[#203B35] px-7 py-3.5 text-[14px] font-medium text-[#F6F3EB] transition-all duration-300 hover:bg-[#162A26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EFECE2]"
          >
            <span>Explore Community</span>
            <ArrowUpRight className="h-4 w-4 text-[#9DB5A5] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
