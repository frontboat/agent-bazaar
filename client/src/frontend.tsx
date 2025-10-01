/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

function upsertMeta({
  name,
  property,
  content,
}: {
  name?: string;
  property?: string;
  content: string;
}) {
  if (typeof document === "undefined") {
    return;
  }

  const selector = name ? `meta[name="${name}"]` : property ? `meta[property="${property}"]` : null;
  if (!selector) {
    return;
  }

  let meta = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    if (name) meta.setAttribute("name", name);
    if (property) meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function ensureCanonical(url: string) {
  if (typeof document === "undefined") {
    return;
  }

  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
}

function applySeoDefaults() {
  if (typeof window === "undefined") {
    return;
  }

  const origin = window.location.origin;
  const path = `${window.location.pathname}${window.location.search}`;
  const canonicalUrl = `${origin}${path}`;
  const title = "x402 Bazaar – Discover machine-payable services";
  const description =
    "Browse live x402-enabled machine-payable services, payment requirements, and metadata in a unified dashboard.";
  const imageUrl = new URL("/logo.svg", origin).toString();

  document.title = title;

  ensureCanonical(canonicalUrl);

  upsertMeta({ name: "description", content: description });
  upsertMeta({ name: "robots", content: "index, follow" });
  upsertMeta({ property: "og:title", content: title });
  upsertMeta({ property: "og:description", content: description });
  upsertMeta({ property: "og:type", content: "website" });
  upsertMeta({ property: "og:url", content: canonicalUrl });
  upsertMeta({ property: "og:image", content: imageUrl });
  upsertMeta({ property: "og:locale", content: "en_US" });
  upsertMeta({ name: "twitter:card", content: "summary_large_image" });
  upsertMeta({ name: "twitter:title", content: title });
  upsertMeta({ name: "twitter:description", content: description });
  upsertMeta({ name: "twitter:image", content: imageUrl });
}

applySeoDefaults();

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
