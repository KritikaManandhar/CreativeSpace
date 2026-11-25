"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Compass,
  Sparkles,
  FolderKanban,
  Users,
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Settings,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Menu,
  X,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";
import {
  CreativeSpaceWordmark,
  CelestialSpark,
  CreatorAvatar,
} from "@/components/landing/CreativeSpaceBrand";

interface ProjectDetailNavProps {
  projectTitle: string;
  category: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  isFollowingCreator?: boolean;
  onToggleFollowCreator?: () => void;
  isFollowBusy?: boolean;
  onShareClick?: () => void;
  showFollowInNav?: boolean;
}

interface SearchItem {
  id: string;
  title: string;
  category: string;
  creator: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

export function ProjectDetailNav({
  projectTitle,
  category,
  creator,
  isFollowingCreator = false,
  onToggleFollowCreator,
  isFollowBusy = false,
  onShareClick,
  showFollowInNav = false,
}: ProjectDetailNavProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isOwnProject = user?.id === creator.id;

  // Dropdown & Menu States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search API query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.projects)) {
          setSearchResults(data.data.projects.slice(0, 5));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6F3EB]/92 backdrop-blur-md border-b border-[#203B35]/10 shadow-[0_1px_6px_rgba(32,59,53,0.03)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Back Navigation */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link
            href="/feed"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#203B35]/70 hover:text-[#203B35] transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[#203B35]/5 shrink-0"
            title="Return to Feed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Feed</span>
          </Link>

          <span className="text-[#203B35]/20 hidden sm:inline">/</span>

          <Link
            href="/"
            className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 rounded-lg py-1 shrink-0"
            aria-label="CreativeSpace Home"
          >
            <span className="transition-transform duration-300 group-hover:scale-[1.015]">
              <CreativeSpaceWordmark variant="dark" />
            </span>
          </Link>

          {/* Breadcrumb Category */}
          {category && (
            <div className="hidden lg:flex items-center gap-2 pl-2">
              <span className="text-[#203B35]/25">·</span>
              <Link
                href={`/explore?category=${encodeURIComponent(category)}`}
                className="inline-flex items-center gap-1 text-xs font-mono text-[#5D635F] hover:text-[#203B35] bg-[#EFECE2]/70 px-2 py-0.5 rounded transition-colors truncate max-w-[140px]"
              >
                <CelestialSpark className="w-2.5 h-2.5 text-[#203B35]" />
                <span className="truncate">{category}</span>
              </Link>
            </div>
          )}

          {/* Scrolled-in follow bar */}
          {showFollowInNav && !isOwnProject && (
            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-[#203B35]/12 animate-fade-in">
              <Link
                href={`/profile/${creator.username}`}
                className="flex items-center gap-2 group/author"
              >
                {creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-[#203B35]/15"
                  />
                ) : (
                  <CreatorAvatar
                    name={creator.displayName}
                    initials={creator.displayName.slice(0, 2).toUpperCase()}
                    tone="#203B35"
                    accent="#C8BDE0"
                    size="xs"
                  />
                )}
                <span className="text-xs font-medium text-[#203B35] group-hover/author:underline truncate max-w-[120px]">
                  {creator.displayName}
                </span>
              </Link>

              {onToggleFollowCreator && (
                <button
                  type="button"
                  disabled={isFollowBusy}
                  onClick={onToggleFollowCreator}
                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-all ${
                    isFollowingCreator
                      ? "bg-[#EFECE2] text-[#203B35] border border-[#203B35]/20 hover:bg-rose-50 hover:text-rose-700"
                      : "bg-[#203B35] text-[#FAF8F3] hover:bg-[#162A26] shadow-sm"
                  }`}
                >
                  {isFollowingCreator ? "Following" : "Follow"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div ref={searchRef} className="relative hidden md:block w-72 lg:w-84">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-[#92958F] pointer-events-none" />
            <input
              type="text"
              placeholder="Search works, creators, tags..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full rounded-full border border-[#203B35]/15 bg-[#FAF8F3] pl-8 pr-4 py-1.5 text-xs text-[#282B2A] placeholder:text-[#92958F] focus:border-[#203B35]/40 focus:outline-none focus:ring-1 focus:ring-[#203B35]/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-[#92958F] hover:text-[#282B2A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/15 py-2 shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#92958F] border-b border-[#203B35]/10">
                {isSearching ? "Searching..." : `Results for "${searchQuery}"`}
              </div>

              {searchResults.length > 0 ? (
                <div className="max-h-64 overflow-y-auto divide-y divide-[#203B35]/5">
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={`/projects/${item.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-[#EFECE2]/70 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#203B35] truncate">{item.title}</p>
                        <p className="text-[11px] text-[#5D635F] truncate">
                          @{item.creator?.username} · {item.category}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#92958F] shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-4 text-center text-xs text-[#5D635F]">
                  No matching projects found.
                </div>
              ) : null}

              <div className="pt-1.5 px-3 border-t border-[#203B35]/10 flex justify-between items-center text-[11px]">
                <Link
                  href={`/explore?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="font-medium text-[#203B35] hover:underline"
                >
                  View all results in Explore →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: Primary Links & User Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Detail page navigation">
            <Link
              href="/feed"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#203B35]" />
              <span>Feed</span>
            </Link>

            <Link
              href="/explore"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-[#203B35]" />
              <span>Explore</span>
            </Link>

            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-all"
              >
                <FolderKanban className="w-3.5 h-3.5 text-[#203B35]" />
                <span>Workspace</span>
              </Link>
            )}
          </nav>

          {/* Quick Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#203B35]/12 bg-[#FAF8F3] hover:bg-white text-xs font-medium text-[#282B2A] transition-all shadow-sm"
            title="Copy project link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#5D635F]" />
                <span>Link</span>
              </>
            )}
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={onShareClick || handleCopyLink}
            className="p-2 rounded-full border border-[#203B35]/12 bg-[#FAF8F3] hover:bg-white text-[#282B2A] transition-all shadow-sm"
            title="Share this project"
            aria-label="Share project"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Authenticated User Actions */}
          {isAuthenticated ? (
            <>
              {/* Notifications Dropdown */}
              <div ref={notifMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-full border border-[#203B35]/12 bg-[#FAF8F3] hover:bg-white text-[#282B2A] transition-all shadow-sm"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#E85D3F] ring-2 ring-[#FAF8F3]" />
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/15 py-2 shadow-2xl z-50">
                    <div className="px-3.5 py-2 border-b border-[#203B35]/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#203B35]">Activity & Notifications</span>
                      <Link
                        href="/dashboard?tab=notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-[11px] text-[#5D635F] hover:text-[#203B35]"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="py-1 text-xs">
                      <Link
                        href="/dashboard?tab=notifications"
                        onClick={() => setNotifOpen(false)}
                        className="block px-3.5 py-2.5 hover:bg-[#EFECE2]/70 transition-colors"
                      >
                        <p className="font-medium text-[#203B35]">Check incoming feedback</p>
                        <p className="text-[11px] text-[#5D635F]">New comments and appreciation on your studio work.</p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Menu */}
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] p-1 hover:border-[#203B35]/35 transition-all shadow-sm focus:outline-none"
                  aria-label="User account menu"
                >
                  <div className="h-7 w-7 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-xs font-semibold overflow-hidden">
                    {user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName || "Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user?.displayName?.charAt(0) || user?.username?.charAt(0) || "U"
                    )}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/15 py-2 shadow-2xl z-50">
                    <div className="px-4 py-2 border-b border-[#203B35]/10">
                      <p className="text-xs font-bold text-[#203B35] truncate">{user?.displayName}</p>
                      <p className="text-[11px] font-mono text-[#5D635F] truncate">@{user?.username}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href={`/profile/${user?.username}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#EFECE2]/70 transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#5D635F]" />
                        <span>View Portfolio Profile</span>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#EFECE2]/70 transition-colors"
                      >
                        <FolderKanban className="w-3.5 h-3.5 text-[#5D635F]" />
                        <span>Studio Workspace</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=connections"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#EFECE2]/70 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-[#5D635F]" />
                        <span>Creator Connections</span>
                      </Link>

                      <Link
                        href="/settings/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#EFECE2]/70 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#5D635F]" />
                        <span>Account Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-[#203B35]/10 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/login?callbackUrl=/projects/${creator.id}`}
                className="px-3 py-1.5 text-xs font-semibold text-[#203B35] hover:text-[#162A26] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] transition-all shadow-sm"
              >
                Join Studio
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#203B35] hover:bg-[#203B35]/5 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#203B35]/10 bg-[#FAF8F3] px-4 py-4 space-y-3">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#92958F]" />
            <input
              type="text"
              placeholder="Search works, creators, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#203B35]/15 bg-white pl-9 pr-3 py-2 text-xs text-[#282B2A] focus:outline-none"
            />
          </div>

          <nav className="flex flex-col gap-1 pt-1 text-sm">
            <Link
              href="/feed"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#203B35] hover:bg-[#EFECE2]/70 font-medium"
            >
              <Sparkles className="w-4 h-4 text-[#203B35]" />
              Feed
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#203B35] hover:bg-[#EFECE2]/70 font-medium"
            >
              <Compass className="w-4 h-4 text-[#203B35]" />
              Explore
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#203B35] hover:bg-[#EFECE2]/70 font-medium"
                >
                  <FolderKanban className="w-4 h-4 text-[#203B35]" />
                  Workspace
                </Link>
                <Link
                  href="/dashboard?tab=connections"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#203B35] hover:bg-[#EFECE2]/70 font-medium"
                >
                  <Users className="w-4 h-4 text-[#203B35]" />
                  Connections
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
