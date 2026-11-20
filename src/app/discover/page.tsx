"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  Sparkles,
  Heart,
  MessageSquare,
  FileBox,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

const CATEGORIES = [
  "All",
  "Illustration",
  "Photography",
  "Music",
  "Writing",
  "Animation",
  "Video",
  "UI/UX",
];

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"popular" | "newest">("popular");
  const [searchQuery, setSearchQuery] = useState("");

  const [projects, setProjects] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recType, setRecType] = useState<string>("cold-start");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscoveryData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // If there is an active search query, query /api/search
      let discoverUrl = `/api/discover?sort=${sortBy}`;
      if (selectedCategory !== "All") {
        discoverUrl += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      if (searchQuery.trim()) {
        discoverUrl = `/api/search?q=${encodeURIComponent(searchQuery.trim())}`;
        if (selectedCategory !== "All") {
          discoverUrl += `&category=${encodeURIComponent(selectedCategory)}`;
        }
      }

      const [discRes, recRes] = await Promise.all([
        fetch(discoverUrl),
        fetch("/api/recommendations"),
      ]);

      const discData = await discRes.json();
      const recData = await recRes.json();

      if (discData.success) {
        setProjects(discData.data.projects || []);
      } else {
        setError(discData.error?.message || "Failed to load discovery feed");
      }

      if (recData.success) {
        setRecommendations(recData.data.recommendations || []);
        setRecType(recData.data.type || "cold-start");
      }
    } catch (e) {
      setError("Network error loading discovery feed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryData();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDiscoveryData();
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Discovery Hero */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-medium text-violet-300">
          <Compass className="w-3.5 h-3.5 text-violet-400" />
          <span>Public Creative Ecosystem</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Discover Exceptional Creators & Work
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Explore completed and in-progress public work across 8 creative disciplines with verifiable project histories.
        </p>
      </div>

      {/* Search & Faceted Filter Bar */}
      <div className="space-y-4 mb-10">
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by keywords, tags (#branding), creator, or discipline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
            />
          </div>
          <Button type="submit" size="md">
            Search
          </Button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedCategory === cat
                  ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/20"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort & Stats Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 pt-4 text-xs">
          <span className="text-slate-400">
            Showing <strong className="text-white">{projects.length}</strong> public projects
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <button
              onClick={() => setSortBy("popular")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
                sortBy === "popular"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              Popular
            </button>
            <button
              onClick={() => setSortBy("newest")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
                sortBy === "newest"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Newest
            </button>
          </div>
        </div>
      </div>

      {/* Recommended For You Section (if available) */}
      {!searchQuery && recommendations.length > 0 && (
        <div className="mb-14 p-6 rounded-2xl border border-violet-900/30 bg-violet-950/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-bold text-white">
                {recType === "personalized" ? "Recommended For You" : "Trending Creative Highlights"}
              </h2>
            </div>
            <span className="text-[11px] text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-800/60">
              {recType === "personalized" ? "Content Similarity Match" : "Platform Popularity"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((proj) => (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-violet-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                      {proj.category}
                    </span>
                    <Badge variant="status" status={proj.status} />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                    {proj.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {proj.description || "Creative deliverable on CreativeSpace."}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>By @{proj.creator?.username}</span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <Heart className="w-3 h-3 fill-rose-500" />
                    {proj._count?.likes || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Public Project Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDiscoveryData} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-12 h-12 text-slate-600" />}
          title="No public projects found"
          description="Try broadening your search keyword or switching category filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-6 hover:border-violet-500/50 hover:bg-slate-900/80 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                    {project.category}
                  </span>
                  <Badge variant="status" status={project.status} />
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1 mb-2">
                  {project.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {project.description || "Public project deliverable."}
                </p>

                {/* Metadata badges */}
                {project.metadata && Object.keys(project.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {Object.entries(project.metadata)
                      .slice(0, 3)
                      .map(([key, val]) => (
                        <span
                          key={key}
                          className="text-[10px] rounded bg-slate-950 px-2 py-0.5 text-slate-400 border border-slate-800"
                        >
                          {key}: <strong className="text-slate-300">{String(val)}</strong>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {project.creator?.displayName?.charAt(0) || "U"}
                  </div>
                  <span className="truncate max-w-[120px]">
                    @{project.creator?.username}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    {project._count?.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    {project._count?.comments || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
