"use client";

import { motion } from "framer-motion";
import { CircleAlert, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-10"
      role="alert"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-seal/40 text-seal">
        <CircleAlert className="h-6 w-6" strokeWidth={1.75} />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-serif text-2xl text-ink">Something went wrong.</h2>
        <p className="max-w-xs text-sm text-ink-muted">
          {message || "Your message couldn't be delivered. Please try again."}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-control bg-seal px-4 py-2 text-sm font-medium text-on-seal transition-colors duration-200 hover:bg-seal-deep"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
        Try again
      </button>
    </motion.div>
  );
}
