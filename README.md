# Exploring the Coinbase Bazaar

## Directories
1. `buyer-agent` starts a DaydreamsAI CLI agent using the mcp and cli extension packages.
2. `client` is a simple SPA client that simply renders Bazaar listings
3. `docs` quick reference to the Coinbase x402 documentation.
4. `mcp-server` exposes 3 tools: list bazaar services, inspect service, call services

## Quickstart
In `mcp-server`
```bash
CDP_API_KEY_ID=your_key
CDP_API_KEY_SECRET=your_key
CDP_WALLET_SECRET=your_key
CDP_EVM_ACCOUNT_ADDRESS=your_key
```
In buyer-agent
```bash
OPENROUTER_API_KEY=your_key
```
Start agent
```bash
cd buyer-agent && bun run example-mcp-agent.ts
```

## Issues
1. LLM confusion: Having to ask to first get the tools from mcp, then ask to list bazaar services from mcp tool.
    - Proposal: bring the "list bazaar services" *action* to the agent context side, expose only the "call x402 service from bazaar" tool on the mcp-server
2. SVM
