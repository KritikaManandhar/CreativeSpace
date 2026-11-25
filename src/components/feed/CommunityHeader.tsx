"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Search,
  Plus,
  Bell,
  Check,
  CheckCheck,
  User as UserIcon,
  FolderKanban,
  Settings,
  LogOut,
  Sparkles,
  Compass,
  X,
  ExternalLink,
  Menu,
  Shield,
  Layers,
  Heart,
  MessageSquare,
  UserCheck,
  ArrowUpRight,
} from "lucide-react";
import { CreativeSpaceWordmark, CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface CommunityHeaderProps {
  onCreateClick?: () => void;
  onMobileMenuToggle?: () => void;
  unreadCount?: number;
}

interface SearchResultProject {
  id: string;
  title: string;
  category: string;
  creator: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedProject?: { id: string; title: string } | null;
  relatedUser?: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
}

export function CommunityHeader({
  onCreateClick,
  onMobileMenuToggle,
  unreadCount: externalUnreadCount,
}: CommunityHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isCreator = user?.role === "CREATOR" || !user?.role; // Default creators can publish

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultProject[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Dropdown states
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(externalUnreadCount ?? 0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Keep unread count synchronized
  useEffect(() => {
    if (externalUnreadCount !== undefined) {
      setUnreadCount(externalUnreadCount);
    }
  }, [externalUnreadCount]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications when opening the notification panel
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleOpenNotifications = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    if (nextState) {
      setIsUserMenuOpen(false);
      fetchNotifications();
    }
  };

  const handleMarkNotificationRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Non-blocking
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        const json = await res.json();
        if (json.success && json.data?.projects) {
          setSearchResults(json.data.projects);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const formatNotifText = (n: NotificationItem) => {
    const actor = n.relatedUser?.displayName || "Someone";
    switch (n.type) {
      case "Like":
        return `${actor} liked your project "${n.relatedProject?.title || "Project"}"`;
      case "Comment":
      case "Reply":
        return `${actor} commented on "${n.relatedProject?.title || "Project"}"`;
      case "Follow":
        return `${actor} started following you`;
      case "Invitation":
        return `${actor} invited you to collaborate on "${n.relatedProject?.title || "Project"}"`;
      case "ConnectionRequest":
        return `${actor} sent you a connection request`;
      case "ConnectionAccepted":
        return `${actor} accepted your connection request`;
      default:
        return `New notification from ${actor}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6F3EB]/95 backdrop-blur-md border-b border-[#203B35]/10 transition-colors">
      <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#203B35]/15 text-[#203B35] hover:bg-[#203B35]/5 transition-colors"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <Link
            href="/"
            className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 rounded-lg py-1"
            aria-label="CreativeSpace Community Home"
          >
            <span className="transition-transform duration-300 group-hover:scale-[1.015]">
              <CreativeSpaceWordmark variant="dark" />
            </span>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-lg hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5D635F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search creators, creative projects, categories..."
              className="w-full h-10 pl-9.5 pr-8 rounded-full bg-[#FAF8F3] border border-[#203B35]/15 text-sm text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white focus:ring-2 focus:ring-[#203B35]/10 transition-all shadow-[0_1px_3px_rgba(32,59,53,0.04)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#92958F] hover:text-[#282B2A]"
                aria-label="Clear search query"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#FAF8F3] border border-[#203B35]/15 p-2 shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#5D635F] border-b border-[#203B35]/10 flex items-center justify-between">
                <span>Matching Works & Creators</span>
                {isSearching && <span className="animate-pulse text-[#203B35]">Searching...</span>}
              </div>

              {searchResults.length > 0 ? (
                <div className="py-1 divide-y divide-[#203B35]/5">
                  {searchResults.map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#EFECE2]/70 transition-colors group"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-[#203B35] group-hover:text-[#162A26] truncate">
                          {proj.title}
                        </p>
                        <p className="text-xs text-[#5D635F] truncate">
                          by {proj.creator?.displayName || "Creator"} · <span className="text-[#203B35]/80">{proj.category}</span>
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-[#92958F] group-hover:text-[#203B35] shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-4 text-center text-xs text-[#5D635F]">
                  No creative projects found for &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full mt-1 pt-2 pb-1.5 px-3 text-center text-xs font-medium text-[#203B35] hover:underline border-t border-[#203B35]/10 flex items-center justify-center gap-1.5"
              >
                <span>View all search results in Explore</span>
                <Compass className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Section: Create Button, Notifications, Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Create Button (Single creation entry point on Home Page) */}
          {isCreator && (
            <button
              type="button"
              onClick={onCreateClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#F6F3EB] shadow-sm transition-all duration-200 hover:bg-[#162A26] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              title="Create new project or publish work"
            >
              <Plus className="h-3.5 w-3.5 text-[#9DB5A5]" />
              <span className="hidden sm:inline">Create</span>
              <span className="sm:hidden">Post</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={handleOpenNotifications}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#203B35]/15 bg-[#FAF8F3] text-[#203B35] hover:bg-[#EFECE2] hover:border-[#203B35]/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
              aria-label="View notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#203B35] px-1 text-[10px] font-bold text-[#F6F3EB] ring-2 ring-[#F6F3EB]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#FAF8F3] border border-[#203B35]/15 p-2 shadow-2xl z-50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#203B35]/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#203B35]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#203B35]/10 px-2 py-0.5 text-[10px] font-semibold text-[#203B35]">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dashboard?tab=notifications"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[11px] font-medium text-[#203B35] hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#203B35]/5 py-1">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs flex items-start justify-between gap-2.5 transition-colors rounded-lg ${
                          notif.isRead ? "text-[#5D635F] hover:bg-[#EFECE2]/50" : "bg-[#F6F3EB] text-[#282B2A] font-medium hover:bg-[#EFECE2]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="h-6 w-6 rounded-full bg-[#203B35]/10 flex items-center justify-center text-[#203B35] shrink-0 mt-0.5">
                            {notif.type === "Like" && <Heart className="h-3 w-3 fill-[#203B35]" />}
                            {notif.type === "Comment" && <MessageSquare className="h-3 w-3" />}
                            {notif.type === "Follow" && <UserIcon className="h-3 w-3" />}
                            {notif.type === "Invitation" && <Sparkles className="h-3 w-3 text-[#E5A93C]" />}
                            {notif.type.includes("Connection") && <UserCheck className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 leading-relaxed">{formatNotifText(notif)}</p>
                            <span className="text-[10px] text-[#92958F] mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkNotificationRead(notif.id, e)}
                            className="p-1 text-[#92958F] hover:text-[#203B35] rounded transition-colors shrink-0"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-[#5D635F]">
                      No notifications yet. You&apos;re completely up to date!
                    </div>
                  )}
                </div>

                <div className="pt-2 mt-1 border-t border-[#203B35]/10 px-1">
                  <Link
                    href="/notifications"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#203B35]/5 text-[#203B35] hover:bg-[#203B35]/10 text-xs font-semibold transition-colors w-full"
                  >
                    <span>View All Notifications</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Account Dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] p-1 pr-2.5 hover:border-[#203B35]/35 hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30"
              aria-expanded={isUserMenuOpen}
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
              <span className="hidden md:inline-block text-xs font-medium text-[#203B35] max-w-[110px] truncate">
                {user?.displayName || user?.username}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#FAF8F3] border border-[#203B35]/15 py-1.5 shadow-2xl z-50">
                {/* User info banner */}
                <div className="px-4 py-2.5 border-b border-[#203B35]/10">
                  <p className="text-xs font-semibold text-[#203B35] truncate">{user?.displayName}</p>
                  <p className="text-[11px] font-mono text-[#5D635F] truncate">@{user?.username}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#203B35]/10 px-2 py-0.5 text-[10px] font-medium text-[#203B35]">
                    <CelestialSpark className="h-2.5 w-2.5 text-[#9DB5A5]" />
                    <span>{user?.role === "VIEWER" ? "Community Viewer" : "Creator"}</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href={`/profile/${user?.username}`}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-[#203B35]" />
                    <span>{user?.role === "VIEWER" ? "My Profile" : "Portfolio & Profile"}</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                  >
                    <FolderKanban className="h-4 w-4 text-[#9DB5A5]" />
                    <span>Workspace & Drafts</span>
                  </Link>

                  <Link
                    href="/messages"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 text-[#203B35]" />
                    <span>Messages / Inbox</span>
                  </Link>

                  <Link
                    href="/settings/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                  >
                    <Settings className="h-4 w-4 text-[#5D635F]" />
                    <span>Profile Settings</span>
                  </Link>

                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#203B35] font-medium hover:bg-[#EFECE2] transition-colors"
                    >
                      <Shield className="h-4 w-4 text-[#C8BDE0]" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                </div>

                <div className="border-t border-[#203B35]/10 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
