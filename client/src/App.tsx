import "./index.css";

import { BookOpen, Github } from "lucide-react";

import { BazaarServicesList } from "./components/bazaar-services-list";

export function App() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <main className="flex flex-col gap-12 px-6 py-16 sm:px-14">
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
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 fill-current"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
              <span>frontboat</span>
            </a>
            <a
              href="https://github.com/coinbase/x402"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-[0.65rem] font-semibold transition hover:bg-background/20 hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" aria-hidden />
              <span>coinbase/x402</span>
            </a>
            <a
              href="https://github.com/daydreamsai/daydreams"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-[0.65rem] font-semibold transition hover:bg-background/20 hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" aria-hidden />
              <span>daydreams</span>
            </a>
            <a
              href="https://docs.cdp.coinbase.com/x402/bazaar"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-[0.65rem] font-semibold transition hover:bg-background/20 hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              <span>bazaar docs</span>
            </a>
          </div>
        </header>

        <BazaarServicesList />
      </main>
    </div>
  );
}

export default App;
