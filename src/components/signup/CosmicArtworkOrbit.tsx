"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Compass } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

export interface CosmicArtwork {
  id: string;
  discipline: string;
  shortDiscipline: string;
  title: string;
  creator: string;
  handle: string;
  imageSrc: string;
  imageAlt: string;
  plate: string;
  aspect: string;
  width: number;
  height: number;
}

export const COSMIC_ARTWORKS: CosmicArtwork[] = [
  {
    id: "artwork-illustration",
    discipline: "Digital Illustration",
    shortDiscipline: "Illustration",
    title: "Nocturne Flora & Orbit",
    creator: "Anya Sharma",
    handle: "@anya_art",
    imageSrc: "/images/landing/artwork-illustration.jpg",
    imageAlt: "Gouache and ink botanical illustration with crescent moon and sage orbital arcs",
    plate: "FIG. 01",
    aspect: "aspect-[3/4]",
    width: 600,
    height: 800,
  },
  {
    id: "artwork-photography",
    discipline: "Photography",
    shortDiscipline: "Photography",
    title: "Travertine Court",
    creator: "Kenji Sato",
    handle: "@kenji_film",
    imageSrc: "/images/landing/artwork-photography.jpg",
    imageAlt: "Fine-art architectural photograph of sunlit travertine arches over reflecting pool",
    plate: "FIG. 02",
    aspect: "aspect-[4/3]",
    width: 800,
    height: 600,
  },
  {
    id: "artwork-graphic",
    discipline: "Graphic Design",
    shortDiscipline: "Graphic Design",
    title: "Solstice Biennial Print",
    creator: "Elena Rostova",
    handle: "@elena_type",
    imageSrc: "/images/landing/artwork-graphic-design.jpg",
    imageAlt: "Swiss-editorial exhibition poster with deep green arches and sage circles",
    plate: "FIG. 03",
    aspect: "aspect-[4/5]",
    width: 640,
    height: 800,
  },
  {
    id: "artwork-uiux",
    discipline: "UI/UX Design",
    shortDiscipline: "UI/UX",
    title: "Loom Tactile Interface",
    creator: "Mateo Silva",
    handle: "@mateo_ux",
    imageSrc: "/images/landing/artwork-uiux.jpg",
    imageAlt: "Minimalist editorial tablet interface displayed on travertine stone",
    plate: "FIG. 04",
    aspect: "aspect-[4/3]",
    width: 800,
    height: 600,
  },
  {
    id: "artwork-digital",
    discipline: "Digital Art",
    shortDiscipline: "Digital Art",
    title: "Celadon Vessels in Glass",
    creator: "Amara Okafor",
    handle: "@amara_3d",
    imageSrc: "/images/landing/artwork-digital-art.jpg",
    imageAlt: "3D digital sculpture of matte sage arches, obsidian stone, and lavender orb",
    plate: "FIG. 05",
    aspect: "aspect-square",
    width: 700,
    height: 700,
  },
];

/**
 * Desktop composition: 5 artworks arranged in an artistic orbital formation
 * surrounding the introduction and portal aperture, completely separated from
 * the signup form so inputs are never obstructed.
 */
export function DesktopCosmicOrbit() {
  const shouldReduceMotion = useReducedMotion();
  const [illustration, photography, graphic, uiux, digitalArt] = COSMIC_ARTWORKS;

  return (
    <div className="relative w-full h-[540px] select-none pointer-events-auto">
      {/* Central portal focal constellation line */}
      <svg
        viewBox="0 0 560 540"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 w-full h-full text-[#9DB5A5]"
        aria-hidden="true"
      >
        <path
          d="M 110 90 Q 280 200 450 140 T 360 440"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1.2"
          strokeDasharray="3 6"
        />
        <circle cx="110" cy="90" r="3" fill="#203B35" fillOpacity="0.4" />
        <circle cx="450" cy="140" r="3" fill="#C8BDE0" fillOpacity="0.8" />
        <circle cx="360" cy="440" r="3" fill="#9DB5A5" fillOpacity="0.6" />
      </svg>

      {/* 1. Digital Illustration (Top Left - Portrait 3:4) */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -6, 0],
              }
        }
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-2 left-0 w-[175px] rounded-2xl bg-[#FAF8F3] p-2 border border-[#203B35]/12 shadow-[0_16px_36px_-10px_rgba(32,59,53,0.12)] hover:scale-[1.03] transition-transform duration-300 group"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#203B35]/5">
          <Image
            src={illustration.imageSrc}
            alt={illustration.imageAlt}
            fill
            sizes="180px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FAF8F3]/90 backdrop-blur-xs text-[9px] font-mono font-semibold uppercase tracking-wider text-[#203B35]">
            {illustration.plate}
          </div>
        </div>
        <div className="pt-2 px-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#9DB5A5]">
            {illustration.discipline}
          </p>
          <p className="text-[12px] font-serif font-normal text-[#203B35] truncate leading-tight mt-0.5">
            {illustration.title}
          </p>
          <p className="text-[10.5px] text-[#282B2A]/60 truncate mt-0.5">
            by {illustration.creator}
          </p>
        </div>
      </motion.div>

      {/* 2. Graphic Design (Top Right - Portrait 4:5) */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, 8, 0],
              }
        }
        transition={{
          duration: 8.5,
          delay: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 right-4 w-[165px] rounded-2xl bg-[#FAF8F3] p-2 border border-[#203B35]/12 shadow-[0_16px_36px_-10px_rgba(32,59,53,0.12)] hover:scale-[1.03] transition-transform duration-300 group"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#203B35]/5">
          <Image
            src={graphic.imageSrc}
            alt={graphic.imageAlt}
            fill
            sizes="170px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FAF8F3]/90 backdrop-blur-xs text-[9px] font-mono font-semibold uppercase tracking-wider text-[#203B35]">
            {graphic.plate}
          </div>
        </div>
        <div className="pt-2 px-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#9DB5A5]">
            {graphic.discipline}
          </p>
          <p className="text-[12px] font-serif font-normal text-[#203B35] truncate leading-tight mt-0.5">
            {graphic.title}
          </p>
          <p className="text-[10.5px] text-[#282B2A]/60 truncate mt-0.5">
            by {graphic.creator}
          </p>
        </div>
      </motion.div>

      {/* 3. Photography (Center / Mid - Landscape 4:3) */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -7, 0],
              }
        }
        transition={{
          duration: 9,
          delay: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[200px] left-[130px] w-[190px] rounded-2xl bg-[#FAF8F3] p-2 border border-[#203B35]/12 shadow-[0_18px_40px_-12px_rgba(32,59,53,0.14)] hover:scale-[1.03] transition-transform duration-300 group z-10"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#203B35]/5">
          <Image
            src={photography.imageSrc}
            alt={photography.imageAlt}
            fill
            sizes="200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FAF8F3]/90 backdrop-blur-xs text-[9px] font-mono font-semibold uppercase tracking-wider text-[#203B35]">
            {photography.plate}
          </div>
        </div>
        <div className="pt-2 px-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#9DB5A5]">
            {photography.discipline}
          </p>
          <p className="text-[12px] font-serif font-normal text-[#203B35] truncate leading-tight mt-0.5">
            {photography.title}
          </p>
          <p className="text-[10.5px] text-[#282B2A]/60 truncate mt-0.5">
            by {photography.creator}
          </p>
        </div>
      </motion.div>

      {/* 4. UI/UX Design (Bottom Left - Landscape 4:3) */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, 6, 0],
              }
        }
        transition={{
          duration: 7.8,
          delay: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-2 left-6 w-[175px] rounded-2xl bg-[#FAF8F3] p-2 border border-[#203B35]/12 shadow-[0_16px_36px_-10px_rgba(32,59,53,0.12)] hover:scale-[1.03] transition-transform duration-300 group"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#203B35]/5">
          <Image
            src={uiux.imageSrc}
            alt={uiux.imageAlt}
            fill
            sizes="180px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FAF8F3]/90 backdrop-blur-xs text-[9px] font-mono font-semibold uppercase tracking-wider text-[#203B35]">
            {uiux.plate}
          </div>
        </div>
        <div className="pt-2 px-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#9DB5A5]">
            {uiux.discipline}
          </p>
          <p className="text-[12px] font-serif font-normal text-[#203B35] truncate leading-tight mt-0.5">
            {uiux.title}
          </p>
          <p className="text-[10.5px] text-[#282B2A]/60 truncate mt-0.5">
            by {uiux.creator}
          </p>
        </div>
      </motion.div>

      {/* 5. Digital Art (Bottom Right - Square 1:1) */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -5, 0],
              }
        }
        transition={{
          duration: 8,
          delay: 1.0,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 right-6 w-[165px] rounded-2xl bg-[#FAF8F3] p-2 border border-[#203B35]/12 shadow-[0_16px_36px_-10px_rgba(32,59,53,0.12)] hover:scale-[1.03] transition-transform duration-300 group"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#203B35]/5">
          <Image
            src={digitalArt.imageSrc}
            alt={digitalArt.imageAlt}
            fill
            sizes="170px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FAF8F3]/90 backdrop-blur-xs text-[9px] font-mono font-semibold uppercase tracking-wider text-[#203B35]">
            {digitalArt.plate}
          </div>
        </div>
        <div className="pt-2 px-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#9DB5A5]">
            {digitalArt.discipline}
          </p>
          <p className="text-[12px] font-serif font-normal text-[#203B35] truncate leading-tight mt-0.5">
            {digitalArt.title}
          </p>
          <p className="text-[10.5px] text-[#282B2A]/60 truncate mt-0.5">
            by {digitalArt.creator}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Tablet & Mobile compact composition:
 * A clean, elegant horizontal gallery strip showcasing all 5 disciplines
 * with different aspect ratios, museum plates, and creator credits.
 */
export function CompactCosmicShowcase() {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9DB5A5]">
          Exhibited Disciplines (5)
        </span>
        <span className="text-[11px] font-mono text-[#92958F]">
          Curated Studio Orbit
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {COSMIC_ARTWORKS.slice(0, 3).map((work) => (
          <div
            key={work.id}
            className="group rounded-2xl bg-[#FAF8F3] p-2 border border-[#203B35]/10 shadow-sm"
          >
            <div className={`relative ${work.aspect} w-full overflow-hidden rounded-xl bg-[#203B35]/5`}>
              <Image
                src={work.imageSrc}
                alt={work.imageAlt}
                fill
                sizes="(max-width: 640px) 45vw, 30vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#FAF8F3]/90 backdrop-blur-xs text-[8px] font-mono font-semibold uppercase tracking-wider text-[#203B35]">
                {work.plate}
              </div>
            </div>
            <div className="pt-1.5 px-0.5">
              <p className="text-[9px] font-mono uppercase tracking-wider text-[#9DB5A5]">
                {work.shortDiscipline}
              </p>
              <p className="text-[11px] font-serif font-normal text-[#203B35] truncate leading-tight">
                {work.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
