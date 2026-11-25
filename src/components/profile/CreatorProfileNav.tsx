"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Compass,
  Sparkles,
  Search,
  Plus,
  Bell,
  User as UserIcon,
  FolderKanban,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Heart,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { CreativeSpaceWordmark, CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface CreatorProfileNavProps {
  onCreateClick?: () => void;
}

export function CreatorProfileNav({ onCreateClick }: CreatorProfileNavProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isCreator = user?.role === "CREATOR" || !user?.role;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dropdown states
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unread notifications if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.notifications)) {
          setNotifications(json.data.notifications);
          setUnreadCount(json.data.notifications.filter((n: any) => !n.isRead).length);
        }
      } catch {
        // Safe silent fallback
      }
    }
    loadNotifications();
  }, [isAuthenticated]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6F3EB]/95 backdrop-blur-md border-b border-[#203B35]/10 transition-colors">
      <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left: Brand Logo & Navigation Links */}
        <div className="flex items-center gap-6 shrink-0">
          <Link
            href="/"
            className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 rounded-lg py-1"
            aria-label="CreativeSpace Home"
          >
            <span className="transition-transform duration-300 group-hover:scale-[1.015]">
              <CreativeSpaceWordmark variant="dark" />
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#203B35]/10">
            <Link
              href="/feed"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9DB5A5]" />
              <span>Community Feed</span>
            </Link>

            <Link
              href="/discover"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#9DB5A5]" />
              <span>Explore</span>
            </Link>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5D635F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search works, creators, tags..."
              className="w-full h-9.5 pl-10 pr-4 rounded-full bg-[#FAF8F3] border border-[#203B35]/15 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white focus:ring-2 focus:ring-[#203B35]/10 transition-all"
            />
          </form>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Create Button */}
              {isCreator && onCreateClick && (
                <button
                  type="button"
                  onClick={onCreateClick}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#F6F3EB] shadow-sm transition-all duration-200 hover:bg-[#162A26] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
                  title="Create new project"
                >
                  <Plus className="h-3.5 w-3.5 text-[#9DB5A5]" />
                  <span className="hidden sm:inline">Create Work</span>
                  <span className="sm:hidden">Post</span>
                </button>
              )}

              {/* Notifications Dropdown */}
              <div ref={notifMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserMenuOpen(false);
                  }}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#203B35]/15 bg-[#FAF8F3] text-[#203B35] hover:bg-[#EFECE2] hover:border-[#203B35]/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                  aria-label="View notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#203B35] px-1 text-[10px] font-bold text-[#F6F3EB] ring-2 ring-[#F6F3EB]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/15 p-2 shadow-2xl z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#203B35]/10">
                      <span className="text-xs font-bold text-[#203B35]">Activity & Notifications</span>
                      <Link
                        href="/dashboard?tab=notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[11px] font-medium text-[#203B35] hover:underline"
                      >
                        All Notifications
                      </Link>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-[#203B35]/5 py-1">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs flex items-start gap-2.5 transition-colors rounded-xl ${
                              n.isRead ? "text-[#5D635F]" : "bg-[#F6F3EB] text-[#282B2A] font-medium"
                            }`}
                          >
                            <div className="h-6 w-6 rounded-full bg-[#203B35]/10 flex items-center justify-center text-[#203B35] shrink-0 mt-0.5">
                              {n.type === "Like" && <Heart className="h-3 w-3 fill-[#203B35]" />}
                              {n.type === "Comment" && <MessageSquare className="h-3 w-3" />}
                              {n.type === "Follow" && <UserIcon className="h-3 w-3" />}
                              {n.type === "Invitation" && <Sparkles className="h-3 w-3 text-[#E5A93C]" />}
                              {n.type.includes("Connection") && <UserCheck className="h-3 w-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 leading-relaxed">
                                {n.relatedUser?.displayName || "A creator"}{" "}
                                {n.type === "Follow" ? "started following you" : "interacted with your work"}
                              </p>
                              <span className="text-[10px] text-[#92958F] mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-[#92958F]">
                          No notifications yet. You are completely up to date!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] p-1 pr-2.5 hover:border-[#203B35]/35 hover:bg-[#EFECE2] transition-colors focus:outline-none"
                  aria-expanded={userMenuOpen}
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
                  <span className="hidden md:inline-block text-xs font-semibold text-[#203B35] max-w-[110px] truncate">
                    {user?.displayName || user?.username}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/15 py-1.5 shadow-2xl z-50">
                    <div className="px-4 py-2.5 border-b border-[#203B35]/10">
                      <p className="text-xs font-semibold text-[#203B35] truncate">{user?.displayName}</p>
                      <p className="text-[11px] font-mono text-[#5D635F] truncate">@{user?.username}</p>
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        href={`/profile/${user?.username}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                      >
                        <UserIcon className="h-4 w-4 text-[#203B35]" />
                        <span>My Creator Profile</span>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                      >
                        <FolderKanban className="h-4 w-4 text-[#9DB5A5]" />
                        <span>Workspace & Projects</span>
                      </Link>

                      <Link
                        href="/settings/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                      >
                        <Settings className="h-4 w-4 text-[#5D635F]" />
                        <span>Edit Profile & Settings</span>
                      </Link>

                      {user?.isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-[#203B35] font-semibold hover:bg-[#EFECE2] transition-colors"
                        >
                          <Shield className="h-4 w-4 text-[#C8BDE0]" />
                          <span>Admin Portal</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-[#203B35]/10 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
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
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="text-xs font-semibold text-[#203B35] hover:text-[#162A26] px-3.5 py-2 rounded-full hover:bg-[#203B35]/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold bg-[#203B35] text-[#F6F3EB] px-4 py-2 rounded-full hover:bg-[#162A26] transition-colors shadow-sm"
              >
                Join CreativeSpace
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#203B35]/15 text-[#203B35] hover:bg-[#203B35]/5"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#203B35]/10 bg-[#F6F3EB] px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5D635F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search works, creators..."
              className="w-full h-9 pl-9 pr-3 rounded-full bg-[#FAF8F3] border border-[#203B35]/15 text-xs text-[#282B2A]"
            />
          </form>

          <div className="space-y-1 pt-2">
            <Link
              href="/feed"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#282B2A] rounded-lg hover:bg-[#203B35]/5"
            >
              <Sparkles className="h-4 w-4 text-[#9DB5A5]" />
              <span>Community Feed</span>
            </Link>
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#282B2A] rounded-lg hover:bg-[#203B35]/5"
            >
              <Compass className="h-4 w-4 text-[#9DB5A5]" />
              <span>Explore</span>
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href={`/profile/${user?.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#282B2A] rounded-lg hover:bg-[#203B35]/5"
                >
                  <UserIcon className="h-4 w-4 text-[#203B35]" />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#282B2A] rounded-lg hover:bg-[#203B35]/5"
                >
                  <FolderKanban className="h-4 w-4 text-[#9DB5A5]" />
                  <span>Workspace & Drafts</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
