import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        atelier: {
          bg: "#0C0B0A",
          surface: "#151311",
          elevated: "#1E1B18",
          card: "#181513",
          ink: "#F5F0E8",
          muted: "#A89F94",
          subtle: "#756D64",
          ochre: "#E5A93C",
          sage: "#4E9F76",
        },
        editorial: {
          cream: "#F6F3EB",
          linen: "#EFECE2",
          paper: "#FAF8F3",
          forest: "#203B35",
          forestDark: "#162A26",
          sage: "#9DB5A5",
          lavender: "#C8BDE0",
          charcoal: "#282B2A",
          muted: "#92958F",
        },
        brand: {
          50: "#fff4f0",
          100: "#ffe5dc",
          200: "#ffc6b3",
          300: "#ff9e7f",
          400: "#f47652",
          500: "#e85d3f",
          600: "#d14628",
          700: "#ae361c",
          800: "#8e2e1a",
          900: "#74291a",
          950: "#3f1108",
        },
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-soft": "pulse-soft 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
