"use client";

import { motion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";

interface SuccessStateProps {
  onReset: () => void;
}

export function SuccessState({ onReset }: SuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-10"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-seal/40 text-seal"
      >
        <Check className="h-6 w-6" strokeWidth={1.75} />
      </motion.div>

      <div className="space-y-1.5">
        <h2 className="font-serif text-2xl text-ink">Message sent.</h2>
        <p className="text-sm text-ink-muted">It&rsquo;s on its way.</p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-control border border-hairline px-4 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:border-ink-faint hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
        Send another
      </button>
    </motion.div>
  );
}
