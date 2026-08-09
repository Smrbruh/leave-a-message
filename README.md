# Leave a message

A small, private, premium personal messaging page. A visitor writes a
note, chooses to send it anonymously or with their name, and it lands
directly in your Telegram — no accounts, no database, nothing stored.

```
Visitor → Next.js frontend → /api/message → Telegram Bot API → your Telegram
```

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS. No database,
no auth, no external backend — the only server-side piece is a single
API route that talks to the Telegram Bot API.

## 1. Create a Telegram bot

1. Open a chat with [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/newbot` and follow the prompts. You'll get a **bot token**
   that looks like `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
3. Find your **chat ID** — the simplest way is to message
   [@userinfobot](https://t.me/userinfobot) and copy the numeric ID it
   replies with. (If you'd rather receive messages in a group or
   channel, use that chat's ID instead, and make sure your bot is a
   member/admin there.)
4. Send your new bot a message directly (e.g. `/start`) so Telegram
   allows it to message you back.

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

```bash
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

The `NEXT_PUBLIC_*` variables are optional — they control the name and
copy shown on the page. Sensible defaults are used if you leave them
blank; see `lib/config.ts`.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build locally
```

## 4. Deploy to Vercel

1. Push this project to a GitHub repository.
2. Import it in [Vercel](https://vercel.com/new).
3. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (and any
   `NEXT_PUBLIC_*` vars you want) under **Project → Settings →
   Environment Variables**.
4. Deploy. No build configuration, database, or extra services needed.

## How messages are handled

- The composer has **no character limit and no counter** — visitors
  can write as much as they want.
- On submit, the message is validated server-side and forwarded to
  Telegram as plain text (no Markdown/HTML parse mode), so nothing
  needs to be escaped and every character — emoji, RTL text, math
  symbols, mixed scripts — arrives exactly as written.
- Telegram caps a single message at 4096 characters. If a submission
  is longer, `lib/telegram-chunk.ts` splits it into ordered parts at
  paragraph, then line, then word boundaries — never mid-character —
  and `lib/telegram.ts` sends them in order, labelled `Part 1/3`,
  `Part 2/3`, etc. Nothing is truncated or lost.
- Nothing is written to a database or file. If the request succeeds,
  the message existed only in memory for the duration of the request.

## Verifying the chunking logic

```bash
npm run verify
```

Runs `scripts/verify-chunking.ts`, a small standalone check that the
Unicode-safe splitter and Telegram formatter behave correctly: chunks
always reconstruct the original text exactly, surrogate pairs (emoji)
are never split, and every assembled Telegram message stays under the
4096-character limit even for very large, multi-script input.

## Abuse protection

Since this is a public endpoint, `app/api/message/route.ts` layers a
few lightweight, dependency-free guards — none of which impose a
character limit on legitimate messages:

- A hidden **honeypot field**; bots that fill it get a silent fake
  success and nothing is sent.
- A **request size cap** (`MAX_REQUEST_BYTES` in `lib/validation.ts`),
  checked before the body is even parsed.
- A generous **server-side length cap** (`MAX_MESSAGE_LENGTH`, 20,000
  characters) purely as an abuse guard — the UI never shows or enforces
  this, and a genuine message will never come close to it.
- A simple in-memory **rate limiter** and **duplicate-submission
  guard** per client IP (`lib/rate-limit.ts`).

This in-memory protection is intentionally lightweight (no Redis/DB,
per the brief) and resets on server cold starts — a reasonable
trade-off for a single-person inbox. If you expect heavy traffic, swap
`lib/rate-limit.ts` for an edge-friendly store like Upstash Redis
behind the same two functions.

## Project structure

```
app/
  page.tsx                 Homepage
  layout.tsx                Fonts, metadata, theme provider
  globals.css               Design tokens (light + dark)
  icon.svg                  Favicon
  api/message/route.ts      Validates + forwards to Telegram

components/
  message-composer.tsx      The composer: textarea, modes, submit flow
  identity-toggle.tsx        Anonymous / With my name switch
  send-button.tsx           The circular "seal" send button
  success-state.tsx
  error-state.tsx
  theme-toggle.tsx
  theme-provider.tsx

lib/
  telegram.ts                Message formatting + Telegram delivery
  telegram-chunk.ts          Unicode-safe long-message splitting
  validation.ts              zod schema, length/size constants
  rate-limit.ts              In-memory rate limit + de-dupe
  config.ts                  Site identity (name, headline, copy)
  utils.ts

types/
  message.ts
```

## Design

The visual identity takes its underlying principles — restrained type
weights, generous whitespace, a single accent color, quiet motion —
from the provided Superhuman-inspired design reference, reinterpreted
into an original system built around one idea: a private note, sealed
and sent. A serif display face pairs with a quiet sans body face; the
only accent color is a deep wine-red used sparingly for the circular
send button, focus states, and small emphasis. Full light and dark
themes are defined as CSS variables in `app/globals.css`.
