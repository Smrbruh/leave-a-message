"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors duration-200 hover:text-ink hover:border-ink-faint",
        className
      )}
    >
      <span className="relative block h-4 w-4">
        <Sun
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300 ease-out",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
          strokeWidth={1.75}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300 ease-out",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
          strokeWidth={1.75}
        />
      </span>
    </button>
  );
}
