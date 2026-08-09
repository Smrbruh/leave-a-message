import { MessageComposer } from "@/components/message-composer";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-5 py-6 sm:px-8">
        <span className="font-sans text-sm font-medium tracking-wide text-ink-muted">
          {siteConfig.ownerName.toLowerCase()}.
        </span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
        <div className="w-full max-w-xl">
          <div className="mb-8 space-y-3 text-center sm:mb-10 sm:text-left">
            <h1 className="animate-fade-up font-serif text-headline text-ink">
              {siteConfig.headline}
            </h1>
            <p
              className="animate-fade-up text-base text-ink-muted sm:text-lg"
              style={{ animationDelay: "80ms" }}
            >
              {siteConfig.subheading}
            </p>
          </div>

          <div
            className="animate-fade-up"
            style={{ animationDelay: "150ms" }}
          >
            <MessageComposer />
          </div>
        </div>
      </main>

      <footer className="px-5 pb-8 pt-2 text-center sm:px-8">
        <p className="text-xs text-ink-faint">
          Private · nothing is stored · no account needed
        </p>
      </footer>
    </div>
  );
}
