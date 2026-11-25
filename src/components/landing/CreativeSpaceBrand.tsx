import React from "react";

interface BrandProps {
  variant?: "dark" | "light";
  showSubmark?: boolean;
}

/**
 * Custom CreativeSpace editorial + subtle cosmic emblem:
 * an architectural atelier frame intersected by a fine orbital arc
 * and a delicate celestial glint.
 */
export function CreativeSpaceMark({
  className = "h-8 w-8",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const strokePrimary = variant === "dark" ? "#203B35" : "#F6F3EB";
  const strokeOrbit = variant === "dark" ? "#9DB5A5" : "#9DB5A5";
  const accentFill = variant === "dark" ? "#C8BDE0" : "#C8BDE0";

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Subtle orbital ring */}
      <ellipse
        cx="18"
        cy="18"
        rx="15"
        ry="7.5"
        transform="rotate(-28 18 18)"
        stroke={strokeOrbit}
        strokeWidth="1.25"
      />
      {/* Editorial gallery frame */}
      <rect
        x="8.5"
        y="7.5"
        width="19"
        height="21"
        rx="3.5"
        stroke={strokePrimary}
        strokeWidth="1.6"
      />
      {/* Inner serene arch */}
      <path
        d="M13.5 24V17.5C13.5 15.0147 15.5147 13 18 13C20.4853 13 22.5 15.0147 22.5 17.5V24"
        stroke={strokePrimary}
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      {/* Subtle cosmic star dot */}
      <circle cx="28.5" cy="9" r="2.1" fill={accentFill} />
    </svg>
  );
}

export function CreativeSpaceWordmark({ variant = "dark" }: BrandProps) {
  const primaryText = variant === "dark" ? "text-[#203B35]" : "text-[#F6F3EB]";
  const accentText = variant === "dark" ? "text-[#203B35]" : "text-[#9DB5A5]";

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <CreativeSpaceMark className="h-8 w-8 shrink-0" variant={variant} />
      <span className={`text-[17px] font-semibold tracking-[-0.02em] ${primaryText}`}>
        Creative
        <span className={`font-serif italic font-normal text-[21px] ml-0.5 ${accentText}`}>
          Space
        </span>
      </span>
    </span>
  );
}

/** Delicate 4-point celestial star ornament for editorial labels */
export function CelestialSpark({
  className = "h-3.5 w-3.5",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 1C8.35 5.1 10.9 7.65 15 8C10.9 8.35 8.35 10.9 8 15C7.65 10.9 5.1 8.35 1 8C5.1 7.65 7.65 5.1 8 1Z"
        fill={color}
      />
    </svg>
  );
}

/** Refined creator avatar badge with subtle botanical-studio gradient */
export function CreatorAvatar({
  initials,
  tone = "#203B35",
  accent = "#9DB5A5",
  name,
  size = "sm",
}: {
  initials: string;
  tone?: string;
  accent?: string;
  name: string;
  size?: "xs" | "sm" | "md";
}) {
  const sizeClass =
    size === "xs"
      ? "h-6 w-6 text-[10px]"
      : size === "md"
      ? "h-10 w-10 text-xs"
      : "h-7 w-7 text-[11px]";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-medium tracking-tight text-[#F6F3EB] overflow-hidden ring-1 ring-[#203B35]/10 ${sizeClass}`}
      style={{
        background: `radial-gradient(circle at 28% 25%, ${accent}55, ${tone} 72%)`,
      }}
      aria-label={name}
      title={name}
    >
      <span className="relative z-10">{initials}</span>
    </span>
  );
}
