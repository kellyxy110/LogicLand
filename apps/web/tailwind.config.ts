import type { Config } from "tailwindcss";

// Design tokens mirror docs/branding.md. Warm, magical, professional — not childish.
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6C5CE7", // wonder violet
          soft: "#A29BFE",
        },
        sunburst: "#FFB020", // encouragement gold
        meadow: "#22C55E", // growth green
        sky: "#38BDF8", // curiosity blue
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem", "3xl": "2rem" },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
