const UPSTREAM_URL = "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources";

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const upstream = await fetch(UPSTREAM_URL, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return Response.json(
        { error: "Upstream request failed", status: upstream.status },
        {
          status: 502,
          headers: {
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
          },
        },
      );
    }

    const body = await upstream.text();

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      { error: message },
      {
        status: 500,
        headers: {
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        },
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
