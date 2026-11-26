"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PencilLine,
  Plus,
  Settings,
  User,
  X,
} from "lucide-react";
import {
  CelestialSpark,
  CreativeSpaceWordmark,
} from "@/components/landing/CreativeSpaceBrand";
import { MOCK_PROFILES, deriveInitials } from "@/data/mockProfiles";
import { FeedAvatar } from "@/components/feed/FeedAvatar";

export interface AuthenticatedNavbarProps {
  /** Optional override for pages wanting explicit active nav feedback */
  activeNav?: "home" | "explore" | "ideas" | "dashboard";
  /** Optional handler to open the post creation modal directly from the navbar */
  onCreatePost?: () => void;
}

interface NavDestination {
  key: "home" | "explore" | "ideas" | "dashboard";
  label: string;
  href: string;
}

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40";

function resolveActiveKey(
  pathname: string,
  override?: AuthenticatedNavbarProps["activeNav"]
): NavDestination["key"] | null {
  if (override) return override;
  if (pathname === "/" || pathname.startsWith("/feed")) return "home";
  if (pathname.startsWith("/explore") || pathname.startsWith("/discover")) {
    return "explore";
  }
  if (pathname.startsWith("/ideas")) return "ideas";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  return null;
}

/**
 * Shared authenticated navigation bar styled in CreativeSpace's cream-and-forest editorial palette.
 * Used across the authenticated Community Feed home page and ready for reuse in upcoming internal pages.
 */
export function AuthenticatedNavbar({
  activeNav,
  onCreatePost,
}: AuthenticatedNavbarProps) {
  const pathname = usePathname() || "/";
  const { data: session, status } = useSession();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.id);
  const defaultPreviewUser = MOCK_PROFILES.anya_art;

  const activeUsername =
    (isAuthenticated && session?.user?.username) || defaultPreviewUser.username;
  const activeDisplayName =
    (isAuthenticated && (session?.user?.displayName || session?.user?.name)) ||
    defaultPreviewUser.displayName;
  const activeAvatarUrl = isAuthenticated
    ? session?.user?.avatarUrl ?? null
    : defaultPreviewUser.avatarUrl;
  const activeInitials = deriveInitials(activeDisplayName || activeUsername);

  // Logged-in home lives at `/`; unauthenticated local previews on `/feed` keep logo/home in the feed.
  const homeHref = isAuthenticated ? "/" : "/feed";
  const currentActiveKey = resolveActiveKey(pathname, activeNav);

  const navLinks: NavDestination[] = [
    { key: "home", label: "Home", href: homeHref },
    { key: "explore", label: "Explore", href: "/explore" },
    { key: "ideas", label: "Ideas", href: "/ideas" },
    { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(target)) {
        setAvatarMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAvatarMenuOpen(false);
        setNotificationsOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Close menus whenever route path transitions
  useEffect(() => {
    setAvatarMenuOpen(false);
    setNotificationsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setAvatarMenuOpen(false);
    setMobileOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled
          ? "bg-[#F6F3EB]/95 backdrop-blur-md border-b border-[#203B35]/15"
          : "bg-[#F6F3EB]/88 backdrop-blur-sm border-b border-[#203B35]/10"
      }`}
    >
      <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-8 lg:px-12">
        {/* Left: Brand Wordmark → Home / Community Feed */}
        <Link
          href={homeHref}
          className={`group inline-flex shrink-0 items-center rounded-lg py-1 ${FOCUS_RING}`}
          aria-label="CreativeSpace Community Feed Home"
        >
          <span className="transition-transform duration-300 group-hover:scale-[1.015]">
            <CreativeSpaceWordmark variant="dark" />
          </span>
        </Link>

        {/* Center: Primary Authenticated Links (md+) */}
        <nav
          className="hidden md:flex items-center gap-5 lg:gap-8"
          aria-label="Authenticated workspace navigation"
        >
          {navLinks.map((item) => {
            const isActive = currentActiveKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative py-1.5 text-[14px] font-medium transition-colors rounded-sm ${FOCUS_RING} ${
                  isActive
                    ? "text-[#203B35]"
                    : "text-[#282B2A]/75 hover:text-[#203B35]"
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-[#203B35]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Create Action, Notifications & User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {onCreatePost && (
            <button
              type="button"
              onClick={onCreatePost}
              className={`hidden lg:inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-4 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm ${FOCUS_RING}`}
            >
              <Plus className="h-3.5 w-3.5 text-[#9DB5A5]" />
              <span>New Post</span>
            </button>
          )}

          {/* Notifications Button + Calm Placeholder Popover */}
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setAvatarMenuOpen(false);
              }}
              aria-label="Notifications preview"
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#203B35]/15 bg-[#FAF8F3] text-[#203B35] hover:border-[#203B35]/35 hover:bg-[#EFECE2] transition-colors ${FOCUS_RING}`}
            >
              <Bell className="h-4 w-4 text-[#203B35]" />
              <span
                aria-hidden="true"
                className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#9DB5A5] ring-2 ring-[#FAF8F3]"
              />
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16 }}
                  role="dialog"
                  aria-label="Studio notifications preview"
                  className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-4 shadow-[0_20px_48px_-18px_rgba(32,59,53,0.22)] z-50"
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#203B35]/10">
                    <div className="flex items-center gap-1.5">
                      <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#203B35]">
                        Notifications
                      </span>
                    </div>
                    <span className="rounded-full bg-[#EFECE2] px-2 py-0.5 font-mono text-[10px] text-[#5D635F]">
                      Upcoming
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#282B2A]/85">
                    Studio notifications are quiet in this frontend preview. Real-time likes,
                    replies, and collaborator alerts will be connected in a later phase.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar Dropdown (md+) */}
          <div ref={avatarMenuRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => {
                setAvatarMenuOpen((prev) => !prev);
                setNotificationsOpen(false);
              }}
              aria-expanded={avatarMenuOpen}
              aria-haspopup="menu"
              aria-label={`Account menu for ${activeDisplayName}`}
              className={`inline-flex items-center gap-2 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] pl-1.5 pr-3 py-1 hover:border-[#203B35]/35 hover:bg-[#EFECE2]/60 transition-colors ${FOCUS_RING}`}
            >
              <FeedAvatar
                avatarUrl={activeAvatarUrl}
                initials={activeInitials}
                tone="#203B35"
                accent="#C8BDE0"
                name={activeDisplayName}
                size="sm"
              />
              <span className="hidden lg:inline max-w-[110px] truncate text-[13px] font-medium text-[#203B35]">
                @{activeUsername}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#5D635F] transition-transform duration-200 ${
                  avatarMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {avatarMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16 }}
                  role="menu"
                  aria-label="User account options"
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-2 shadow-[0_22px_50px_-18px_rgba(32,59,53,0.24)] z-50"
                >
                  <div className="px-3 py-2 border-b border-[#203B35]/10 mb-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13.5px] font-medium text-[#203B35] truncate">
                        {activeDisplayName}
                      </p>
                      {!isAuthenticated && (
                        <span className="shrink-0 rounded-full bg-[#EFECE2] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[#5D635F]">
                          Preview
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-[#5D635F] truncate">
                      @{activeUsername}
                    </p>
                  </div>

                  <Link
                    href={`/profile/${encodeURIComponent(activeUsername)}`}
                    role="menuitem"
                    onClick={() => setAvatarMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#282B2A] hover:bg-[#EFECE2]/85 hover:text-[#203B35] transition-colors ${FOCUS_RING}`}
                  >
                    <User className="h-4 w-4 text-[#5D635F]" />
                    <span>View My Profile</span>
                  </Link>

                  <Link
                    href={`/profile/${encodeURIComponent(activeUsername)}`}
                    role="menuitem"
                    onClick={() => setAvatarMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#282B2A] hover:bg-[#EFECE2]/85 hover:text-[#203B35] transition-colors ${FOCUS_RING}`}
                  >
                    <PencilLine className="h-4 w-4 text-[#5D635F]" />
                    <span>Edit Profile</span>
                  </Link>

                  <Link
                    href="/settings/profile"
                    role="menuitem"
                    onClick={() => setAvatarMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#282B2A] hover:bg-[#EFECE2]/85 hover:text-[#203B35] transition-colors ${FOCUS_RING}`}
                  >
                    <Settings className="h-4 w-4 text-[#5D635F]" />
                    <span>Account Settings</span>
                  </Link>

                  <div className="my-1.5 border-t border-[#203B35]/10" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[#9F311D] hover:bg-[#9F311D]/8 transition-colors ${FOCUS_RING}`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Drawer Trigger (< md) */}
          <button
            type="button"
            onClick={() => {
              setMobileOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="authenticated-mobile-drawer"
            className={`md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#203B35]/15 bg-[#FAF8F3] text-[#203B35] hover:bg-[#EFECE2] transition-colors ${FOCUS_RING}`}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer (< md) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="authenticated-mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-[#203B35]/10 bg-[#F6F3EB]"
          >
            <div className="px-4 sm:px-8 py-5 space-y-5">
              {/* Mobile Identity Card */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <FeedAvatar
                    avatarUrl={activeAvatarUrl}
                    initials={activeInitials}
                    tone="#203B35"
                    accent="#C8BDE0"
                    name={activeDisplayName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[#203B35] truncate">
                      {activeDisplayName}
                    </p>
                    <p className="font-mono text-[11px] text-[#5D635F] truncate">
                      @{activeUsername}
                    </p>
                  </div>
                </div>
                {onCreatePost && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      onCreatePost();
                    }}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-3.5 py-2 text-[12.5px] font-medium text-[#F6F3EB] ${FOCUS_RING}`}
                  >
                    <Plus className="h-3.5 w-3.5 text-[#9DB5A5]" />
                    <span>New Post</span>
                  </button>
                )}
              </div>

              {/* Primary Routes */}
              <nav aria-label="Mobile workspace links" className="grid grid-cols-2 gap-2">
                {navLinks.map((item) => {
                  const isActive = currentActiveKey === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`rounded-xl border px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${FOCUS_RING} ${
                        isActive
                          ? "border-[#203B35] bg-[#203B35] text-[#F6F3EB]"
                          : "border-[#203B35]/12 bg-[#FAF8F3] text-[#282B2A] hover:border-[#203B35]/30"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Profile & Account Actions */}
              <div className="space-y-1 border-t border-[#203B35]/10 pt-3">
                <Link
                  href={`/profile/${encodeURIComponent(activeUsername)}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium text-[#282B2A] hover:bg-[#EFECE2]/75"
                >
                  <User className="h-4 w-4 text-[#5D635F]" />
                  <span>View My Profile</span>
                </Link>
                <Link
                  href={`/profile/${encodeURIComponent(activeUsername)}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium text-[#282B2A] hover:bg-[#EFECE2]/75"
                >
                  <PencilLine className="h-4 w-4 text-[#5D635F]" />
                  <span>Edit Profile</span>
                </Link>
                <Link
                  href="/settings/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium text-[#282B2A] hover:bg-[#EFECE2]/75"
                >
                  <Settings className="h-4 w-4 text-[#5D635F]" />
                  <span>Account Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] font-medium text-[#9F311D] hover:bg-[#9F311D]/8"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
