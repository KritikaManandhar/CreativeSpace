"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { ExploreTopNav } from "./ExploreTopNav";
import { ExploreHeader } from "./ExploreHeader";
import { ExploreCategories } from "./ExploreCategories";
import { ExploreTrendingGallery, FilterOption } from "./ExploreTrendingGallery";
import { ExploreCreators } from "./ExploreCreators";
import { ExploreInspiration } from "./ExploreInspiration";
import { ExploreProjectModal } from "./ExploreProjectModal";
import {
  EXPLORE_PROJECTS,
  EXPLORE_CREATORS,
  EXPLORE_COLLECTIONS,
  ExploreProject,
  ExploreCreator,
  ExploreCollection,
} from "./exploreData";
import { LandingFooter } from "@/components/landing/LandingFooter";

function ExploreContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isAuthenticated = status === "authenticated";

  // Filter & Search states initialized from URL params if present
  const initialQ = searchParams?.get("q") || "";
  const initialCategory = searchParams?.get("category") || null;

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");

  // Dynamic projects & creators state (allows likes, bookmarks, follows)
  const [projects, setProjects] = useState<ExploreProject[]>(EXPLORE_PROJECTS);
  const [creators, setCreators] = useState<ExploreCreator[]>(EXPLORE_CREATORS);

  // Selected project for Quick View Modal
  const [selectedProject, setSelectedProject] = useState<ExploreProject | null>(null);

  // Saved bookmarks set (synced with localStorage)
  const [savedProjectIds, setSavedProjectIds] = useState<Set<string>>(new Set());

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize saved bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("creativespace_saved_projects");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const set = new Set<string>(parsed);
          setSavedProjectIds(set);
          setProjects((prev) =>
            prev.map((p) => ({
              ...p,
              hasBookmarked: set.has(p.id),
            }))
          );
        }
      }
    } catch {
      // LocalStorage fail-safe
    }
  }, []);

  // Fetch live backend data if available and blend with editorial content
  useEffect(() => {
    async function loadBackendData() {
      try {
        const res = await fetch("/api/discover?limit=12", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.projects) && json.data.projects.length > 0) {
          // Format real DB projects to fit ExploreProject interface
          const dbProjects: ExploreProject[] = json.data.projects.map((p: any, idx: number) => {
            const firstAsset = p.assets?.[0];
            const coverImage =
              firstAsset?.thumbnailPath ||
              p.coverImage ||
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80";

            const cat = p.category || "Design";
            let filterCat: ExploreProject["filterCategory"] = "Other";
            if (cat.toLowerCase().includes("photo")) filterCat = "Photography";
            else if (cat.toLowerCase().includes("design") || cat.toLowerCase().includes("ui")) filterCat = "Design";
            else if (cat.toLowerCase().includes("illustr")) filterCat = "Illustration";
            else if (cat.toLowerCase().includes("digital") || cat.toLowerCase().includes("3d")) filterCat = "Digital Art";

            return {
              id: p.id,
              title: p.title,
              category: cat,
              filterCategory: filterCat,
              creator: {
                id: p.creator?.id || "db-creator",
                username: p.creator?.username || "creator",
                displayName: p.creator?.displayName || "CreativeSpace Maker",
                avatarUrl: p.creator?.avatarUrl || undefined,
                avatarInitials: p.creator?.displayName?.slice(0, 2).toUpperCase() || "CS",
                avatarTone: "#203B35",
                avatarAccent: "#9DB5A5",
                specialty: p.creator?.disciplines?.[0] || "Creative Practitioner",
                isFollowing: false,
              },
              coverImage,
              aspectClass: idx % 3 === 0 ? "aspect-[16/10]" : idx % 2 === 0 ? "aspect-[3/4]" : "aspect-[4/5]",
              colSpanClass: idx % 4 === 0 ? "col-span-1 md:col-span-2 xl:col-span-2" : "col-span-1",
              likes: p._count?.likes ?? 0,
              hasLiked: false,
              hasBookmarked: false,
              tags: p.tags?.length ? p.tags : ["creativespace", cat.toLowerCase()],
              editionNote: "Live Studio Work",
              description: p.description || "A public creative project published on CreativeSpace.",
              publishedAt: "Recently published",
              isPopular: (p._count?.likes ?? 0) > 2,
              isRecent: true,
            };
          });

          // Prepend real DB projects to the curated editorial dataset
          setProjects((prev) => {
            const existingIds = new Set(dbProjects.map((dp) => dp.id));
            const filteredCurated = prev.filter((cp) => !existingIds.has(cp.id));
            return [...dbProjects, ...filteredCurated];
          });
        }
      } catch {
        // Graceful non-blocking fallback to editorial dataset
      }
    }
    loadBackendData();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  // Filter projects by category, search query, and active filter tab
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = project.title.toLowerCase().includes(q);
        const matchesCategory = project.category.toLowerCase().includes(q);
        const matchesCreator =
          project.creator.displayName.toLowerCase().includes(q) ||
          project.creator.username.toLowerCase().includes(q);
        const matchesTags = project.tags.some((tag) => tag.toLowerCase().includes(q));

        if (!matchesTitle && !matchesCategory && !matchesCreator && !matchesTags) {
          return false;
        }
      }

      // 2. Category Tile Filter
      if (selectedCategory) {
        const cat = selectedCategory.toLowerCase();
        const projectCat = project.category.toLowerCase();
        if (
          !projectCat.includes(cat) &&
          !cat.includes(projectCat) &&
          project.filterCategory.toLowerCase() !== cat
        ) {
          return false;
        }
      }

      // 3. Tab Filter
      if (activeFilter === "Popular") {
        return project.isPopular || project.likes >= 400;
      }
      if (activeFilter === "Recent") {
        return project.isRecent;
      }
      if (activeFilter === "Photography") {
        return project.filterCategory === "Photography" || project.category === "Photography";
      }
      if (activeFilter === "Design") {
        return (
          project.filterCategory === "Design" ||
          project.category === "Graphic Design" ||
          project.category === "UI/UX Design"
        );
      }
      if (activeFilter === "Illustration") {
        return project.filterCategory === "Illustration" || project.category === "Illustration";
      }
      if (activeFilter === "Digital Art") {
        return (
          project.filterCategory === "Digital Art" ||
          project.category === "Digital Art" ||
          project.category === "3D Art" ||
          project.category === "Animation"
        );
      }

      return true;
    });
  }, [projects, searchQuery, selectedCategory, activeFilter]);

  // Handle Like Toggle
  const handleToggleLike = useCallback(
    async (projectId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === projectId) {
            const nextLiked = !p.hasLiked;
            return {
              ...p,
              hasLiked: nextLiked,
              likes: p.likes + (nextLiked ? 1 : -1),
            };
          }
          return p;
        })
      );

      // If viewing modal for this project, update it too
      setSelectedProject((prev) => {
        if (prev && prev.id === projectId) {
          const nextLiked = !prev.hasLiked;
          return {
            ...prev,
            hasLiked: nextLiked,
            likes: prev.likes + (nextLiked ? 1 : -1),
          };
        }
        return prev;
      });

      // Show toast
      showToast("Appreciation updated");

      // Send to backend if authenticated and is a real DB project id
      if (isAuthenticated && !projectId.startsWith("proj-")) {
        try {
          await fetch(`/api/projects/${projectId}/like`, { method: "POST" });
        } catch {
          // Graceful handling
        }
      }
    },
    [isAuthenticated, showToast]
  );

  // Handle Bookmark Toggle
  const handleToggleBookmark = useCallback(
    (projectId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      setSavedProjectIds((prev) => {
        const next = new Set(prev);
        const isBookmarked = next.has(projectId);
        if (isBookmarked) {
          next.delete(projectId);
          showToast("Removed from your saved collection");
        } else {
          next.add(projectId);
          showToast("Saved to your collection");
        }

        try {
          localStorage.setItem(
            "creativespace_saved_projects",
            JSON.stringify(Array.from(next))
          );
        } catch {
          // Storage fail-safe
        }

        return next;
      });

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === projectId) {
            return { ...p, hasBookmarked: !p.hasBookmarked };
          }
          return p;
        })
      );

      setSelectedProject((prev) => {
        if (prev && prev.id === projectId) {
          return { ...prev, hasBookmarked: !prev.hasBookmarked };
        }
        return prev;
      });
    },
    [showToast]
  );

  // Handle Follow Toggle for Creators
  const handleToggleFollow = useCallback(
    async (creatorId: string) => {
      let isNowFollowing = false;
      let creatorName = "";

      setCreators((prev) =>
        prev.map((c) => {
          if (c.id === creatorId) {
            isNowFollowing = !c.isFollowing;
            creatorName = c.displayName;
            return {
              ...c,
              isFollowing: isNowFollowing,
              followerCount: c.followerCount + (isNowFollowing ? 1 : -1),
            };
          }
          return c;
        })
      );

      showToast(
        isNowFollowing
          ? `Now following ${creatorName || "creator"}`
          : `Unfollowed ${creatorName || "creator"}`
      );

      // If backend is active and creator is a valid DB id
      if (isAuthenticated && !creatorId.startsWith("creator-")) {
        try {
          const method = isNowFollowing ? "POST" : "DELETE";
          await fetch(`/api/users/${creatorId}/follow`, { method });
        } catch {
          // Graceful
        }
      }
    },
    [isAuthenticated, showToast]
  );

  // Handle selecting a collection
  const handleSelectCollection = (col: ExploreCollection) => {
    setSelectedCategory(null);
    setSearchQuery(col.tags[1] || col.title.split(":")[0]);
    showToast(`Viewing collection: ${col.title}`);

    // Smooth scroll to gallery
    const galleryEl = document.getElementById("trending-gallery");
    if (galleryEl) {
      galleryEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setActiveFilter("All");
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#FAF8F3] flex flex-col font-sans">
      {/* 1. Cohesive Editorial Top Navigation */}
      <ExploreTopNav />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-[#203B35] text-[#FAF8F3] px-5 py-2.5 text-xs font-semibold shadow-2xl animate-fade-up flex items-center gap-2 border border-[#9DB5A5]/30">
          <Sparkles className="h-3.5 w-3.5 text-[#9DB5A5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Explore Content Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Section A: Explore Header with Search */}
        <ExploreHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectSuggestion={(s) => {
            setSearchQuery(s);
            setSelectedCategory(null);
          }}
          onClearSearch={() => setSearchQuery("")}
        />

        {/* Section B: Creative Categories */}
        <ExploreCategories
          selectedCategory={selectedCategory}
          onSelectCategory={(catName) => {
            if (selectedCategory === catName) {
              setSelectedCategory(null);
            } else {
              setSelectedCategory(catName);
              // Smooth scroll down to gallery
              const galleryEl = document.getElementById("trending-gallery");
              if (galleryEl) {
                galleryEl.scrollIntoView({ behavior: "smooth" });
              }
            }
          }}
          onClearCategory={() => setSelectedCategory(null)}
        />

        {/* Section C: Trending Projects Gallery */}
        <ExploreTrendingGallery
          projects={filteredProjects}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onSelectProject={setSelectedProject}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onResetFilters={handleResetFilters}
        />

        {/* Section D: Creators to Discover */}
        <ExploreCreators
          creators={creators}
          onToggleFollow={handleToggleFollow}
        />

        {/* Section E: Recommended Inspiration Collections */}
        <ExploreInspiration
          collections={EXPLORE_COLLECTIONS}
          onSelectCollection={handleSelectCollection}
        />
      </main>

      {/* Quick-View Project Modal */}
      <ExploreProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onToggleLike={handleToggleLike}
        onToggleBookmark={handleToggleBookmark}
        onFollowCreator={handleToggleFollow}
        isFollowingCreator={
          selectedProject
            ? creators.find((c) => c.id === selectedProject.creator.id)?.isFollowing
            : false
        }
      />

      {/* Editorial Landing / Explore Footer */}
      <LandingFooter />
    </div>
  );
}

export function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F3EB] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-[#203B35] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
