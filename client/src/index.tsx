import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    // Simple proxy to avoid CORS issues when the browser calls the bazaar discovery endpoint.
    "/api/bazaar/list": {
      async GET() {
        try {
          const response = await fetch("https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources", {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            return new Response(
              JSON.stringify({
                error: "Upstream request failed",
                status: response.status,
              }),
              {
                status: 502,
                headers: {
                  "content-type": "application/json",
                  "cache-control": "no-store",
                  "access-control-allow-origin": "*",
                },
              },
            );
          }

          const body = await response.text();
          return new Response(body, {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
              "access-control-allow-origin": "*",
            },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 500,
              headers: {
                "content-type": "application/json",
                "cache-control": "no-store",
                "access-control-allow-origin": "*",
              },
            },
          );
        }
      },
    },

  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
