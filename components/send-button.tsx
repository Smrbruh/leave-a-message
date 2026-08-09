"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SendButtonProps {
  disabled?: boolean;
  loading?: boolean;
}

/**
 * The one deliberate flourish on an otherwise quiet page: a circular
 * "seal" button — a nod to a wax-sealed letter — that presses inward
 * and ripples outward on send.
 */
export function SendButton({ disabled, loading }: SendButtonProps) {
  const [rippleKey, setRippleKey] = useState(0);

  return (
    <motion.button
      type="submit"
      disabled={disabled || loading}
      onPointerDown={() => setRippleKey((k) => k + 1)}
      aria-label="Send message"
      whileTap={disabled || loading ? undefined : { scale: 0.92 }}
      className={cn(
        "group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
        disabled
          ? "cursor-not-allowed bg-ink-faint/25 text-ink-faint"
          : "bg-seal text-on-seal shadow-seal hover:bg-seal-deep"
      )}
    >
      {!disabled && (
        <span
          key={rippleKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-seal animate-ripple"
        />
      )}
      <span className="relative">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
        ) : (
          <ArrowUp className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5" strokeWidth={2} />
        )}
      </span>
    </motion.button>
  );
}
