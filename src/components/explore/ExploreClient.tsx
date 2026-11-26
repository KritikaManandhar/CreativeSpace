"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";
import { AuthenticatedNavbar } from "@/components/navigation/AuthenticatedNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ExploreHeader } from "./ExploreHeader";
import { ExploreFilters } from "./ExploreFilters";
import {
  CreatorsDiscoverySection,
  PostsDiscoverySection,
  ProjectsDiscoverySection,
  ServicesDiscoverySection,
} from "./ExploreSections";
import type {
  ExploreContentType,
  ExploreCreatorItem,
  ExploreDiscipline,
  ExplorePostItem,
  ExploreProjectItem,
  ExploreServiceItem,
} from "./exploreTypes";

export interface ExploreClientProps {
  initialProjects?: ExploreProjectItem[];
  initialCreators?: ExploreCreatorItem[];
  initialPosts?: ExplorePostItem[];
  initialServices?: ExploreServiceItem[];
  initialSearchQuery?: string;
}

export function ExploreClient({
  initialProjects = [],
  initialCreators = [],
  initialPosts = [],
  initialServices = [],
  initialSearchQuery = "",
}: ExploreClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeTab, setActiveTab] = useState<ExploreContentType>("all");
  const [activeDiscipline, setActiveDiscipline] = useState<ExploreDiscipline>("All");

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // In-memory filtration for connected creators
  const filteredCreators = useMemo(() => {
    return initialCreators.filter((creator) => {
      // Discipline filter
      if (activeDiscipline !== "All") {
        const matchesDisc = creator.disciplines.some(
          (d) => d.toLowerCase() === activeDiscipline.toLowerCase()
        );
        if (!matchesDisc) return false;
      }
      // Query filter
      if (normalizedQuery) {
        const matchesName = creator.displayName
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesUsername = creator.username
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesBio =
          creator.bio?.toLowerCase().includes(normalizedQuery) ?? false;
        const matchesDiscipline = creator.disciplines.some((d) =>
          d.toLowerCase().includes(normalizedQuery)
        );

        return matchesName || matchesUsername || matchesBio || matchesDiscipline;
      }
      return true;
    });
  }, [initialCreators, activeDiscipline, normalizedQuery]);

  // In-memory filtration for connected projects
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      // Discipline filter
      if (
        activeDiscipline !== "All" &&
        project.discipline.toLowerCase() !== activeDiscipline.toLowerCase()
      ) {
        return false;
      }
      // Query filter
      if (normalizedQuery) {
        const matchesTitle = project.title.toLowerCase().includes(normalizedQuery);
        const matchesDesc =
          project.description?.toLowerCase().includes(normalizedQuery) ?? false;
        const matchesCreator =
          project.creator.displayName.toLowerCase().includes(normalizedQuery) ||
          project.creator.username.toLowerCase().includes(normalizedQuery);
        const matchesTags =
          project.tags?.some((t) => t.toLowerCase().includes(normalizedQuery)) ?? false;
        const matchesDiscipline = project.discipline
          .toLowerCase()
          .includes(normalizedQuery);

        return (
          matchesTitle ||
          matchesDesc ||
          matchesCreator ||
          matchesTags ||
          matchesDiscipline
        );
      }
      return true;
    });
  }, [initialProjects, activeDiscipline, normalizedQuery]);

  // In-memory filtration for connected posts
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      // Discipline filter
      if (
        activeDiscipline !== "All" &&
        post.discipline &&
        post.discipline.toLowerCase() !== activeDiscipline.toLowerCase()
      ) {
        return false;
      }
      // Query filter
      if (normalizedQuery) {
        const matchesTitle =
          post.title?.toLowerCase().includes(normalizedQuery) ?? false;
        const matchesContent = post.content
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesAuthor =
          post.authorDisplayName.toLowerCase().includes(normalizedQuery) ||
          post.authorUsername.toLowerCase().includes(normalizedQuery);
        const matchesKind = post.kind.toLowerCase().includes(normalizedQuery);
        const matchesTags =
          post.tags?.some((t) => t.toLowerCase().includes(normalizedQuery)) ?? false;
        const matchesDiscipline = post.discipline
          ? post.discipline.toLowerCase().includes(normalizedQuery)
          : false;

        return (
          matchesTitle ||
          matchesContent ||
          matchesAuthor ||
          matchesKind ||
          matchesTags ||
          matchesDiscipline
        );
      }
      return true;
    });
  }, [initialPosts, activeDiscipline, normalizedQuery]);

  // In-memory filtration for connected services
  const filteredServices = useMemo(() => {
    return initialServices.filter((service) => {
      // Discipline filter
      if (
        activeDiscipline !== "All" &&
        service.category.toLowerCase() !== activeDiscipline.toLowerCase()
      ) {
        return false;
      }
      // Query filter
      if (normalizedQuery) {
        const matchesTitle = service.title.toLowerCase().includes(normalizedQuery);
        const matchesDesc = service.shortDescription
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesCreator =
          service.creatorDisplayName.toLowerCase().includes(normalizedQuery) ||
          service.creatorUsername.toLowerCase().includes(normalizedQuery);
        const matchesCategory = service.category
          .toLowerCase()
          .includes(normalizedQuery);

        return matchesTitle || matchesDesc || matchesCreator || matchesCategory;
      }
      return true;
    });
  }, [initialServices, activeDiscipline, normalizedQuery]);

  const hasFiltersApplied =
    Boolean(normalizedQuery) ||
    activeDiscipline !== "All" ||
    activeTab !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveDiscipline("All");
    setActiveTab("all");
  };

  const counts = {
    creators: filteredCreators.length,
    projects: filteredProjects.length,
    posts: filteredPosts.length,
    services: filteredServices.length,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] overflow-x-clip flex flex-col">
        {/* Consistent Authenticated Navigation with Compact Global Search */}
        <AuthenticatedNavbar
          activeNav="explore"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={setSearchQuery}
        />

        {/* Welcoming Editorial Discovery Header (Without oversized search hero) */}
        <ExploreHeader
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12 pb-20 sm:pb-28">
          {/* Category & Discipline Filter Bar */}
          <ExploreFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeDiscipline={activeDiscipline}
            onDisciplineChange={setActiveDiscipline}
            hasActiveFilters={hasFiltersApplied}
            onResetFilters={handleResetFilters}
            counts={counts}
          />

          {/* Section 01: Creators */}
          {(activeTab === "all" || activeTab === "creators") && (
            <CreatorsDiscoverySection
              creators={filteredCreators}
              hasFiltersApplied={hasFiltersApplied}
              onResetFilters={handleResetFilters}
            />
          )}

          {/* Section 02: Projects & Artwork */}
          {(activeTab === "all" || activeTab === "projects") && (
            <ProjectsDiscoverySection
              projects={filteredProjects}
              hasFiltersApplied={hasFiltersApplied}
              onResetFilters={handleResetFilters}
            />
          )}

          {/* Section 03: Community Posts */}
          {(activeTab === "all" || activeTab === "posts") && (
            <PostsDiscoverySection
              posts={filteredPosts}
              hasFiltersApplied={hasFiltersApplied}
              onResetFilters={handleResetFilters}
            />
          )}

          {/* Section 04: Atelier Services */}
          {(activeTab === "all" || activeTab === "services") && (
            <ServicesDiscoverySection
              services={filteredServices}
              hasFiltersApplied={hasFiltersApplied}
              onResetFilters={handleResetFilters}
            />
          )}
        </main>

        {/* Footer */}
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
