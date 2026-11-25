import React from "react";
import Link from "next/link";

interface TemporaryPagePlaceholderProps {
  title: string;
  routeLabel: string;
  description?: string;
  contextItems?: Array<{ label: string; value: string }>;
}

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Feed" },
  { href: "/explore", label: "Explore" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings/profile", label: "Profile Settings" },
  { href: "/login", label: "Sign In" },
];

export function TemporaryPagePlaceholder({
  title,
  routeLabel,
  description = "Internal UI removed for upcoming redesign. Existing routes, permissions, and backend logic remain active.",
  contextItems = [],
}: TemporaryPagePlaceholderProps) {
  return (
    <main className="min-h-screen bg-[#F6F3EB] text-[#282B2A] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl border border-[#282B2A]/15 p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-[#282B2A]/60">
          {routeLabel}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-[#282B2A]">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#282B2A]/75">
          {description}
        </p>

        {contextItems.length > 0 && (
          <dl className="mt-6 space-y-2 border-t border-[#282B2A]/10 pt-4 text-xs font-mono">
            {contextItems.map((item) => (
              <div key={item.label} className="flex justify-between gap-4">
                <dt className="text-[#282B2A]/60">{item.label}</dt>
                <dd className="text-[#282B2A] break-all text-right">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <nav
          aria-label="Temporary route navigation"
          className="mt-8 flex flex-wrap gap-3 border-t border-[#282B2A]/10 pt-5 text-sm"
        >
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#203B35] underline underline-offset-4 hover:opacity-75"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
