"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface Particle {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  opacity: number;
  delay: number;
  duration: number;
}

const CELESTIAL_PARTICLES: Particle[] = [
  { id: 1, x: 12, y: 18, size: 3.5, opacity: 0.6, delay: 0.2, duration: 4.5 },
  { id: 2, x: 26, y: 12, size: 2.5, opacity: 0.45, delay: 1.1, duration: 5.2 },
  { id: 3, x: 44, y: 22, size: 4, opacity: 0.7, delay: 0.7, duration: 3.8 },
  { id: 4, x: 8, y: 48, size: 3, opacity: 0.5, delay: 1.8, duration: 4.2 },
  { id: 5, x: 22, y: 64, size: 2, opacity: 0.4, delay: 2.2, duration: 5.5 },
  { id: 6, x: 38, y: 78, size: 3.5, opacity: 0.65, delay: 0.5, duration: 4.0 },
  { id: 7, x: 58, y: 14, size: 2.5, opacity: 0.4, delay: 1.5, duration: 6.0 },
  { id: 8, x: 72, y: 24, size: 3, opacity: 0.55, delay: 2.0, duration: 4.8 },
  { id: 9, x: 88, y: 18, size: 4, opacity: 0.5, delay: 0.9, duration: 3.6 },
  { id: 10, x: 92, y: 52, size: 2.5, opacity: 0.45, delay: 1.4, duration: 5.0 },
  { id: 11, x: 82, y: 84, size: 3, opacity: 0.6, delay: 2.5, duration: 4.4 },
  { id: 12, x: 48, y: 92, size: 3.5, opacity: 0.5, delay: 0.4, duration: 5.8 },
];

export function CosmicPortalBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Large atmospheric diffuse glows (Warm Sage & Lavender) */}
      <div className="absolute top-[-10%] left-[5%] h-[680px] w-[680px] rounded-full bg-gradient-to-br from-[#9DB5A5]/22 via-[#C8BDE0]/16 to-transparent blur-[120px]" />
      <div className="absolute top-[25%] right-[-5%] h-[620px] w-[620px] rounded-full bg-gradient-to-bl from-[#C8BDE0]/24 via-[#9DB5A5]/18 to-transparent blur-[130px]" />
      <div className="absolute bottom-[-15%] left-[25%] h-[560px] w-[560px] rounded-full bg-[#9DB5A5]/15 blur-[110px]" />

      {/* 2. Central Dimensional Cosmic Portal SVG */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] sm:w-[1060px] lg:w-[1280px] h-[820px] sm:h-[1060px] lg:h-[1280px] flex items-center justify-center opacity-85">
        {/* Slowly breathing outer aura ring */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.025, 1],
                  opacity: [0.75, 0.9, 0.75],
                }
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(200, 189, 224, 0.12) 0%, rgba(157, 181, 165, 0.16) 40%, rgba(246, 243, 235, 0) 72%)",
          }}
        />

        {/* Slow rotating celestial orbital geometry */}
        <motion.svg
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  rotate: [0, 360],
                }
          }
          transition={{
            duration: 160,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <defs>
            {/* Atmospheric gradient for the portal core */}
            <radialGradient id="portalCoreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FAF8F3" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#C8BDE0" stopOpacity="0.16" />
              <stop offset="68%" stopColor="#9DB5A5" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#203B35" stopOpacity="0.04" />
            </radialGradient>

            <linearGradient id="portalArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#203B35" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#9DB5A5" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#C8BDE0" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Outer hairline orbital ring */}
          <circle
            cx="500"
            cy="500"
            r="460"
            stroke="#203B35"
            strokeOpacity="0.08"
            strokeWidth="1"
          />

          {/* Secondary dashed orbit with astronomy ticks */}
          <circle
            cx="500"
            cy="500"
            r="420"
            stroke="#9DB5A5"
            strokeOpacity="0.35"
            strokeWidth="1.2"
            strokeDasharray="4 8"
          />

          {/* Dimensional elliptical ring tilted 24 degrees */}
          <ellipse
            cx="500"
            cy="500"
            rx="410"
            ry="290"
            transform="rotate(-24 500 500)"
            stroke="url(#portalArcGrad)"
            strokeWidth="1.4"
            strokeDasharray="16 12 4 12"
          />

          {/* Counter-elliptical dimensional ring */}
          <ellipse
            cx="500"
            cy="500"
            rx="350"
            ry="250"
            transform="rotate(32 500 500)"
            stroke="#203B35"
            strokeOpacity="0.14"
            strokeWidth="1"
          />

          {/* Mid portal boundary */}
          <circle
            cx="500"
            cy="500"
            r="320"
            stroke="#9DB5A5"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />

          {/* Inner dimensional portal aperture fill */}
          <circle
            cx="500"
            cy="500"
            r="260"
            fill="url(#portalCoreGrad)"
            stroke="#203B35"
            strokeOpacity="0.12"
            strokeWidth="1"
          />

          {/* Delicate cardinal astronomical tick marks */}
          <g stroke="#203B35" strokeOpacity="0.25" strokeWidth="1.2">
            <line x1="500" y1="35" x2="500" y2="55" />
            <line x1="500" y1="945" x2="500" y2="965" />
            <line x1="35" y1="500" x2="55" y2="500" />
            <line x1="945" y1="500" x2="965" y2="500" />
          </g>

          {/* Degree markers along orbital perimeter */}
          <circle cx="500" cy="80" r="3" fill="#203B35" fillOpacity="0.35" />
          <circle cx="850" cy="500" r="3.5" fill="#9DB5A5" fillOpacity="0.6" />
          <circle cx="500" cy="920" r="3" fill="#C8BDE0" fillOpacity="0.7" />
          <circle cx="150" cy="500" r="3.5" fill="#203B35" fillOpacity="0.35" />

          {/* Subtle celestial 4-point star on the primary orbital path */}
          <g transform="translate(780, 260)">
            <path
              d="M0 -12 C0.5 -4 4 -0.5 12 0 C4 0.5 0.5 4 0 12 C-0.5 4 -4 0.5 -12 0 C-4 -0.5 -0.5 -4 0 -12 Z"
              fill="#203B35"
              fillOpacity="0.35"
            />
          </g>
          <g transform="translate(220, 720)">
            <path
              d="M0 -9 C0.4 -3 3 -0.4 9 0 C3 0.4 0.4 3 0 9 C-0.4 3 -3 0.4 -9 0 C-3 -0.4 -0.4 -3 0 -9 Z"
              fill="#9DB5A5"
              fillOpacity="0.75"
            />
          </g>
        </motion.svg>
      </div>

      {/* 3. Subtle translucent organic layered shapes */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -14, 0],
                x: [0, 8, 0],
              }
        }
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[16%] left-[8%] w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] rounded-[48%_52%_62%_38%_/_42%_45%_55%_58%] bg-gradient-to-br from-[#9DB5A5]/12 to-[#C8BDE0]/10 border border-[#9DB5A5]/25 backdrop-blur-[2px]"
      />

      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, 16, 0],
                x: [0, -10, 0],
              }
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[18%] right-[12%] w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-[58%_42%_38%_62%_/_52%_58%_42%_48%] bg-gradient-to-tr from-[#C8BDE0]/14 to-[#9DB5A5]/10 border border-[#C8BDE0]/25 backdrop-blur-[2px]"
      />

      {/* 4. Delicate celestial stars and tiny glowing particles */}
      <div className="absolute inset-0">
        {CELESTIAL_PARTICLES.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-[#203B35]"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    opacity: [particle.opacity * 0.4, particle.opacity, particle.opacity * 0.4],
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

        {/* 4-point star glints in key editorial positions */}
        <div className="absolute top-[22%] left-[18%] opacity-60">
          <CelestialSpark className="h-4 w-4 text-[#9DB5A5]" />
        </div>
        <div className="absolute top-[38%] right-[14%] opacity-55">
          <CelestialSpark className="h-3.5 w-3.5 text-[#C8BDE0]" />
        </div>
        <div className="absolute bottom-[28%] left-[12%] opacity-65">
          <CelestialSpark className="h-4 w-4 text-[#203B35]" />
        </div>
        <div className="absolute top-[14%] right-[32%] opacity-40 hidden sm:block">
          <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
        </div>
      </div>
    </div>
  );
}
