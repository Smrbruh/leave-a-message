import { z } from "zod";

/**
 * This is NOT a UX character limit — the composer never shows a counter
 * and never truncates what someone writes. It's a server-side abuse
 * guard so a malicious client can't POST megabytes of text. It's set
 * generously high; a real message, however long, will never come close.
 */
export const MAX_MESSAGE_LENGTH = 20_000;
export const MAX_NAME_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 320;

/** Hard cap on the raw request body, checked before JSON parsing. */
export const MAX_REQUEST_BYTES = 100_000;

export const messageSchema = z
  .object({
    mode: z.enum(["anonymous", "identified"]),
    message: z
      .string()
      .trim()
      .min(1, "Write something before sending.")
      .max(MAX_MESSAGE_LENGTH, "That message is too long to send."),
    name: z
      .string()
      .trim()
      .max(MAX_NAME_LENGTH, "That name is too long.")
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .max(MAX_EMAIL_LENGTH, "That email is too long.")
      .refine((val) => val === "" || z.string().email().safeParse(val).success, {
        message: "That doesn't look like a valid email.",
      })
      .optional()
      .or(z.literal("")),
    // Honeypot — real visitors never see or fill this field.
    company: z.string().max(200).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "identified" && (!data.name || data.name.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A name is required when sending with your name.",
        path: ["name"],
      });
    }
  });

export type ValidatedMessage = z.infer<typeof messageSchema>;
