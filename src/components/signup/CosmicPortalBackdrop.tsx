"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface CelestialParticle {
  id: number;
  x: string;
  y: string;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
  tone: string;
  desktopOnly?: boolean;
}

const PORTAL_PARTICLES: CelestialParticle[] = [
  { id: 1, x: "4%", y: "12%", size: 3, opacity: 0.45, delay: 0.2, duration: 5.0, tone: "#9DB5A5", desktopOnly: true },
  { id: 2, x: "48%", y: "10%", size: 3.5, opacity: 0.55, delay: 1.0, duration: 4.4, tone: "#C8BDE0", desktopOnly: true },
  { id: 3, x: "94%", y: "14%", size: 3, opacity: 0.4, delay: 1.8, duration: 5.6, tone: "#9DB5A5" },
  { id: 4, x: "3%", y: "62%", size: 2.5, opacity: 0.35, delay: 0.6, duration: 6.0, tone: "#203B35", desktopOnly: true },
  { id: 5, x: "52%", y: "88%", size: 3.5, opacity: 0.5, delay: 2.1, duration: 4.8, tone: "#C8BDE0", desktopOnly: true },
  { id: 6, x: "95%", y: "76%", size: 3, opacity: 0.4, delay: 1.3, duration: 5.2, tone: "#9DB5A5", desktopOnly: true },
  { id: 7, x: "18%", y: "92%", size: 2.5, opacity: 0.35, delay: 2.4, duration: 5.4, tone: "#203B35", desktopOnly: true },
];

/**
 * Dimensional Cosmic Portal background tailored to the CreativeSpace landing palette.
 * Anchors a serene organic circular threshold behind the editorial showcase on desktop
 * and simplifies gracefully into a compact atmospheric halo on tablet and mobile.
 */
export function CosmicPortalBackdrop() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Subtle fine paper grain matching editorial landing aesthetic */}
      <div className="editorial-grain absolute inset-0 opacity-60" />

      {/* Soft diffuse atmospheric glows (Sage & Lavender, zero harsh edges) */}
      <div className="absolute -top-32 left-[-8%] h-[520px] w-[520px] rounded-full bg-[#9DB5A5]/20 blur-[120px]" />
      <div className="absolute top-[12%] left-[22%] h-[580px] w-[580px] rounded-full bg-[#C8BDE0]/22 blur-[130px]" />
      <div className="hidden md:block absolute -bottom-36 right-[-4%] h-[500px] w-[500px] rounded-full bg-[#9DB5A5]/16 blur-[120px]" />

      {/* Primary Organic Cosmic Portal Composition */}
      <div className="absolute top-[18%] sm:top-[22%] lg:top-[52%] left-1/2 lg:left-[31%] -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] sm:w-[780px] sm:h-[780px] lg:w-[980px] lg:h-[980px] flex items-center justify-center">
        {/* Soft breathing inner portal light */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.03, 1],
                  opacity: [0.78, 0.96, 0.78],
                }
          }
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-[10%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 48%, rgba(250, 248, 243, 0.88) 0%, rgba(200, 189, 224, 0.16) 38%, rgba(157, 181, 165, 0.15) 62%, rgba(246, 243, 235, 0) 76%)",
          }}
        />

        {/* Overlapping organic translucent portal layers (no hard borders slicing content) */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  rotate: [0, 8, 0],
                  scale: [1, 1.015, 1],
                }
          }
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="hidden sm:block absolute inset-[16%] rounded-[54%_46%_48%_52%_/_46%_52%_48%_54%] opacity-75"
          style={{
            background:
              "radial-gradient(circle at 38% 36%, rgba(157, 181, 165, 0.14), rgba(200, 189, 224, 0.08) 56%, transparent 78%)",
            boxShadow: "inset 0 0 60px rgba(32, 59, 53, 0.04)",
          }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  rotate: [0, -10, 0],
                  scale: [1.01, 0.985, 1.01],
                }
          }
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          className="hidden lg:block absolute inset-[21%] rounded-[44%_56%_52%_48%_/_54%_44%_56%_46%] opacity-80"
          style={{
            background:
              "radial-gradient(circle at 64% 62%, rgba(200, 189, 224, 0.15), rgba(250, 248, 243, 0.28) 54%, transparent 76%)",
            boxShadow: "inset 0 1px 40px rgba(157, 181, 165, 0.12)",
          }}
        />

        {/* Architectural Orbital & Portal Threshold Geometry */}
        <motion.svg
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full opacity-85"
          animate={shouldReduceMotion ? undefined : { rotate: 360 }}
          transition={{
            duration: 180,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <defs>
            <radialGradient id="cosmicPortalAperture" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FAF8F3" stopOpacity="0.86" />
              <stop offset="48%" stopColor="#EFECE2" stopOpacity="0.32" />
              <stop offset="76%" stopColor="#9DB5A5" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#C8BDE0" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="cosmicOrbitStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#203B35" stopOpacity="0.24" />
              <stop offset="48%" stopColor="#9DB5A5" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#C8BDE0" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Soft central portal glow aperture */}
          <circle cx="500" cy="500" r="285" fill="url(#cosmicPortalAperture)" />

          {/* Outer hairline horizon ring */}
          <circle
            cx="500"
            cy="500"
            r="448"
            stroke="#203B35"
            strokeOpacity="0.07"
            strokeWidth="1"
          />

          {/* Secondary celestial dashed orbit */}
          <circle
            cx="500"
            cy="500"
            r="392"
            stroke="#9DB5A5"
            strokeOpacity="0.36"
            strokeWidth="1.15"
            strokeDasharray="4 9"
          />

          {/* Sweeping tilted orbital ellipse echoing CreativeSpaceMark */}
          <ellipse
            cx="500"
            cy="500"
            rx="420"
            ry="248"
            transform="rotate(-24 500 500)"
            stroke="url(#cosmicOrbitStroke)"
            strokeWidth="1.25"
          />

          {/* Subtle counter-ellipse */}
          <ellipse
            cx="500"
            cy="500"
            rx="344"
            ry="210"
            transform="rotate(28 500 500)"
            stroke="#C8BDE0"
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="10 10 2 10"
          />

          {/* Inner portal ring */}
          <circle
            cx="500"
            cy="500"
            r="272"
            stroke="#203B35"
            strokeOpacity="0.12"
            strokeWidth="1"
          />

          {/* Minimal orbital node markers */}
          <circle cx="500" cy="108" r="3.5" fill="#C8BDE0" fillOpacity="0.85" />
          <circle cx="892" cy="500" r="3" fill="#9DB5A5" fillOpacity="0.75" />
          <circle cx="176" cy="705" r="2.8" fill="#203B35" fillOpacity="0.3" />
        </motion.svg>
      </div>

      {/* Perimeter Celestial Particles & Star Glints (kept clear of typography zones) */}
      <div className="absolute inset-0">
        {PORTAL_PARTICLES.map((particle) => (
          <motion.span
            key={particle.id}
            className={`absolute rounded-full ${particle.desktopOnly ? "hidden lg:block" : ""}`}
            style={{
              left: particle.x,
              top: particle.y,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.tone,
            }}
            animate={
              shouldReduceMotion
                ? { opacity: particle.opacity * 0.7 }
                : {
                    opacity: [particle.opacity * 0.35, particle.opacity, particle.opacity * 0.35],
                    scale: [0.9, 1.25, 0.9],
                  }
            }
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Restrained 4-point celestial glints in outer breathing margins */}
        <motion.div
          animate={shouldReduceMotion ? undefined : { opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:block absolute top-[14%] left-[44%]"
        >
          <CelestialSpark className="h-3.5 w-3.5 text-[#C8BDE0]" />
        </motion.div>

        <motion.div
          animate={shouldReduceMotion ? undefined : { opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 7.5, delay: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="hidden lg:block absolute bottom-[14%] left-[4%]"
        >
          <CelestialSpark className="h-4 w-4 text-[#9DB5A5]" />
        </motion.div>

        <motion.div
          animate={shouldReduceMotion ? undefined : { opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 8, delay: 2, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:block absolute top-[16%] right-[4%]"
        >
          <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
        </motion.div>
      </div>
    </div>
  );
}
