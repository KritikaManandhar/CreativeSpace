"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Compass,
  Sparkles,
  FolderKanban,
  Users,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  Menu,
  X,
  Shield,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { CreativeSpaceWordmark, CelestialSpark, CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";

interface ExploreTopNavProps {
  onSearchFocus?: () => void;
}

export function ExploreTopNav({ onSearchFocus }: ExploreTopNavProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
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

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6F3EB]/95 backdrop-blur-md border-b border-[#203B35]/10">
      <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link
            href="/"
            className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 rounded-lg py-1"
            aria-label="CreativeSpace Home"
          >
            <span className="transition-transform duration-300 group-hover:scale-[1.015]">
              <CreativeSpaceWordmark variant="dark" />
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 pl-2" aria-label="Explore navigation">
            <Link
              href="/feed"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5D635F]" />
              <span>Feed</span>
            </Link>

            <Link
              href="/explore"
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold tracking-wide rounded-full bg-[#203B35] text-[#F6F3EB] shadow-sm transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-[#9DB5A5]" />
              <span>Explore</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#9DB5A5]" />
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-all"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-[#5D635F]" />
                  <span>Workspace</span>
                </Link>

                <Link
                  href="/dashboard?tab=connections"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5 transition-all"
                >
                  <Users className="w-3.5 h-3.5 text-[#5D635F]" />
                  <span>Connections</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Section: Actions & User Menu */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* Notifications */}
              <div ref={notifMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-full border border-[#203B35]/12 bg-[#FAF8F3] text-[#203B35] hover:border-[#203B35]/30 hover:bg-white transition-colors"
                  aria-label="Open notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D3F] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E85D3F]" />
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-3 shadow-xl z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-[#203B35]/10 px-1">
                      <span className="text-xs font-bold text-[#203B35] uppercase tracking-wider font-mono">
                        Notifications
                      </span>
                      <button
                        onClick={() => setUnreadCount(0)}
                        className="text-[11px] text-[#5D635F] hover:text-[#203B35]"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="py-2 space-y-2 text-xs">
                      <div className="p-2 rounded-xl bg-white/70 border border-[#203B35]/8">
                        <p className="font-medium text-[#203B35]">
                          Kenji Sato liked your work in Photography
                        </p>
                        <span className="text-[10px] text-[#92958F] font-mono">10m ago</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/70 border border-[#203B35]/8">
                        <p className="font-medium text-[#203B35]">
                          Elena Rostova invited you to collaborate on Swiss Type
                        </p>
                        <span className="text-[10px] text-[#92958F] font-mono">1h ago</span>
                      </div>
                    </div>
                    <Link
                      href="/notifications"
                      className="block text-center pt-2 text-xs font-semibold text-[#203B35] hover:underline border-t border-[#203B35]/10"
                    >
                      View all notifications →
                    </Link>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] hover:border-[#203B35]/40 hover:bg-white transition-all focus:outline-none"
                >
                  <CreatorAvatar
                    initials={user?.displayName?.slice(0, 2).toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || "ME"}
                    tone="#203B35"
                    accent="#C8BDE0"
                    name={user?.displayName || "Me"}
                    size="xs"
                  />
                  <span className="hidden sm:inline-block text-xs font-medium text-[#203B35] max-w-[110px] truncate">
                    {user?.displayName || user?.username}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] py-2 shadow-2xl z-50">
                    <div className="px-4 py-2 border-b border-[#203B35]/10">
                      <p className="text-xs font-bold text-[#203B35]">{user?.displayName}</p>
                      <p className="text-[11px] font-mono text-[#5D635F] truncate">@{user?.username}</p>
                    </div>

                    <Link
                      href={`/profile/${user?.username}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#203B35]/8 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#203B35]" />
                      <span>Portfolio Profile</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#203B35]/8 transition-colors"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-[#203B35]" />
                      <span>Workspace Projects</span>
                    </Link>

                    <Link
                      href="/settings/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#282B2A] hover:bg-[#203B35]/8 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#203B35]" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="border-t border-[#203B35]/10 my-1" />

                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-[#203B35] hover:text-[#162A26] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#203B35] text-[#F6F3EB] text-xs font-semibold hover:bg-[#162A26] transition-colors shadow-sm"
              >
                <span>Join</span>
                <CelestialSpark className="w-3 h-3 text-[#9DB5A5]" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-[#203B35]/15 text-[#203B35] hover:bg-[#203B35]/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#203B35]/10 bg-[#F6F3EB] px-4 py-4 space-y-2">
          <Link
            href="/feed"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#282B2A] hover:bg-[#203B35]/5"
          >
            <Sparkles className="w-4 h-4 text-[#5D635F]" />
            <span>Community Feed</span>
          </Link>
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#203B35] text-[#F6F3EB]"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 text-[#9DB5A5]" />
              <span>Explore Universe</span>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-[#9DB5A5]" />
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#282B2A] hover:bg-[#203B35]/5"
              >
                <FolderKanban className="w-4 h-4 text-[#5D635F]" />
                <span>Workspace</span>
              </Link>
              <Link
                href="/dashboard?tab=connections"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#282B2A] hover:bg-[#203B35]/5"
              >
                <Users className="w-4 h-4 text-[#5D635F]" />
                <span>Connections</span>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
