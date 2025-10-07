import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ClipboardCopy } from "lucide-react";

const BAZAAR_ENDPOINT = "/api/bazaar/list";

type BazaarPaymentRequirement = {
  asset: string;
  description?: string | null;
  extra?: Record<string, unknown> | null;
  maxAmountRequired?: string | null;
  maxTimeoutSeconds?: number | string | null;
  mimeType?: string | null;
  network?: string | null;
  outputSchema?: {
    input?: {
      method?: string | null;
      type?: string | null;
      resource?: string | null;
      discoverable?: boolean | null;
      queryParams?: Record<
        string,
        {
          description?: string | null;
          required?: boolean | null;
          type?: string | null;
        }
      > | null;
    } | null;
    output?: unknown;
  } | null;
  payTo?: string | null;
  resource?: string | null;
  scheme?: string | null;
};

type BazaarService = {
  accepts?: BazaarPaymentRequirement[] | null;
  lastUpdated?: string | null;
  metadata?: Record<string, unknown> | null;
  resource: string;
  type?: string | null;
  x402Version?: number | string | null;
  description?: string | null;
};

type BazaarResponse = {
  items?: BazaarService[] | null;
};

const PROTECTED_DESCRIPTION = "access to protected content";

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatMaxAmount(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }

  return `${numeric.toLocaleString()} (atomic units)`;
}

function normalizeDescription(value?: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isDefaultDescription(value?: string | null): boolean {
  const normalized = normalizeDescription(value);
  return normalized === "" || normalized === PROTECTED_DESCRIPTION;
}

function isServiceHidden(service: BazaarService): boolean {
  if (!isDefaultDescription(service.description)) {
    return false;
  }

  if (Array.isArray(service.accepts)) {
    return !service.accepts.some((payment) => !isDefaultDescription(payment?.description));
  }

  return true;
}

type ServiceEntry = {
  service: BazaarService;
  index: number;
};

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

type JsonLdRecord = Record<string, unknown>;

function compactRecord(record: JsonLdRecord): JsonLdRecord {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

function toAbsoluteUrl(resource: string | null | undefined, origin?: string): URL | null {
  if (!resource) {
    return null;
  }

  try {
    return new URL(resource);
  } catch (error) {
    if (!origin) {
      return null;
    }

    try {
      return new URL(resource, origin);
    } catch (nestedError) {
      return null;
    }
  }
}

function useClipboard(getValue: () => string | null) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (copied) {
      return;
    }

    try {
      const value = getValue();
      if (!value) {
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } else {
        return;
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setCopied(false);
    }
  }, [copied, getValue]);

  return { copy, copied };
}

function renderMetadataValue(value: unknown): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (isNonEmptyObject(value) || Array.isArray(value)) {
    return <JsonPreview value={value} />;
  }

  return <span className="text-muted-foreground">{String(value)}</span>;
}

function FieldRow({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      <span className="font-medium text-foreground">{label}:</span>
      <span className="break-all text-muted-foreground">{value}</span>
    </div>
  );
}

function ListingCopyButton({ getValue }: { getValue: () => string | null }) {
  const { copy, copied } = useClipboard(getValue);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="ml-auto h-8 w-8 self-start text-muted-foreground opacity-60 transition hover:opacity-100"
      onClick={copy}
      title="Copy listing JSON"
    >
      {copied ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
      <span className="sr-only">Copy listing JSON</span>
    </Button>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  const formatted = useMemo(() => formatJson(value), [value]);

  return (
    <pre className="whitespace-pre-wrap break-words rounded-xl border border-border/60 bg-background/30 p-3 text-xs text-muted-foreground">
      {formatted}
    </pre>
  );
}

export function BazaarServicesList() {
  const [services, setServices] = useState<BazaarService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHiddenListings, setShowHiddenListings] = useState(false);

  const fetchServices = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(BAZAAR_ENDPOINT, {
        headers: { Accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const body = (await response.json()) as BazaarResponse;
      const items = Array.isArray(body?.items) ? body.items : [];
      if (signal?.aborted) {
        return;
      }

      setServices(items.filter((item): item is BazaarService => Boolean(item && item.resource)));
    } catch (err) {
      if ((err instanceof DOMException || err instanceof Error) && (err.name === "AbortError" || signal?.aborted)) {
        return;
      }

      const message = err instanceof Error ? err.message : "Failed to load bazaar services";
      setError(message);
      setServices([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchServices(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchServices]);

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      const aTime = a.lastUpdated ? Date.parse(a.lastUpdated) : 0;
      const bTime = b.lastUpdated ? Date.parse(b.lastUpdated) : 0;
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });
  }, [services]);

  const { hiddenEntries, visibleEntries } = useMemo(() => {
    const hiddenItems: ServiceEntry[] = [];
    const visibleItems: ServiceEntry[] = [];

    sortedServices.forEach((service, index) => {
      const entry: ServiceEntry = { service, index };
      if (isServiceHidden(service)) {
        hiddenItems.push(entry);
      } else {
        visibleItems.push(entry);
      }
    });

    return { hiddenEntries: hiddenItems, visibleEntries: visibleItems };
  }, [sortedServices]);

  useEffect(() => {
    setShowHiddenListings(false);
  }, [hiddenEntries.length]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const existing = document.getElementById("bazaar-jsonld") as HTMLScriptElement | null;

    if (sortedServices.length === 0) {
      if (existing?.parentElement) {
        existing.parentElement.removeChild(existing);
      }
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const pageUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : undefined;

    const itemList: JsonLdRecord = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "x402 Bazaar Listings",
      description: "Live registry of x402-enabled machine-payable services with payment and provider details.",
      url: pageUrl,
      numberOfItems: sortedServices.length,
      itemListElement: sortedServices.map((service, index) => {
        const accepts = Array.isArray(service.accepts) ? service.accepts : [];
        const primaryPayment = accepts[0];
        const serviceUrl = toAbsoluteUrl(service.resource, origin ?? undefined);
        const offerUrl = toAbsoluteUrl(primaryPayment?.resource ?? undefined, origin ?? undefined) ?? serviceUrl;

        const structuredService: JsonLdRecord = compactRecord({
          "@type": "Service",
          position: index + 1,
          name: serviceUrl?.hostname ?? service.resource,
          url: serviceUrl?.toString() ?? service.resource,
          description: service.description ?? primaryPayment?.description ?? undefined,
          serviceType: service.type ?? primaryPayment?.scheme ?? undefined,
          provider: primaryPayment?.payTo ?? undefined,
          areaServed: primaryPayment?.network ?? undefined,
        });

        const offer = primaryPayment
          ? compactRecord({
              "@type": "Offer",
              availabilityStarts: service.lastUpdated ?? undefined,
              priceCurrency: primaryPayment.asset ?? undefined,
              url: offerUrl?.toString() ?? undefined,
            })
          : null;

        if (offer && Object.keys(offer).length > 1) {
          structuredService.offers = offer;
        }

        return structuredService;
      }),
    };

    const script = existing ?? document.createElement("script");
    script.type = "application/ld+json";
    script.id = "bazaar-jsonld";
    script.textContent = JSON.stringify(itemList, null, 2);

    if (!existing) {
      document.head.appendChild(script);
    }

    return () => {
      if (script.parentElement) {
        script.parentElement.removeChild(script);
      }
    };
  }, [sortedServices]);

  const renderServiceCard = ({ service, index }: ServiceEntry) => {
    const accepts = Array.isArray(service.accepts) ? service.accepts : [];
    const metadataEntries = isNonEmptyObject(service.metadata) ? Object.entries(service.metadata!) : [];

    const serviceUrl = (() => {
      try {
        return new URL(service.resource);
      } catch (err) {
        return null;
      }
    })();

    const primaryPayment = accepts[0];
    const summaryDescription = service.description ?? primaryPayment?.description ?? null;
    const providerNote =
      primaryPayment?.description && primaryPayment.description !== summaryDescription
        ? primaryPayment.description
        : null;

    const baseKey = `${service.resource}-${index}`;

    return (
      <article key={baseKey} className="w-full rounded-2xl border border-border/70 bg-muted/10 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="truncate text-[1.4rem] font-semibold text-foreground sm:text-[1.5rem]">
              {serviceUrl?.hostname ?? service.resource}
            </h2>
            {summaryDescription ? (
              <p className="text-base leading-relaxed text-muted-foreground/85">{summaryDescription}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {primaryPayment ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {primaryPayment.network ? <Badge variant="outline">{primaryPayment.network}</Badge> : null}
                {primaryPayment.scheme ? <Badge variant="secondary">{primaryPayment.scheme}</Badge> : null}
                {primaryPayment.extra && typeof primaryPayment.extra.name === "string" ? (
                  <Badge variant="outline">{primaryPayment.extra.name}</Badge>
                ) : null}
              </div>
            ) : null}
            <ListingCopyButton getValue={() => formatJson(service)} />
          </div>
        </div>

        {providerNote ? <p className="mt-3 text-xs italic text-muted-foreground">{providerNote}</p> : null}

        {accepts.length > 0 || metadataEntries.length > 0 ? (
          <Accordion type="multiple" className="mt-4 space-y-2 text-sm">
            {accepts.map((payment, paymentIndex) => {
              const inputSchema = payment.outputSchema?.input ?? undefined;
              const queryParamEntries = isNonEmptyObject(inputSchema?.queryParams)
                ? Object.entries(inputSchema!.queryParams!)
                : [];

              const hasOutputSchema = payment.outputSchema?.output !== undefined && payment.outputSchema?.output !== null;

              const isPrimaryPayment = paymentIndex === 0;
              const shouldShowDescription =
                payment.description && (!isPrimaryPayment || payment.description !== summaryDescription);
              const shouldShowBadges = !isPrimaryPayment || accepts.length > 1;

              return (
                <AccordionItem
                  key={`${baseKey}-payment-${paymentIndex}`}
                  value={`payment-${baseKey}-${paymentIndex}`}
                  className="overflow-hidden rounded-lg border border-border/30 bg-background/10"
                >
                  <AccordionTrigger className="flex items-center justify-between px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
                    <span>Payment {paymentIndex + 1}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 pt-0">
                    <div className="space-y-2 pt-2 text-[0.7rem] text-muted-foreground">
                      {shouldShowBadges ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {payment.network ? <Badge variant="outline">{payment.network}</Badge> : null}
                          {payment.scheme ? <Badge variant="secondary">{payment.scheme}</Badge> : null}
                          {payment.extra && typeof payment.extra.name === "string" ? (
                            <Badge variant="outline">{payment.extra.name}</Badge>
                          ) : null}
                        </div>
                      ) : null}

                      {shouldShowDescription ? <p>{payment.description}</p> : null}

                      <FieldRow label="Endpoint" value={payment.resource ?? service.resource} className="text-[0.7rem]" />
                      <FieldRow label="Asset" value={payment.asset} className="text-xs" />
                      <FieldRow label="Pay to" value={payment.payTo} className="text-xs" />

                      {payment.mimeType ? <FieldRow label="MIME type" value={payment.mimeType} className="text-xs" /> : null}

                      {payment.maxAmountRequired ? (
                        <FieldRow label="Max amount" value={formatMaxAmount(payment.maxAmountRequired)} className="text-xs" />
                      ) : null}

                      {payment.maxTimeoutSeconds ? (
                        <FieldRow label="Timeout" value={`${payment.maxTimeoutSeconds} seconds`} className="text-xs" />
                      ) : null}

                      {inputSchema?.method ? <FieldRow label="Method" value={inputSchema.method} className="text-xs" /> : null}

                      {inputSchema?.type ? <FieldRow label="Type" value={inputSchema.type} className="text-xs" /> : null}

                      {inputSchema?.resource && inputSchema.resource !== payment.resource ? (
                        <FieldRow label="Input resource" value={inputSchema.resource} className="text-xs" />
                      ) : null}

                      {inputSchema?.discoverable !== undefined ? (
                        <FieldRow label="Discoverable" value={inputSchema.discoverable ? "yes" : "no"} className="text-xs" />
                      ) : null}

                      {queryParamEntries.length > 0 ? (
                        <div className="space-y-2 rounded-md border border-border/60 bg-background/30 p-2">
                          <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
                            Query parameters
                          </p>
                          <div className="space-y-1.5">
                            {queryParamEntries.map(([param, details]) => (
                              <div key={param} className="space-y-1 rounded border border-border/40 bg-background/20 p-2">
                                <div className="flex flex-wrap items-center gap-1.5 text-foreground">
                                  <span className="font-medium">{param}</span>
                                  {details?.required !== undefined ? (
                                    <span className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                                      {details.required ? "required" : "optional"}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="space-y-0.5 text-[0.65rem] text-muted-foreground">
                                  {details?.type ? (
                                    <p className="leading-relaxed">
                                      <span className="font-medium text-foreground">Type:</span> {details.type}
                                    </p>
                                  ) : null}
                                  {details?.description ? <p className="leading-relaxed">{details.description}</p> : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {hasOutputSchema ? (
                        <div className="space-y-2 rounded-md border border-border/60 bg-background/30 p-2">
                          <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
                            Output schema
                          </p>
                          <JsonPreview value={payment.outputSchema!.output} />
                        </div>
                      ) : null}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {metadataEntries.length > 0 ? (
              <AccordionItem value={`metadata-${baseKey}`} className="overflow-hidden rounded-lg border border-border/30 bg-background/10">
                <AccordionTrigger className="flex items-center justify-between px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
                  <span>Metadata</span>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0">
                  <div className="space-y-2 pt-2 text-[0.7rem] text-muted-foreground">
                    {metadataEntries.map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <p className="font-medium capitalize text-foreground">{key}</p>
                        <div>{renderMetadataValue(value)}</div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>
        ) : null}
      </article>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, idx) => (
            <div key={idx} className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col gap-4 rounded-xl border border-destructive/50 bg-destructive/10 p-6">
          <div>
            <p className="text-sm font-semibold text-destructive">Unable to load services</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div>
            <Button onClick={() => fetchServices()}>Try again</Button>
          </div>
        </div>
      ) : sortedServices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
          No services are currently listed. Check back soon.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {visibleEntries.length > 0 ? (
            <div className="flex flex-col gap-6">{visibleEntries.map(renderServiceCard)}</div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-center text-muted-foreground">
              All current listings require payment to reveal details. Use the toggle below to browse them.
            </div>
          )}

          {hiddenEntries.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Protected or empty listings</p>
                <Button variant="outline" size="sm" onClick={() => setShowHiddenListings((value) => !value)}>
                  {showHiddenListings
                    ? "Hide protected/empty listings"
                    : `Show protected/empty listings (${hiddenEntries.length})`}
                </Button>
              </div>
              {showHiddenListings ? (
                <div className="flex flex-col gap-6">{hiddenEntries.map(renderServiceCard)}</div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  These entries either return paywalled endpoints or omit descriptions entirely. Expand to inspect them.
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
