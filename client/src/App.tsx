import "./index.css";

import { BookOpen, Github, Sparkles, Twitter } from "lucide-react";

import { BazaarServicesList } from "./components/bazaar-services-list";

export function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute -top-48 right-1/3 h-[420px] w-[420px] rounded-full bg-[conic-gradient(at_top_left,_rgba(59,130,246,0.25),_transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-120px] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,_rgba(236,72,153,0.18),_transparent_65%)] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(15,23,42,0.7),_transparent_45%,_rgba(59,130,246,0.08)_75%)]" />
      </div>

      <main className="relative z-10 flex flex-col gap-12 px-6 py-16 sm:px-14">
        <header className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">x402 Bazaar</p>
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Discover machine-payable services</h1>
          <p className="mx-auto max-w-3xl text-base text-muted-foreground">
            Browse the live catalog of x402-enabled endpoints published through the Coinbase CDP facilitator.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <a
              href="https://x.com/frontboat"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-[0.65rem] font-semibold transition hover:bg-background/20 hover:text-foreground"
            >
              <Twitter className="h-3.5 w-3.5" aria-hidden />
              <span>frontboat</span>
            </a>
            <a
              href="https://github.com/coinbase/x402"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-[0.65rem] font-semibold transition hover:bg-background/20 hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" aria-hidden />
              <span>github</span>
            </a>
            <a
              href="https://github.com/daydreamsai/daydreams"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-[0.65rem] font-semibold transition hover:bg-background/20 hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>daydreams</span>
            </a>
            <a
              href="https://docs.cdp.coinbase.com/x402/bazaar"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-[0.65rem] font-semibold transition hover:bg-background/20 hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              <span>CDP docs</span>
            </a>
          </div>
        </header>

        <BazaarServicesList />
      </main>
    </div>
  );
}

export default App;
