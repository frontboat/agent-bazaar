# Network & Token Support

This page explains which blockchain networks and tokens are supported by x402, and how to [extend support to additional networks](/x402/network-support#adding-support-for-new-networks).

# Overview

x402 is designed to work across multiple blockchain networks, with different levels of support depending on the facilitator being used. The protocol itself is network-agnostic, but facilitators need to implement network-specific logic for payment verification and settlement.

## Supported Facilitators

Network support in x402 depends on which facilitator you use. Here are the currently available facilitators:

### x402.org Facilitator

* **Supports**: Base Sepolia
* **Notes**: Recommended for testing and development. This is the default facilitator in the x402 packages and requires no setup.
* **URL**: [https://x402.org/facilitator](https://x402.org/facilitator)

### CDP's x402 Facilitator

* **Supports**: Base, Base Sepolia
* **Notes**: Production-ready for mainnet payments with KYT/OFAC compliance checks. Can also be used for testing on Base Sepolia. Requires CDP API keys. Uses facilitator object instead of facilitator URL.
* **Requirements**: CDP account and API keys from [cdp.coinbase.com](https://cdp.coinbase.com), see [Quickstart for Sellers: Running on Mainnet](/x402/quickstart-for-sellers#running-on-mainnet) for more details.

### x402.rs Facilitator

* **Supports**: Base Sepolia, Base, XDC Mainnet
* **Notes**: Rust-based facilitator operated by the x402 community.
* **URL**: [https://facilitator.x402.rs](https://facilitator.x402.rs)

### Self-Hosted Facilitators

* **Supports**: Any EVM network
* **Notes**: Run your own facilitator for full control and customization. Supports networks like Avalanche, Polygon, Arbitrum, and other EVM-compatible chains.
* **Setup**: See "Adding Support for New Networks" section below

### Third-Party Facilitators

Additional facilitators may be available from external providers. Check the [x402 Discord community](https://discord.gg/cdp) for the latest facilitator offerings.

## Token Support

x402 supports any ERC-20 token that implements the EIP-3009 standard.

**Important**: Facilitators support networks, not specific tokens - any EIP-3009 compatible token works on any facilitator.

### EIP-3009 Requirement

Tokens must implement the `transferWithAuthorization` function from the EIP-3009 standard. This enables:

* **Gasless transfers**: The facilitator sponsors gas fees
* **Signature-based authorization**: Users sign transfer authorizations off-chain
* **Secure payments**: Transfers are authorized by cryptographic signatures

### Specifying Payment Amounts

When configuring payment requirements, you have two options:

1. **Price String** (e.g., `"$0.01"`) - The system infers USDC as the token
2. **[TokenAmount](https://github.com/coinbase/x402/blob/094dcd2b95b5e13e8673264cc026d080417ee142/typescript/packages/x402/src/types/shared/middleware.ts#L28)** - Specify exact atomic units of any EIP-3009 token

### Using Custom EIP-3009 Tokens

To use a custom EIP-3009 token, you need three key pieces of information:

1. **Token Address**: The contract address of your EIP-3009 token
2. **EIP-712 Name**: The token's name for EIP-712 signatures
3. **EIP-712 Version**: The token's version for EIP-712 signatures

#### Finding Token Information on Basescan

You can retrieve the required EIP-712 values from any block explorer:

1. **Name**: Read the `name()` function - [Example on Basescan](https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913#readProxyContract#F16)
2. **Version**: Read the `version()` function - [Example on Basescan](https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913#readProxyContract#F24)

These values are used in the `eip712` nested object when configuring TokenAmount:

```typescript
{
  eip712: {
    name: "USD Coin",    // From name() function
    version: "2"         // From version() function
  }
}
```

### USDC - The Default Token

* **Status**: Supported by default across all networks
* **Why**: USDC implements EIP-3009 and is widely available
* **Networks**: Available on Base, Base Sepolia, and all supported networks

### Why EIP-3009?

The EIP-3009 standard is essential for x402 because it enables:

1. **Gas abstraction**: Buyers don't need native tokens (ETH, MATIC, etc.) for gas
2. **One-step payments**: No separate approval transactions required
3. **Universal facilitator support**: Any EIP-3009 token works with any facilitator

## Quick Reference

| Facilitator     | Networks Supported      | Production Ready | Requirements    |
| --------------- | ----------------------- | ---------------- | --------------- |
| x402.org        | base-sepolia            | ❌ Testnet only   | None            |
| CDP Facilitator | base, base-sepolia      | ✅                | CDP API keys    |
| x402.rs         | base-sepolia, base, xdc | ✅                | None            |
| Self-hosted     | Any EVM network         | ✅                | Technical setup |

**Note**: All facilitators support any EIP-3009 compatible token on their supported networks.

## Adding Support for New Networks

There are two ways to add support for new EVM networks in x402:

### Option 1: Contributing to x402 Packages

You can add official network support by submitting a PR to the x402 repository. This makes your network available to all x402 users.

#### Files to Modify

1. **`typescript/packages/x402/src/types/shared/evm/config.ts`**

   Add your network's chain ID and USDC address:

   ```typescript
   // Example: Adding Avalanche networks
   "43113": {  // Avalanche Fuji testnet chain ID
     usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
     usdcName: "USD Coin",
   },
   "43114": {  // Avalanche mainnet chain ID
     usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
     usdcName: "USDC",
   },
   ```

2. **`typescript/packages/x402/src/types/shared/network.ts`**

   Add your network to the schema and mappings:

   ```typescript
   // Update the NetworkSchema enum
   export const NetworkSchema = z.enum(["base-sepolia", "base", "avalanche-fuji", "avalanche"]);

   // Add to SupportedEVMNetworks array
   export const SupportedEVMNetworks: Network[] = [
     "base-sepolia",
     "base",
     "avalanche-fuji",
     "avalanche",
   ];

   // Add to EvmNetworkToChainId mapping
   ["avalanche-fuji", 43113],
   ["avalanche", 43114],
   ```

3. **`typescript/packages/x402/src/types/shared/evm/wallet.ts` - Update `getChainFromNetwork` function**

   Add your network to the `getChainFromNetwork` function to map your network string to the viem chain object:

   ```typescript
   import { avalanche, avalancheFuji } from "viem/chains";

   // Add your network to the switch statement in getChainFromNetwork
   case "avalanche":
     return avalanche;
   case "avalanche-fuji":
     return avalancheFuji;
   ```

#### Key Requirements

* **Network key**: Use a consistent network identifier (e.g., `avalanche-fuji`) across all files
* **Viem chain**: Your network must be available in viem/chains or you'll need to define it manually
* **USDC address**: Must be EIP-3009 compatible (has `transferWithAuthorization` function)
* **Chain ID**: Use your network's official chain ID in the config
* **Consistency**: Ensure the network name matches across `NetworkSchema`, `SupportedEVMNetworks`, `EvmNetworkToChainId`, and the `getChainFromNetwork` switch statement

### Option 2: Running Your Own Facilitator

If you need immediate support or want to test before contributing, you can run your own facilitator.

Video Guide: [Adding EVM Chains to x402](https://x.com/jaycoolh/status/1920851551905575164/video/1)

#### Prerequisites

1. Access to an RPC endpoint for your target network
2. A wallet with native tokens for gas sponsorship
3. The x402 facilitator code

## Future Network Support

The x402 ecosystem is actively expanding network support. Planned additions include:

* Additional L2 networks
* Non-EVM chain support (Solana in development)
* Cross-chain payment capabilities

## Getting Help

For help with network integration:

* Join the [x402 Discord community](https://discord.gg/cdp)
* Check the [x402 GitHub repository](https://github.com/coinbase/x402)

## Summary

x402's network support is designed to be extensible while maintaining security and reliability. Whether you're using the default Base Sepolia setup for testing or running your own facilitator for custom networks, the protocol provides flexibility for various use cases.

Key takeaways:

* Base and Base Sepolia have the best out-of-the-box support
* Any EVM network can be supported with a custom facilitator
* Any EIP-3009 token (with `transferWithAuthorization`) works on any facilitator
* Use price strings for USDC or TokenAmount for custom tokens
* Network choice affects gas costs and payment economics

Next, explore:

* [Quickstart for Sellers](/x402/quickstart-for-sellers) — Start accepting payments on supported networks
* [Core Concepts](/x402/core-concepts/how-it-works) — Learn how x402 works under the hood
* [Facilitator](/x402/core-concepts/facilitator) — Understand the role of facilitators
* [MCP Server](/x402/mcp-server) — Set up AI agents to use x402 payments
