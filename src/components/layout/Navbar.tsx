"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sparkles,
  Compass,
  FolderKanban,
  Bell,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Users,
  Settings,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function StudioMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="3.5"
        stroke="currentColor"
        strokeWidth="2.1"
      />
      <rect
        x="11"
        y="11"
        width="14"
        height="14"
        rx="3.5"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="2.1"
      />
      <circle cx="14" cy="14" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAuthenticated = status === "authenticated";
  const user = session?.user;

  // On home, feed, explore, discover, register, login, profile, and projects pages, dedicated navigation is rendered instead
  if (
    pathname === "/" ||
    pathname === "/feed" ||
    pathname === "/explore" ||
    pathname === "/discover" ||
    pathname === "/register" ||
    pathname === "/login" ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/projects")
  ) {
    return null;
  }

  const navLinkClass = (href: string) => {
    const active =
      pathname === href ||
      (href === "/explore" && (pathname === "/explore" || pathname === "/discover"));
    return `flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
      active
        ? "text-[#F5F0E8] bg-white/[0.07]"
        : "text-[#A89F94] hover:text-[#F5F0E8] hover:bg-white/[0.04]"
    }`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0C0B0A]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85D3F] to-[#D14628] text-[#FFF8F4] shadow-md shadow-[#E85D3F]/20 group-hover:scale-[1.04] transition-transform">
              <StudioMark className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-[#F5F0E8] leading-tight">
                Creative<span className="font-serif italic font-normal text-[#F47652] text-[18px] ml-0.5">Space</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#756D64] leading-none mt-0.5">
                Creator Studio
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 pl-2" aria-label="Primary navigation">
            <Link href="/explore" className={navLinkClass("/explore")}>
              <Compass className="w-4 h-4 text-[#E85D3F]" />
              Explore
            </Link>
            <Link href="/feed" className={navLinkClass("/feed")}>
              <Sparkles className="w-4 h-4 text-[#E5A93C]" />
              Community
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                  <FolderKanban className="w-4 h-4 text-[#A89F94]" />
                  Workspace
                </Link>
                <Link
                  href="/dashboard?tab=connections"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#A89F94] hover:text-[#F5F0E8] hover:bg-white/[0.04] rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4 text-[#4E9F76]" />
                  Connections
                </Link>
                <Link href="/messages" className={navLinkClass("/messages")}>
                  <MessageSquare className="w-4 h-4 text-[#E85D3F]" />
                  Messages
                </Link>
              </>
            )}
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#E5A93C] hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-[#A89F94] hover:bg-white/[0.06] hover:text-[#F5F0E8] transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D3F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E85D3F]"></span>
                </span>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-[#151311] p-1 hover:border-[#E85D3F]/60 transition-colors focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#E85D3F] to-[#E5A93C] flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
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
                  <span className="hidden sm:inline-block text-xs font-medium text-[#F5F0E8] pr-2.5">
                    {user?.displayName || user?.username}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.1] bg-[#151311] py-1.5 shadow-2xl shadow-black/60 z-50">
                    <div className="px-4 py-2.5 border-b border-white/[0.07]">
                      <p className="text-xs font-semibold text-[#F5F0E8]">{user?.displayName}</p>
                      <p className="text-[11px] font-mono text-[#756D64] truncate">@{user?.username}</p>
                    </div>

                    <Link
                      href={`/profile/${user?.username}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#A89F94] hover:bg-white/[0.05] hover:text-[#F5F0E8] transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-[#E85D3F]" />
                      {user?.role === "VIEWER" ? "View Profile" : "View Portfolio & Profile"}
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#A89F94] hover:bg-white/[0.05] hover:text-[#F5F0E8] transition-colors"
                    >
                      <FolderKanban className="w-4 h-4 text-[#E5A93C]" />
                      {user?.role === "VIEWER" ? "Viewer Space" : "Creator Workspace"}
                    </Link>

                    <Link
                      href="/dashboard?tab=connections"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#A89F94] hover:bg-white/[0.05] hover:text-[#F5F0E8] transition-colors"
                    >
                      <Users className="w-4 h-4 text-[#4E9F76]" />
                      Connections
                    </Link>

                    <Link
                      href="/messages"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#A89F94] hover:bg-white/[0.05] hover:text-[#F5F0E8] transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-[#E85D3F]" />
                      Messages / Inbox
                    </Link>

                    <Link
                      href="/settings/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#A89F94] hover:bg-white/[0.05] hover:text-[#F5F0E8] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#A89F94]" />
                      Profile Settings
                    </Link>

                    <div className="border-t border-white/[0.07] my-1" />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[#A89F94] hover:text-[#F5F0E8]">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-[#F5F0E8] text-[#0C0B0A] hover:bg-white font-semibold rounded-full px-4 shadow-none"
                >
                  Open Studio
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-[#A89F94] hover:bg-white/[0.06] hover:text-[#F5F0E8]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0C0B0A] px-4 pt-3 pb-5 space-y-1.5">
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#F5F0E8] hover:bg-white/[0.05] rounded-lg"
          >
            <Compass className="w-4 h-4 text-[#E85D3F]" />
            Explore Universe
          </Link>
          <Link
            href="/feed"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#F5F0E8] hover:bg-white/[0.05] rounded-lg"
          >
            <Sparkles className="w-4 h-4 text-[#E5A93C]" />
            Community Feed
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#F5F0E8] hover:bg-white/[0.05] rounded-lg"
              >
                <FolderKanban className="w-4 h-4 text-[#A89F94]" />
                Creator Workspace
              </Link>
              <Link
                href="/dashboard?tab=connections"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#F5F0E8] hover:bg-white/[0.05] rounded-lg"
              >
                <Users className="w-4 h-4 text-[#4E9F76]" />
                Connections
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#F5F0E8] hover:bg-white/[0.05] rounded-lg"
              >
                <MessageSquare className="w-4 h-4 text-[#E85D3F]" />
                Messages / Inbox
              </Link>
            </>
          )}
          {user?.isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#E5A93C] hover:bg-white/[0.05] rounded-lg"
            >
              <ShieldAlert className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
