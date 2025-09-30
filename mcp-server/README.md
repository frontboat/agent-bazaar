# mcp-server

This is where the mcp server will live. We want this to be able to fetch the bazaar list, and then return it to the agent with all the metadata. 

### Environment

Create a `.env` file and configure the Coinbase Server Wallet v2 credentials used by the MCP server:

```
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
CDP_WALLET_SECRET=your-wallet-secret

# Optional account selection overrides
# CDP_EVM_ACCOUNT_ADDRESS=0x...
# CDP_EVM_ACCOUNT_NAME=custom-account-name

# Optional: keep Solana support while Server Wallet integration is in progress
# SVM_PRIVATE_KEY=base58-encoded-private-key
```

If no account hints are provided the server will `getOrCreate` an EVM account named `x402-mcp-buyer` using the configured Server Wallet project.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```
