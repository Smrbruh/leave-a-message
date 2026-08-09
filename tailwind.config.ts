import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",
        "ink-faint": "rgb(var(--ink-faint) / <alpha-value>)",
        hairline: "rgb(var(--hairline) / <alpha-value>)",
        seal: "rgb(var(--seal) / <alpha-value>)",
        "seal-deep": "rgb(var(--seal-deep) / <alpha-value>)",
        "on-seal": "rgb(var(--on-seal) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        headline: ["clamp(2.1rem, 5vw, 3.25rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        card: "1.5rem",
        control: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 20px 45px -20px rgb(0 0 0 / 0.25)",
        seal: "0 8px 20px -6px rgb(var(--seal) / 0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ripple: {
          "0%": { transform: "scale(0.4)", opacity: "0.55" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        ripple: "ripple 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
