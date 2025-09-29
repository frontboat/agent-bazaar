import { createDreams, Logger } from "@daydreamsai/core";
import { createMcpExtension } from "@daydreamsai/mcp";
import { LogLevel } from "@daydreamsai/core";
import path from "path";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { cliExtension, cli } from "@daydreamsai/cli";

/**
 * This example demonstrates how to create an agent that connects to an MCP server
 * and uses its resources through the MCP extension.
 *
 * It sets up a connection to a local MCP server.
 */

// Create an agent with the MCP extension
createDreams({
  model: openrouter("google/gemini-2.5-flash"),
  contexts: [cli],
  // Add the MCP extension with the example server configuration
  extensions: [
    createMcpExtension([
      {
        id: "mcp-server",
        name: "mcp-server",
        transport: {
          type: "stdio",
          command: "tsx",
          args: [path.join(__dirname, "../mcp-server/index.ts")],
        },
      },
    ]),
    cliExtension
  ],
}).start();