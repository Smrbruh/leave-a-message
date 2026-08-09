"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IdentityToggle } from "@/components/identity-toggle";
import { SendButton } from "@/components/send-button";
import { SuccessState } from "@/components/success-state";
import { ErrorState } from "@/components/error-state";
import type { MessageMode, SendState } from "@/types/message";

const MIN_TEXTAREA_HEIGHT = 168;
const MAX_TEXTAREA_HEIGHT = 480;

export function MessageComposer() {
  const [mode, setMode] = useState<MessageMode>("anonymous");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<SendState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [nameError, setNameError] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, MIN_TEXTAREA_HEIGHT), MAX_TEXTAREA_HEIGHT);
    el.style.height = `${next}px`;
  }, [message]);

  function resetForm() {
    setMessage("");
    setName("");
    setEmail("");
    setCompany("");
    setNameError(false);
    setErrorMessage(undefined);
    setStatus("idle");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (status === "sending") return;

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) return;

    if (mode === "identified" && name.trim().length === 0) {
      setNameError(true);
      return;
    }
    setNameError(false);

    setStatus("sending");
    setErrorMessage(undefined);

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          message,
          name: mode === "identified" ? name.trim() : undefined,
          email: mode === "identified" ? email.trim() : undefined,
          company,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setStatus("success");
      } else {
        setErrorMessage(data?.error);
        setStatus("error");
      }
    } catch {
      setErrorMessage(undefined);
      setStatus("error");
    }
  }

  const canSend =
    message.trim().length > 0 &&
    (mode === "anonymous" || name.trim().length > 0) &&
    status !== "sending";

  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface shadow-card">
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <SuccessState key="success" onReset={resetForm} />
        ) : status === "error" ? (
          <ErrorState
            key="error"
            message={errorMessage}
            onRetry={() => setStatus("idle")}
          />
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex flex-col"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
              <IdentityToggle mode={mode} onChange={setMode} />
            </div>

            <div className="border-t border-hairline px-5 pb-1 pt-4 sm:px-7">
              <label htmlFor="message" className="sr-only">
                Your message
              </label>
              <textarea
                ref={textareaRef}
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write anything…"
                autoFocus
                dir="auto"
                required
                rows={1}
                className="w-full resize-none bg-transparent font-sans text-[17px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none"
                style={{ minHeight: MIN_TEXTAREA_HEIGHT, maxHeight: MAX_TEXTAREA_HEIGHT }}
              />
            </div>

            <AnimatePresence initial={false}>
              {mode === "identified" && (
                <motion.div
                  key="identity-fields"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-3 px-5 pb-4 pt-2 sm:grid-cols-2 sm:px-7">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-ink-muted">
                        Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (nameError) setNameError(false);
                        }}
                        placeholder="Your name"
                        aria-invalid={nameError}
                        aria-describedby={nameError ? "name-error" : undefined}
                        className="w-full rounded-control border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-seal/40"
                      />
                      {nameError && (
                        <p id="name-error" className="mt-1 text-xs text-seal">
                          A name is required in this mode.
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-muted">
                        Email <span className="text-ink-faint">(optional)</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-control border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-seal/40"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Honeypot — hidden from real visitors, invisible to screen readers. */}
            <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-hairline px-5 py-4 sm:px-7">
              <p className="text-xs text-ink-faint">
                {mode === "anonymous" ? "Your identity won't be shared." : "Only visible to me."}
              </p>
              <SendButton disabled={!canSend} loading={status === "sending"} />
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
