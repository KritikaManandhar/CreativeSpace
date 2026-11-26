import {
  Github,
  Globe,
  Instagram,
  Link2,
  Palette,
  Twitter,
} from "lucide-react";

export function getSocialIcon(key: string) {
  const lower = key.toLowerCase();
  if (lower === "website") return Globe;
  if (lower === "instagram") return Instagram;
  if (lower === "twitter" || lower === "x") return Twitter;
  if (lower === "github") return Github;
  if (lower === "behance" || lower === "dribbble") return Palette;
  return Link2;
}

export function formatReadableUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const cleanHost = parsed.hostname.replace(/^www\./, "");
    const cleanPath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${cleanHost}${cleanPath}`;
  } catch {
    return url;
  }
}
