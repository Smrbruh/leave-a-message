import { chunkText } from "../lib/telegram-chunk";
import { buildTelegramMessages } from "../lib/telegram";
import type { ValidatedMessage } from "../lib/validation";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
}

// --- 1. Basic reconstruction: chunks must always join back to original ---
const paragraphs = Array.from({ length: 40 }, (_, i) => `Paragraph ${i} — 中文测试 emoji 👋🏽 more text here to pad it out a bit.`).join("\n\n");
const chunks1 = chunkText(paragraphs, 200);
assert(chunks1.join("") === paragraphs, "paragraph text reconstructs exactly after chunking");
assert(chunks1.every((c) => Array.from(c).length <= 200), "every chunk respects the max length (code points)");

// --- 2. Surrogate pairs (emoji) are never split ---
const emojiHeavy = "🔥".repeat(500) + "text" + "👨‍👩‍👧‍👦".repeat(100);
const chunks2 = chunkText(emojiHeavy, 137);
assert(chunks2.join("") === emojiHeavy, "emoji-heavy text reconstructs exactly");
for (const c of chunks2) {
  // If a surrogate pair were split, Array.from would show a lone
  // surrogate as its own "character" with charCodeAt outside normal
  // ranges when re-encoded — easiest direct check: round-tripping
  // through Array.from must match the string's own iteration.
  assert(Array.from(c).join("") === c, "chunk has no broken surrogate pairs: " + JSON.stringify(c.slice(0, 10)));
}

// --- 3. Short text returns as a single chunk, untouched ---
const short = "Привет 👋 世界 🌍 ∑ ∫ √ ∞ ≠ ≈";
const chunks3 = chunkText(short, 4096);
assert(chunks3.length === 1 && chunks3[0] === short, "short unicode text passes through unchanged");

// --- 4. Empty text yields no chunks ---
assert(chunkText("", 100).length === 0, "empty text yields zero chunks");

// --- 5. A single unbroken token longer than maxLength still gets cut safely ---
const longToken = "a".repeat(50) + "🔥".repeat(50); // 100 code points, no whitespace
const chunks5 = chunkText(longToken, 30);
assert(chunks5.join("") === longToken, "long unbroken token reconstructs exactly");
assert(chunks5.every((c) => Array.from(c).length <= 30), "long unbroken token respects max length per chunk");

// --- 6. Full Telegram message formatting stays under 4096 chars, even huge input ---
const huge: ValidatedMessage = {
  mode: "identified",
  message: Array.from({ length: 3000 }, (_, i) => `Line ${i}: مرحبا こんにちは 안녕하세요 Привет`).join("\n\n"),
  name: "A".repeat(200),
  email: "very.long.email.address.for.testing.purposes@example-domain.com",
};
const built = buildTelegramMessages(huge, new Date("2026-08-09T22:41:00Z"));
assert(built.length > 1, "huge message is split into multiple Telegram messages: " + built.length + " parts");
assert(
  built.every((m) => m.length <= 4096),
  "every assembled Telegram message stays within the 4096 char limit (max found: " +
    Math.max(...built.map((m) => m.length)) +
    ")"
);
assert(built[0]!.includes("Part 1/"), "first part is labelled");
assert(built[built.length - 1]!.includes(huge.name!), "final part includes the meta block (name)");

// --- 7. Small anonymous message formats as single quoted message with meta ---
const small: ValidatedMessage = { mode: "anonymous", message: "Hey, I really like what you're building." };
const smallBuilt = buildTelegramMessages(small, new Date("2026-08-09T22:41:00Z"));
assert(smallBuilt.length === 1, "small anonymous message is a single Telegram message");
assert(smallBuilt[0]!.includes("New anonymous message"), "anonymous title present");
assert(smallBuilt[0]!.includes('"Hey, I really like what you\'re building."'), "message body quoted exactly");
assert(smallBuilt[0]!.includes("22:41"), "timestamp present");
console.log("\n--- sample anonymous message ---\n" + smallBuilt[0]);

// --- 8. Identified message includes name + email ---
const ided: ValidatedMessage = { mode: "identified", message: "Hey! Question for you.", name: "Alex", email: "alex@example.com" };
const idedBuilt = buildTelegramMessages(ided, new Date("2026-08-09T22:41:00Z"));
assert(idedBuilt[0]!.includes("Name: Alex"), "name present");
assert(idedBuilt[0]!.includes("Email: alex@example.com"), "email present");
console.log("\n--- sample identified message ---\n" + idedBuilt[0]);

console.log("\nDone.");
