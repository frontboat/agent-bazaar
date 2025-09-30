# MCP Server with x402

[Model Context Protocol (MCP)](https://www.modelcontextprotocol.io/) is a protocol for passing context between LLMs and other AI agents. This page shows how to use the x402 payment protocol with MCP to make paid API requests through an MCP server, and how to connect it to Claude Desktop.

## What is this integration?

This guide walks you through running an MCP server that can access paid APIs using the x402 protocol. The MCP server acts as a bridge between Claude Desktop (or any MCP-compatible client) and a paid API (such as the sample weather API in the x402 repo). When Claude (or another agent) calls a tool, the MCP server will:

1. Detect if the API requires payment (via HTTP 402)
2. Automatically handle the payment using your wallet
3. Return the paid data to the client (e.g., Claude)

This lets you (or your agent) access paid APIs programmatically, with no manual payment steps.

## Prerequisites

* Node.js (v20 or higher)
* An x402-compatible server to connect to (for this demo, we'll use the [sample express server with weather data](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/express) from the x402 repo, or any external x402 API)
* An Ethereum wallet with USDC (on Base Sepolia or Base Mainnet)
* [Claude Desktop with MCP support](https://claude.ai/download)

## Step-by-Step: Build the MCP + x402 Integration

You can find a ready-to-use version of this code in the [x402 repo](https://github.com/coinbase/x402/tree/main/examples/typescript/mcp). Below, we explain each step so you understand how it works and can adapt it to your needs.

### 1. Install Dependencies

```bash lines wrap
npm install @modelcontextprotocol/sdk axios viem x402-axios dotenv
```

### 2. Set Up Environment Variables

Create a `.env` file in your project root:

```
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
CDP_WALLET_SECRET=your-wallet-secret
# Optional: pin a specific EVM account (otherwise one named "x402-mcp-buyer" will be created)
# CDP_EVM_ACCOUNT_ADDRESS=0xYourServerWalletAccount
# CDP_EVM_ACCOUNT_NAME=custom-account-name

RESOURCE_SERVER_URL=http://localhost:4021
ENDPOINT_PATH=/weather

# Optional: keep Solana access until Server Wallet v2 support lands
# SVM_PRIVATE_KEY=base58-encoded-private-key
```

* `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` / `CDP_WALLET_SECRET`: Server Wallet v2 credentials from the Coinbase Developer Platform
* `CDP_EVM_ACCOUNT_ADDRESS` / `CDP_EVM_ACCOUNT_NAME` (optional): choose which managed account funds x402 calls; omit to auto-create `x402-mcp-buyer`
* `RESOURCE_SERVER_URL`: The base URL of the paid API (use the sample express server for this demo)
* `ENDPOINT_PATH`: The specific endpoint path (e.g., `/weather`)
* `SVM_PRIVATE_KEY` (optional): temporary Solana fallback until Server Wallet v2 Solana signing is wired up

### 3. Implementation: MCP Server with x402 Payments

```javascript [expandable] lines wrap
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { CdpClient } from "@coinbase/cdp-sdk";
import { toAccount } from "viem/accounts";
import { withPaymentInterceptor } from "x402-axios";
import { config } from "dotenv";

// Load environment variables and throw an error if any are missing
config();

const baseURL = process.env.RESOURCE_SERVER_URL as string; // e.g. https://example.com
const endpointPath = process.env.ENDPOINT_PATH as string; // e.g. /weather
const cdp = new CdpClient();
const managedAccount = await cdp.evm.getOrCreateAccount({
  name: process.env.CDP_EVM_ACCOUNT_NAME ?? "x402-mcp-buyer",
});
const account = toAccount({
  address: managedAccount.address as `0x${string}`,
  sign: managedAccount.sign.bind(managedAccount),
  signMessage: managedAccount.signMessage.bind(managedAccount),
  signTransaction: managedAccount.signTransaction.bind(managedAccount),
  signTypedData: managedAccount.signTypedData.bind(managedAccount),
});

if (!baseURL || !endpointPath) {
  throw new Error("Missing environment variables");
}

// Create an axios client with payment interceptor using x402-axios
const client = withPaymentInterceptor(axios.create({ baseURL }), account);

// Create an MCP server
const server = new McpServer({
  name: "x402 MCP Client Demo",
  version: "1.0.0",
});

// Add an addition tool
server.tool(
  "get-data-from-resource-server",
  "Get data from the resource server (in this example, the weather)", //change this
  description to change when the client calls the tool
  {},
  async () => {
    const res = await client.get(endpointPath);
    return {
      content: [{ type: "text", text: JSON.stringify(res.data) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## How it works

* The MCP server exposes a tool that, when called, fetches data from a paid API endpoint.
* If the endpoint requires payment, the x402-axios interceptor handles the payment handshake using your wallet.
* Once payment is complete, the data is returned to the MCP client (e.g., Claude Desktop).

## Add the MCP Server to Claude Desktop

To use this integration with Claude Desktop:

1. Open Claude Desktop and go to MCP settings.
2. Add a new MCP server with the following config (adjust paths as needed):

```json lines wrap
{
  "mcpServers": {
    "demo": {
      "command": "pnpm",
      "args": [
        "--silent",
        "-C",
        "<absolute path to this repo>/examples/typescript/clients/mcp",
        "dev"
      ],
      "env": {
        "CDP_API_KEY_ID": "<your CDP API key id>",
        "CDP_API_KEY_SECRET": "<your CDP API key secret>",
        "CDP_WALLET_SECRET": "<your CDP wallet secret>",
        "RESOURCE_SERVER_URL": "http://localhost:4021",
        "ENDPOINT_PATH": "/weather"
      }
    }
  }
}
```

3. Make sure your x402-compatible server (e.g., the sample express server) is running and accessible at the URL you provided.
4. Start the MCP client (e.g., with `pnpm dev` in the client directory).
5. Claude can now call the tool and receive paid data!

***

## How the Pieces Fit Together

* **x402-compatible server**: Hosts the paid API (e.g., weather data). Responds with HTTP 402 if payment is required.
* **MCP server (this implementation)**: Acts as a bridge, handling payment and exposing tools to MCP clients.
* **Claude Desktop**: Calls the MCP tool, receives the paid data, and displays it to the user.

## Next Steps

* [See the full example in the repo](https://github.com/coinbase/x402/tree/main/examples/typescript/mcp)
* Try integrating with your own x402-compatible APIs
* Extend the MCP server with more tools or custom logic as needed.
