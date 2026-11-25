"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  Compass,
  Briefcase,
  Bookmark,
  Users,
  UserCheck,
  FolderKanban,
  User,
  Settings,
  Sparkles,
  ArrowUpRight,
  Bell,
} from "lucide-react";

interface LeftNavSidebarProps {
  activeView?: "home" | "saved" | "following";
  onSelectView?: (view: "home" | "saved" | "following") => void;
  incomingConnectionsCount?: number;
  pendingCollaborationsCount?: number;
  unreadNotificationsCount?: number;
  savedCount?: number;
  className?: string;
  onItemClick?: () => void;
}

export function LeftNavSidebar({
  activeView = "home",
  onSelectView,
  incomingConnectionsCount = 0,
  pendingCollaborationsCount = 0,
  unreadNotificationsCount = 0,
  savedCount = 0,
  className = "",
  onItemClick,
}: LeftNavSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const username = user?.username || "";

  const isHomeActive = pathname === "/" || pathname === "/feed";

  const handleViewClick = (view: "home" | "saved" | "following") => {
    if (onSelectView) {
      onSelectView(view);
    }
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <nav
      aria-label="Community navigation sidebar"
      className={`flex flex-col justify-between py-6 ${className}`}
    >
      <div className="space-y-7">
        {/* ============================================================ */}
        {/* SECTION 1: DISCOVER                                          */}
        {/* ============================================================ */}
        <div>
          <h3 className="px-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] mb-2 font-semibold">
            Discover
          </h3>
          <div className="space-y-1">
            {/* Home button */}
            <button
              type="button"
              onClick={() => handleViewClick("home")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                isHomeActive && activeView === "home"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm font-semibold"
                  : "text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Home
                  className={`h-4 w-4 ${
                    isHomeActive && activeView === "home" ? "text-[#9DB5A5]" : "text-[#5D635F]"
                  }`}
                />
                <span>Home</span>
              </div>
              {isHomeActive && activeView === "home" && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#9DB5A5]" />
              )}
            </button>

            {/* Explore link */}
            <Link
              href="/explore"
              onClick={onItemClick}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === "/explore" || pathname === "/discover"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm font-semibold"
                  : "text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass
                  className={`h-4 w-4 ${
                    pathname === "/explore" || pathname === "/discover" ? "text-[#9DB5A5]" : "text-[#5D635F]"
                  }`}
                />
                <span>Explore</span>
              </div>
              {(pathname === "/explore" || pathname === "/discover") && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#9DB5A5]" />
              )}
            </Link>

            {/* Services link */}
            <Link
              href="/discover?tab=services"
              onClick={onItemClick}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-[#5D635F]" />
                <span>Services</span>
              </div>
              <span className="text-[10px] font-mono text-[#92958F] uppercase tracking-wider">
                Browse
              </span>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: YOUR SPACE                                        */}
        {/* ============================================================ */}
        <div>
          <h3 className="px-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] mb-2 font-semibold">
            Your Space
          </h3>
          <div className="space-y-1">
            {/* Notifications (Dedicated Notifications Page) */}
            <Link
              href="/notifications"
              onClick={onItemClick}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === "/notifications"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm font-semibold"
                  : "text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell
                  className={`h-4 w-4 ${
                    pathname === "/notifications" ? "text-[#9DB5A5]" : "text-[#5D635F]"
                  }`}
                />
                <span>Notifications</span>
              </div>
              {unreadNotificationsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#E85D3F] text-white text-[10px] font-bold">
                  {unreadNotificationsCount}
                </span>
              ) : (
                pathname === "/notifications" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9DB5A5]" />
                )
              )}
            </Link>

            {/* Saved items */}
            <button
              type="button"
              onClick={() => handleViewClick("saved")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                activeView === "saved"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm font-semibold"
                  : "text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark
                  className={`h-4 w-4 ${
                    activeView === "saved" ? "text-[#9DB5A5]" : "text-[#5D635F]"
                  }`}
                />
                <span>Saved</span>
              </div>
              {savedCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    activeView === "saved"
                      ? "bg-white/20 text-[#F6F3EB]"
                      : "bg-[#203B35]/10 text-[#203B35]"
                  }`}
                >
                  {savedCount}
                </span>
              )}
            </button>

            {/* Following feed */}
            <button
              type="button"
              onClick={() => handleViewClick("following")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                activeView === "following"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm font-semibold"
                  : "text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users
                  className={`h-4 w-4 ${
                    activeView === "following" ? "text-[#9DB5A5]" : "text-[#5D635F]"
                  }`}
                />
                <span>Following</span>
              </div>
            </button>

            {/* Connections (Strictly separate from Following) */}
            <Link
              href="/dashboard?tab=connections"
              onClick={onItemClick}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-[#5D635F]" />
                <span>Connections</span>
              </div>
              {incomingConnectionsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#C8BDE0] text-[#203B35] text-[10px] font-bold">
                  {incomingConnectionsCount}
                </span>
              )}
            </Link>

            {/* My Collaborations (Strictly separate from Connections) */}
            <Link
              href="/dashboard?tab=invitations"
              onClick={onItemClick}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <FolderKanban className="h-4 w-4 text-[#5D635F]" />
                <span>My Collaborations</span>
              </div>
              {pendingCollaborationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#9DB5A5] text-[#203B35] text-[10px] font-bold">
                  {pendingCollaborationsCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 3: ACCOUNT                                           */}
        {/* ============================================================ */}
        <div>
          <h3 className="px-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] mb-2 font-semibold">
            Account
          </h3>
          <div className="space-y-1">
            <Link
              href={`/profile/${username}`}
              onClick={onItemClick}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === `/profile/${username}`
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm font-semibold"
                  : "text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-[#5D635F]" />
                <span>My Profile</span>
              </div>
            </Link>

            <Link
              href="/settings/profile"
              onClick={onItemClick}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === "/settings/profile"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm font-semibold"
                  : "text-[#282B2A] hover:bg-[#EFECE2]/75 hover:text-[#203B35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-[#5D635F]" />
                <span>Settings</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* User Quick Studio Summary Card */}
      <div className="mt-8 pt-5 border-t border-[#203B35]/10">
        <Link
          href={`/profile/${username}`}
          onClick={onItemClick}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F3] border border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-[#EFECE2]/60 transition-all group"
        >
          <div className="h-9 w-9 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
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
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#203B35] truncate group-hover:text-[#162A26]">
              {user?.displayName || user?.username}
            </p>
            <p className="text-[11px] text-[#5D635F] truncate">
              @{user?.username}
            </p>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#92958F] group-hover:text-[#203B35] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
        </Link>
      </div>
    </nav>
  );
}
