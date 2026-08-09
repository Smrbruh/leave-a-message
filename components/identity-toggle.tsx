"use client";

import { motion } from "framer-motion";
import { EyeOff, UserRound } from "lucide-react";
import type { MessageMode } from "@/types/message";
import { cn } from "@/lib/utils";

interface IdentityToggleProps {
  mode: MessageMode;
  onChange: (mode: MessageMode) => void;
}

const OPTIONS: { value: MessageMode; label: string; icon: typeof EyeOff }[] = [
  { value: "anonymous", label: "Anonymous", icon: EyeOff },
  { value: "identified", label: "With my name", icon: UserRound },
];

export function IdentityToggle({ mode, onChange }: IdentityToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Message identity"
      className="relative inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas p-1"
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === mode;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
              isActive ? "text-on-seal" : "text-ink-muted hover:text-ink"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="identity-pill"
                className="absolute inset-0 -z-10 rounded-full bg-seal"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
