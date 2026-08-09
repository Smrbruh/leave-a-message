import { chunkText } from "@/lib/telegram-chunk";
import type { ValidatedMessage } from "@/lib/validation";

const TELEGRAM_MAX_LEN = 4096;
// Extra breathing room below Telegram's hard limit, on top of the
// precisely-measured header/footer reserve computed per message.
const SAFETY_BUFFER = 40;

export class TelegramDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelegramDeliveryError";
  }
}

function formatTime(date: Date): string {
  // 24-hour, UTC — simple and unambiguous regardless of where the
  // message was sent from.
  return `${date.toISOString().slice(11, 16)} UTC`;
}

function buildTitle(mode: ValidatedMessage["mode"]): string {
  return mode === "anonymous" ? "New anonymous message" : "New message";
}

function buildMetaLines(payload: ValidatedMessage, time: string): string[] {
  if (payload.mode === "anonymous") {
    return ["Anonymous", "Website", time];
  }
  const lines = [`Name: ${payload.name}`];
  if (payload.email) lines.push(`Email: ${payload.email}`);
  lines.push("Website", time);
  return lines;
}

/**
 * Formats a validated submission into one or more plain-text Telegram
 * messages, each guaranteed to fit inside Telegram's 4096-character
 * limit. No markdown parse mode is used, so nothing needs to be escaped
 * and the user's content reaches Telegram completely unmodified.
 */
export function buildTelegramMessages(payload: ValidatedMessage, now: Date = new Date()): string[] {
  const title = buildTitle(payload.mode);
  const time = formatTime(now);
  const metaLines = buildMetaLines(payload, time);
  const metaBlock = metaLines.join("\n");

  // Reserve space for everything that isn't the message body itself:
  // the title, a worst-case "Part 99/99" label, the quote marks used
  // for single-part messages, and the trailing meta block, all bounded
  // because name/email are length-capped by validation.
  const reserve =
    title.length +
    "\nPart 99/99".length +
    2 /* quote marks */ +
    metaBlock.length +
    8 /* surrounding newlines */ +
    SAFETY_BUFFER;

  const chunkMaxLen = Math.max(TELEGRAM_MAX_LEN - reserve, 500);
  const parts = chunkText(payload.message, chunkMaxLen);
  const total = parts.length;

  if (total <= 1) {
    const body = parts[0] ?? payload.message;
    return [`${title}\n\n"${body}"\n\n${metaBlock}`];
  }

  return parts.map((part, index) => {
    const partLabel = `Part ${index + 1}/${total}`;
    const isLast = index === total - 1;
    const footer = isLast ? `\n\n${metaBlock}` : "";
    return `${title}\n${partLabel}\n\n${part}${footer}`;
  });
}

async function sendOne(token: string, chatId: string, text: string): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      disable_notification: false,
    }),
  });

  let data: { ok?: boolean; description?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.ok) {
    throw new TelegramDeliveryError(
      data?.description || `Telegram responded with status ${response.status}`
    );
  }
}

/**
 * Sends every part of a (possibly split) message to Telegram, in order.
 * Parts are sent sequentially, awaiting each response, so they always
 * arrive in the right order even when the original message was split
 * across several Telegram messages.
 */
export async function deliverToTelegram(payload: ValidatedMessage): Promise<{ parts: number }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new TelegramDeliveryError("Telegram is not configured on the server.");
  }

  const messages = buildTelegramMessages(payload);

  for (const text of messages) {
    await sendOne(token, chatId, text);
  }

  return { parts: messages.length };
}
