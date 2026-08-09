/**
 * Personal identity shown on the site. Override any of these with
 * environment variables so the code never needs to be touched to
 * re-brand the page for someone else.
 */
export const siteConfig = {
  ownerName: process.env.NEXT_PUBLIC_OWNER_NAME || "Bakdaulet",
  headline: process.env.NEXT_PUBLIC_HEADLINE || "Leave a message.",
  subheading:
    process.env.NEXT_PUBLIC_SUBHEADING ||
    "Anonymous or not — say whatever is on your mind.",
  description:
    process.env.NEXT_PUBLIC_DESCRIPTION ||
    "A quiet, private way to send me a note. No account, no history, no catch.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
};
