"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Feather,
  Layers,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { ExploreProjectCard } from "./ExploreProjectCard";
import { ExploreCreatorCard } from "./ExploreCreatorCard";
import { ExplorePostCard } from "./ExplorePostCard";
import { ExploreServiceCard } from "./ExploreServiceCard";
import type {
  ExploreCreatorItem,
  ExplorePostItem,
  ExploreProjectItem,
  ExploreServiceItem,
} from "./exploreTypes";

interface SectionBaseProps {
  hasFiltersApplied: boolean;
  onResetFilters: () => void;
}

/* ========================================================================= */
/* 01. CREATORS DISCOVERY SECTION                                            */
/* ========================================================================= */

interface CreatorsDiscoverySectionProps extends SectionBaseProps {
  creators: ExploreCreatorItem[];
}

export function CreatorsDiscoverySection({
  creators,
  hasFiltersApplied,
  onResetFilters,
}: CreatorsDiscoverySectionProps) {
  return (
    <section
      id="explore-creators"
      aria-labelledby="heading-creators"
      className="py-10 border-b border-[#203B35]/10 scroll-mt-20"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-mono text-[11px] tracking-[0.16em] text-[#5D635F]">01</span>
            <span className="h-[1px] w-6 bg-[#9DB5A5]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#203B35]/80">
              Community Creators
            </span>
          </div>
          <h2
            id="heading-creators"
            className="font-serif text-[2.1rem] sm:text-[2.6rem] font-normal leading-[1.08] tracking-[-0.02em] text-[#203B35]"
          >
            Independent <span className="italic font-normal">Creators</span> &amp; Studios
          </h2>
          <p className="mt-1.5 text-[14px] text-[#5D635F] max-w-xl">
            Explore profiles of independent artists, designers, illustrators, and multidisciplinary practitioners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#FAF8F3] border border-[#203B35]/15 px-3 py-1 font-mono text-[11.5px] text-[#203B35]">
            {creators.length} {creators.length === 1 ? "creator" : "creators"}
          </span>
        </div>
      </div>

      {/* Creators Grid or Clean Structural Empty State */}
      {creators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {creators.map((creator) => (
            <ExploreCreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EFECE2] text-[#203B35]">
            <Users className="h-5 w-5 text-[#9DB5A5]" />
          </div>
          <h3 className="font-serif text-2xl text-[#203B35]">
            {hasFiltersApplied
              ? "No creators match your current filter"
              : "No creators currently featured"}
          </h3>
          <p className="mt-2 text-[14px] text-[#5D635F] max-w-md mx-auto leading-relaxed">
            {hasFiltersApplied
              ? "Try broadening your search term or exploring all creative disciplines."
              : "Makers who publish portfolios and public profiles will appear in this directory."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {hasFiltersApplied ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2.5 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2.5 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                <span>Visit Community Feed</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#9DB5A5]" />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================================================================= */
/* 02. PROJECTS DISCOVERY SECTION                                            */
/* ========================================================================= */

interface ProjectsDiscoverySectionProps extends SectionBaseProps {
  projects: ExploreProjectItem[];
}

export function ProjectsDiscoverySection({
  projects,
  hasFiltersApplied,
  onResetFilters,
}: ProjectsDiscoverySectionProps) {
  return (
    <section
      id="explore-projects"
      aria-labelledby="heading-projects"
      className="py-10 border-b border-[#203B35]/10 scroll-mt-20"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-mono text-[11px] tracking-[0.16em] text-[#5D635F]">02</span>
            <span className="h-[1px] w-6 bg-[#9DB5A5]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#203B35]/80">
              Projects &amp; Artwork
            </span>
          </div>
          <h2
            id="heading-projects"
            className="font-serif text-[2.1rem] sm:text-[2.6rem] font-normal leading-[1.08] tracking-[-0.02em] text-[#203B35]"
          >
            Curated <span className="italic font-normal">Projects</span> &amp; Artwork
          </h2>
          <p className="mt-1.5 text-[14px] text-[#5D635F] max-w-xl">
            Discover exhibited portfolios, conceptual explorations, and layered drafts from makers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#FAF8F3] border border-[#203B35]/15 px-3 py-1 font-mono text-[11.5px] text-[#203B35]">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>
      </div>

      {/* Projects Grid or Clean Structural Empty State */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {projects.map((project) => (
            <ExploreProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EFECE2] text-[#203B35]">
            <Layers className="h-5 w-5 text-[#9DB5A5]" />
          </div>
          <h3 className="font-serif text-2xl text-[#203B35]">
            {hasFiltersApplied
              ? "No projects match your current filters"
              : "No projects in this view yet"}
          </h3>
          <p className="mt-2 text-[14px] text-[#5D635F] max-w-md mx-auto leading-relaxed">
            {hasFiltersApplied
              ? "Try adjusting your search query or discipline filter to uncover relevant works."
              : "When projects and artworks are published to the catalog, they will appear dynamically in this discovery grid."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {hasFiltersApplied ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2.5 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2.5 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                <span>Create a Project</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#9DB5A5]" />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================================================================= */
/* 03. POSTS DISCOVERY SECTION                                               */
/* ========================================================================= */

interface PostsDiscoverySectionProps extends SectionBaseProps {
  posts: ExplorePostItem[];
}

export function PostsDiscoverySection({
  posts,
  hasFiltersApplied,
  onResetFilters,
}: PostsDiscoverySectionProps) {
  return (
    <section
      id="explore-posts"
      aria-labelledby="heading-posts"
      className="py-10 border-b border-[#203B35]/10 scroll-mt-20"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-mono text-[11px] tracking-[0.16em] text-[#5D635F]">03</span>
            <span className="h-[1px] w-6 bg-[#9DB5A5]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#203B35]/80">
              Community Posts &amp; Process
            </span>
          </div>
          <h2
            id="heading-posts"
            className="font-serif text-[2.1rem] sm:text-[2.6rem] font-normal leading-[1.08] tracking-[-0.02em] text-[#203B35]"
          >
            Studio <span className="italic font-normal">Notes</span> &amp; Updates
          </h2>
          <p className="mt-1.5 text-[14px] text-[#5D635F] max-w-xl">
            Explore process logs, milestone reflections, and critique requests shared by creators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#FAF8F3] border border-[#203B35]/15 px-3 py-1 font-mono text-[11.5px] text-[#203B35]">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>
      </div>

      {/* Posts Grid or Clean Structural Empty State */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {posts.map((post) => (
            <ExplorePostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EFECE2] text-[#203B35]">
            <Feather className="h-5 w-5 text-[#9DB5A5]" />
          </div>
          <h3 className="font-serif text-2xl text-[#203B35]">
            {hasFiltersApplied
              ? "No studio posts match your current filters"
              : "No community posts in this view yet"}
          </h3>
          <p className="mt-2 text-[14px] text-[#5D635F] max-w-md mx-auto leading-relaxed">
            {hasFiltersApplied
              ? "Try adjusting your search query or discipline filter to uncover studio updates."
              : "When creators publish process logs, critique notes, or milestones, they will appear dynamically in this feed."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {hasFiltersApplied ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2.5 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2.5 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                <span>Visit Community Feed</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#9DB5A5]" />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================================================================= */
/* 04. SERVICES DISCOVERY SECTION                                            */
/* ========================================================================= */

interface ServicesDiscoverySectionProps extends SectionBaseProps {
  services: ExploreServiceItem[];
}

export function ServicesDiscoverySection({
  services,
  hasFiltersApplied,
  onResetFilters,
}: ServicesDiscoverySectionProps) {
  return (
    <section
      id="explore-services"
      aria-labelledby="heading-services"
      className="py-10 scroll-mt-20"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-mono text-[11px] tracking-[0.16em] text-[#5D635F]">04</span>
            <span className="h-[1px] w-6 bg-[#9DB5A5]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#203B35]/80">
              Atelier &amp; Client Services
            </span>
          </div>
          <h2
            id="heading-services"
            className="font-serif text-[2.1rem] sm:text-[2.6rem] font-normal leading-[1.08] tracking-[-0.02em] text-[#203B35]"
          >
            Creative <span className="italic font-normal">Services</span> &amp; Commissions
          </h2>
          <p className="mt-1.5 text-[14px] text-[#5D635F] max-w-xl">
            Book bespoke illustration, branding sprints, photo sessions, and consulting directly from creators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#FAF8F3] border border-[#203B35]/15 px-3 py-1 font-mono text-[11.5px] text-[#203B35]">
            {services.length} {services.length === 1 ? "service" : "services"}
          </span>
        </div>
      </div>

      {/* Services Grid or Clean Structural Empty State */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {services.map((service) => (
            <ExploreServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EFECE2] text-[#203B35]">
            <Briefcase className="h-5 w-5 text-[#9DB5A5]" />
          </div>
          <h3 className="font-serif text-2xl text-[#203B35]">
            {hasFiltersApplied
              ? "No services match your current filters"
              : "No services currently offered"}
          </h3>
          <p className="mt-2 text-[14px] text-[#5D635F] max-w-md mx-auto leading-relaxed">
            {hasFiltersApplied
              ? "Try searching for different terms or selecting another category."
              : "When creators publish commission rates and studio offerings, they will appear here for booking."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {hasFiltersApplied ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2.5 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2.5 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                <span>Offer a Service</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#9DB5A5]" />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
