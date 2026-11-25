"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
}

const DEFAULT_CATEGORIES = [
  "All",
  "Illustration",
  "Photography",
  "Graphic Design",
  "UI/UX Design",
  "Digital Art",
  "Animation",
  "Writing",
  "Music",
  "Motion Design",
  "3D & Spatial",
];

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
  className = "",
}: CategoryFilterBarProps) {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch dynamic categories from the database if available
  useEffect(() => {
    let isMounted = true;
    async function loadDbCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const fetchedNames: string[] = json.data.map((c: any) => c.name);
          if (isMounted) {
            const combined = Array.from(new Set(["All", ...fetchedNames, ...DEFAULT_CATEGORIES]));
            setCategories(combined);
          }
        }
      } catch {
        // Graceful fallback to default categories
      }
    }
    loadDbCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="hidden sm:flex absolute -left-3.5 z-10 h-7 w-7 items-center justify-center rounded-full bg-[#FAF8F3] border border-[#203B35]/15 text-[#203B35] shadow-md hover:bg-white transition-all"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Horizontally Scrollable Categories */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 ${
                isSelected
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-[0_2px_6px_rgba(32,59,53,0.15)] font-semibold"
                  : "bg-[#FAF8F3] text-[#282B2A]/85 border border-[#203B35]/12 hover:border-[#203B35]/30 hover:bg-[#EFECE2]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="hidden sm:flex absolute -right-3.5 z-10 h-7 w-7 items-center justify-center rounded-full bg-[#FAF8F3] border border-[#203B35]/15 text-[#203B35] shadow-md hover:bg-white transition-all"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
