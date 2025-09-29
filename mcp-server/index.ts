import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import {
  createSigner,
  decodeXPaymentResponse,
  type Hex,
  type MultiNetworkSigner,
  wrapFetchWithPayment,
} from "x402-fetch";
import { useFacilitator } from "x402/verify";
import { facilitator } from "@coinbase/x402";
import { z, type ZodRawShape } from "zod";

config();

const PaymentRequirementSchema = z
  .object({
    asset: z.string(),
    description: z.string().nullable().optional(),
    extra: z.record(z.string(), z.unknown()).optional(),
    maxAmountRequired: z.string().optional(),
    maxTimeoutSeconds: z.number().optional(),
    mimeType: z.string().nullable().optional(),
    network: z.string().optional(),
    outputSchema: z
      .object({
        input: z.record(z.string(), z.unknown()).optional(),
        output: z.unknown().nullable().optional(),
      })
      .optional(),
    payTo: z.string().optional(),
    resource: z.string().optional(),
    scheme: z.string().optional(),
  })
  .passthrough();

const BazaarItemSchema = z
  .object({
    id: z.string().optional(),
    resource: z.string(),
    type: z.string().optional(),
    lastUpdated: z.string().optional(),
    accepts: z.array(PaymentRequirementSchema),
    metadata: z.record(z.string(), z.unknown()).optional(),
    x402Version: z.number().optional(),
  })
  .passthrough();

const PaginationSchema = z
  .object({
    limit: z.number().int().nonnegative().optional(),
    offset: z.number().int().nonnegative().optional(),
    total: z.number().int().nonnegative().optional(),
  })
  .passthrough();

const BazaarResponseSchema = z
  .object({
    items: z.array(BazaarItemSchema),
    pagination: PaginationSchema.optional(),
    cursor: z.string().optional(),
    x402Version: z.number().optional(),
  })
  .passthrough();

const ListServicesInputSchema = z
  .object({
    network: z
      .string()
      .describe("Optional network name to filter accepted payments (e.g., base).")
      .optional(),
    asset: z
      .string()
      .describe("Optional ERC-20 contract address to filter supported assets.")
      .optional(),
    maxAtomicPrice: z
      .number()
      .int()
      .positive()
      .describe(
        "Optional maximum price in atomic units (e.g., USDC has 6 decimals)."
      )
      .optional(),
    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .describe("Limit the number of results returned (default: all).")
      .optional(),
  })
  .describe("Filters applied when listing services in the Bazaar.");

const listServicesShape: ZodRawShape = ListServicesInputSchema.shape;

const InspectServiceInputSchema = z
  .object({
    resource: z
      .string()
      .describe("Exact resource URL returned by list-bazaar-services."),
  })
  .describe("Retrieve full metadata for a specific Bazaar service by resource URL.");

const inspectServiceShape: ZodRawShape = InspectServiceInputSchema.shape;

const server = new McpServer({
  name: "x402 Bazaar MCP",
  version: "1.0.0",
});

const { list: facilitatorList } = useFacilitator(facilitator);

const DEFAULT_LIST_LIMIT = 100;

async function loadBazaarServices() {
  const services = await facilitatorList();
  return BazaarResponseSchema.parse(services);
}

type BazaarItem = z.infer<typeof BazaarItemSchema>;

function summarizeItem(item: BazaarItem) {
  const primaryRequirement = item.accepts[0] ?? null;
  const priceAtomic = primaryRequirement?.maxAmountRequired ?? null;
  const priceApprox = priceAtomic ? Number(priceAtomic) / 1_000_000 : null;

  return {
    resource: item.resource,
    type: item.type ?? null,
    network: primaryRequirement?.network ?? null,
    asset: primaryRequirement?.asset ?? null,
    maxAmountRequired: priceAtomic,
    priceApprox,
    description: primaryRequirement?.description ?? null,
    payTo: primaryRequirement?.payTo ?? null,
    lastUpdated: item.lastUpdated ?? null,
    x402Version: item.x402Version ?? null,
  };
}

server.registerTool(
  "list-bazaar-services",
  {
    title: "List Bazaar Services",
    description:
      "Fetch discoverable x402 services from the Bazaar with optional filters.",
    inputSchema: listServicesShape,
  },
  async (args, _extra) => {
    const { network, asset, maxAtomicPrice, limit } =
      ListServicesInputSchema.parse(args ?? {});

    try {
      const parsed = await loadBazaarServices();

      const items = Array.isArray(parsed.items) ? parsed.items : [];
      const matchedItems = items.filter((item) => {
        if (!item.accepts?.length) {
          return false;
        }

        return item.accepts.some((requirement) => {
          if (network && requirement.network && requirement.network !== network) {
            return false;
          }

          if (asset && requirement.asset !== asset) {
            return false;
          }

          if (
            maxAtomicPrice !== undefined &&
            requirement.maxAmountRequired !== undefined
          ) {
            const priceNumber = Number(requirement.maxAmountRequired);
            if (!Number.isNaN(priceNumber) && priceNumber > maxAtomicPrice) {
              return false;
            }
          }

          return true;
        });
      });

      const effectiveLimit = limit ?? DEFAULT_LIST_LIMIT;
      const limitedItems = matchedItems.slice(0, effectiveLimit);
      const summaries = limitedItems.map(summarizeItem);

      const summaryText = summaries
        .map((summary, index) => {
          const parts: string[] = [];
          parts.push(`${index + 1}. ${summary.resource}`);
          if (summary.type) {
            parts.push(`   type: ${summary.type}`);
          }
          if (summary.network) {
            parts.push(`   network: ${summary.network}`);
          }
          if (summary.asset) {
            parts.push(`   asset: ${summary.asset}`);
          }
          if (summary.maxAmountRequired) {
            parts.push(`   maxAtomicPrice: ${summary.maxAmountRequired}`);
          }
          if (
            summary.priceApprox !== null &&
            !Number.isNaN(summary.priceApprox)
          ) {
            parts.push(
              `   priceApprox: ${summary.priceApprox.toFixed(6)} (assuming 6 decimals)`
            );
          }
          if (summary.description) {
            parts.push(`   description: ${summary.description}`);
          }
          return parts.join("\n");
        })
        .join("\n\n");

      const payload = {
        query: {
          network: network ?? null,
          asset: asset ?? null,
          maxAtomicPrice: maxAtomicPrice ?? null,
          limit: effectiveLimit,
        },
        totalDiscovered: items.length,
        matched: matchedItems.length,
        returned: limitedItems.length,
        pagination: parsed.pagination ?? null,
        x402Version: parsed.x402Version ?? null,
        items: summaries,
      };

      if (limitedItems.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2),
            },
            {
              type: "text",
              text:
                matchedItems.length > 0
                  ? "No services returned after applying limit/filter."
                  : "No services matched the provided filters.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
          {
            type: "text",
            text: summaryText,
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      return {
        content: [
          {
            type: "text",
            text: `Error listing Bazaar services: ${message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "inspect-bazaar-service",
  {
    title: "Inspect Bazaar Service",
    description:
      "Show full payment metadata and schemas for a specific Bazaar resource URL.",
    inputSchema: inspectServiceShape,
  },
  async (args, _extra) => {
    const { resource } = InspectServiceInputSchema.parse(args ?? {});

    try {
      const parsed = await loadBazaarServices();
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      const match = items.find((item) => item.resource === resource);

      if (!match) {
        return {
          content: [
            {
              type: "text",
              text: `No Bazaar service found for resource: ${resource}`,
            },
          ],
        };
      }

      const summary = summarizeItem(match);
      const payload = {
        summary,
        item: match,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      return {
        content: [
          {
            type: "text",
            text: `Error inspecting Bazaar service: ${message}`,
          },
        ],
      };
    }
  }
);

const ExecuteServiceInputSchema = z
  .object({
    url: z
      .string()
      .describe("Absolute URL of the x402-protected resource to call."),
    method: z
      .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
      .optional()
      .describe("HTTP method to use. Defaults to GET."),
    network: z
      .string()
      .describe(
        "Network expected by the service (e.g., base, base-sepolia, solana-devnet)."
      ),
    query: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Optional query parameters to append to the request URL."),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe("Additional HTTP headers to send with the request."),
    body: z
      .unknown()
      .optional()
      .describe(
        "Optional request body. Objects will be JSON-encoded unless Content-Type is provided."
      ),
    parseResponseAsJson: z
      .boolean()
      .optional()
      .describe(
        "Force JSON parsing of the response body regardless of content-type."
      ),
  })
  .describe("Execute a paid request using the x402 payment flow.");

const executeServiceShape: ZodRawShape = ExecuteServiceInputSchema.shape;

type AnySigner = Awaited<ReturnType<typeof createSigner>>;

type SupportedSigner = AnySigner | MultiNetworkSigner;

const evmSignerCache = new Map<string, AnySigner>();
const svmSignerCache = new Map<string, AnySigner>();

const evmPrivateKey = process.env.EVM_PRIVATE_KEY as Hex | undefined;
const svmPrivateKey = process.env.SVM_PRIVATE_KEY as string | undefined;

function networkFamily(network: string): "svm" | "evm" {
  const normalized = network.trim().toLowerCase();
  if (normalized.startsWith("solana")) {
    return "svm";
  }
  return "evm";
}

async function resolveSignerForNetwork(network: string): Promise<SupportedSigner> {
  const family = networkFamily(network);

  if (family === "svm") {
    if (!svmPrivateKey) {
      throw new Error(
        `SVM network requested (${network}) but SVM_PRIVATE_KEY is not configured.`
      );
    }

    if (!svmSignerCache.has(network)) {
      const signer = await createSigner(network, svmPrivateKey);
      svmSignerCache.set(network, signer);
    }

    return svmSignerCache.get(network) as AnySigner;
  }

  if (!evmPrivateKey) {
    throw new Error(
      `EVM network requested (${network}) but EVM_PRIVATE_KEY is not configured.`
    );
  }

  if (!evmSignerCache.has(network)) {
    const signer = await createSigner(network, evmPrivateKey);
    evmSignerCache.set(network, signer);
  }

  return evmSignerCache.get(network) as AnySigner;
}

server.registerTool(
  "call-bazaar-service",
  {
    title: "Call Bazaar Service",
    description:
      "Execute a paid request to a Bazaar-listed endpoint using x402 payments.",
    inputSchema: executeServiceShape,
  },
  async (rawArgs, _extra) => {
    const {
      url,
      method,
      network,
      query,
      headers: rawHeaders,
      body: rawBody,
      parseResponseAsJson,
    } = ExecuteServiceInputSchema.parse(rawArgs ?? {});
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("The provided URL must be absolute (http/https).");
    }

    const targetUrl = new URL(url);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        targetUrl.searchParams.set(key, String(value));
      }
    }

    const resolvedMethod = (method ?? "GET").toUpperCase();
    const headers = new Headers(rawHeaders ?? {});

    let requestBody: unknown;
    if (rawBody !== undefined && !["GET", "HEAD"].includes(resolvedMethod)) {
      if (
        typeof rawBody === "object" &&
        rawBody !== null &&
        !(rawBody instanceof ArrayBuffer) &&
        !(rawBody instanceof Blob) &&
        !(rawBody instanceof FormData)
      ) {
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
        requestBody = JSON.stringify(rawBody);
      } else if (typeof rawBody === "string") {
        requestBody = rawBody;
      } else {
        requestBody = String(rawBody);
      }
    }

    const signer = await resolveSignerForNetwork(network);
    const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

    const options: Parameters<typeof fetch>[1] = {
      method: resolvedMethod,
      headers,
    };

    if (requestBody !== undefined) {
      (options as { body?: unknown }).body = requestBody;
    }

    const response = await fetchWithPayment(targetUrl.toString(), options);

    const paymentResponseHeader = response.headers.get("x-payment-response");
    const paymentResponse = paymentResponseHeader
      ? (decodeXPaymentResponse(paymentResponseHeader) as unknown)
      : null;

    const contentType = response.headers.get("content-type") ?? "";
    const shouldParseJson =
      parseResponseAsJson ?? contentType.includes("application/json");

    let responseBody: unknown;
    if (shouldParseJson) {
      try {
        responseBody = await response.clone().json();
      } catch (error) {
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }

    const summaryLines: string[] = [
      `Request: ${resolvedMethod} ${targetUrl.toString()}`,
      `Status: ${response.status} ${response.statusText}`,
    ];

    if (paymentResponse) {
      summaryLines.push(`Payment response: ${JSON.stringify(paymentResponse)}`);
    }

    const payload = {
      request: {
        url: targetUrl.toString(),
        method: resolvedMethod,
        headers: Object.fromEntries(headers.entries()),
        body:
          typeof requestBody === "string" || requestBody === undefined
            ? requestBody
            : rawBody,
        rawBody,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      },
      payment: paymentResponse,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
        {
          type: "text",
          text: summaryLines.join("\n"),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
