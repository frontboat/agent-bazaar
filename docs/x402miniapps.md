# Building Miniapps with x402

This guide explains how to build miniapps that integrate x402 payments using our official template. The template provides a complete starting point with wallet integration, payment protection, and notifications already configured.

## What are Miniapps?

Miniapps are lightweight applications that run inside Farcaster clients like TBA. Built with [MiniKit](https://onchainkit.xyz/minikit), they provide a native app-like experience while leveraging the social graph and wallet capabilities of Farcaster. By integrating x402, your miniapp can accept instant USDC payments without requiring users to leave the app or manage complex payment flows.

## Why x402 for Miniapps?

x402 is particularly well-suited for miniapps because:

* **Seamless Payments**: Users pay without leaving the miniapp experience
* **No Account Setup**: Works directly with connected wallets
* **Instant Monetization**: Builders can monetize their content or services directly
* **Simple Integration**: Payment protection with just middleware configuration

## Prerequisites

Before starting, ensure you have:

* Node.js 18+ and pnpm v10 installed
* A [Coinbase Developer Platform](https://portal.cdp.coinbase.com) account and API keys (for mainnet)
* A wallet address to receive payments

## Quick Start with the x402 Template

The fastest way to build an x402-powered miniapp is using our official template:

```bash
# Clone the x402 repository
git clone https://github.com/coinbase/x402.git
cd x402/examples/typescript/fullstack/farcaster-miniapp

# Install dependencies
pnpm install

# Build all packages (required for monorepo)
cd ../../
pnpm build
cd fullstack/farcaster-miniapp

# Copy environment variables
cp env.example .env.local

# Configure your environment (see below)
# Then start the development server
pnpm dev
```

## Template Features

The x402 miniapp template includes:

* **Next.js App Router** with TypeScript
* **OnchainKit Integration** for wallet connection
* **x402 Payment Middleware** for protected routes
* **Farcaster Frame SDK** for miniapp detection
* **Notification System** with Redis/Upstash

## Project Structure

```
farcaster-miniapp/
├── app/
│   ├── .well-known/
│   │   └── farcaster.json/    # Dynamic Frame configuration
│   │       └── route.ts
│   ├── api/
│   │   ├── notify/            # Notification proxy endpoint
│   │   ├── protected/         # x402-protected endpoint
│   │   └── webhook/           # Frame webhook handler
│   ├── page.tsx               # Main miniapp interface
│   ├── layout.tsx             # Root layout with providers
│   ├── providers.tsx          # MiniKit and wallet providers
│   └── globals.css            # Global styles
├── lib/
│   └── notification-client.ts # Notification utilities
├── middleware.ts              # x402 payment middleware
└── .env.local                 # Environment configuration
```

## Environment Configuration

Create a `.env.local` file with your configuration:

### Required for x402 Payments

```env
# Your wallet address to receive payments
RESOURCE_WALLET_ADDRESS=0xYourWalletAddress

# Network: "base-sepolia" for testing, "base" for production
NETWORK=base-sepolia

# OnchainKit API key (get from https://portal.cdp.coinbase.com/products/onchainkit)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=x402 Mini App

# For mainnet only (get from portal.cdp.coinbase.com)
CDP_API_KEY_ID=your_cdp_key_id
CDP_API_KEY_SECRET=your_cdp_key_secret
```

### Frame Configuration (Auto-generated)

Run this command to generate Frame configuration:

```bash
npx create-onchain --manifest
```

This creates the necessary environment variables for:

* Frame metadata and account association
* Notification support via Redis/Upstash
* Mini app detection and integration

## How the Template Works

### 1. Payment Middleware Setup

The `middleware.ts` file configures x402 to protect API routes:

```typescript
import { facilitator } from "@coinbase/x402";
import { paymentMiddleware } from "x402-next";

const payTo = process.env.RESOURCE_WALLET_ADDRESS as Address;
const network = process.env.NETWORK || "base-sepolia";

export const middleware = paymentMiddleware(
  payTo,
  {
    "/api/protected": {
      price: "$0.01",
      network,
      config: {
        description: "Protected route",
      },
    },
  },
  facilitator,
);

export const config = {
  matcher: ["/api/protected"],
  runtime: "nodejs",
};
```

### 2. Protected API Endpoint

The `/api/protected/route.ts` endpoint is automatically protected:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  // This only executes if payment is verified
  return NextResponse.json({
    success: true,
    message: "Protected action completed successfully",
    timestamp: new Date().toISOString(),
  });
}
```

### 3. Frontend Integration

The main page demonstrates wallet connection and protected API calls:

```tsx
import { wrapFetchWithPayment } from "x402-fetch";
import { getWalletClient } from "wagmi/actions";

// Get wallet client from wagmi
const walletClient = await getWalletClient(config, {
  account: address,
  chainId: chainId,
  connector: connector,
});

// Wrap fetch with x402 payment handling
const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);

// Call protected endpoint - payment is handled automatically
const response = await fetchWithPayment("/api/protected");
```

### 4. Miniapp Detection

The template detects when running inside Farcaster:

```tsx
import { sdk } from "@farcaster/frame-sdk";

useEffect(() => {
  const initMiniApp = async () => {
    await sdk.actions.ready();
    const isInMiniApp = await sdk.isInMiniApp();
    setIsInMiniApp(isInMiniApp);
  };
  initMiniApp();
}, []);
```

## Customizing the Template

### Adding More Protected Routes

Update `middleware.ts` to add new protected endpoints:

```typescript
export const middleware = paymentMiddleware(
  payTo,
  {
    "/api/protected": {
      price: "$0.01",
      network,
    },
    "/api/premium-content": {
      price: "$1.00",
      network,
      config: {
        description: "Premium content access",
      },
    },
    "/api/exclusive-feature": {
      price: "$5.00",
      network,
      config: {
        description: "Exclusive feature unlock",
      },
    },
  },
  facilitator,
);

export const config = {
  matcher: ["/api/protected", "/api/premium-content", "/api/exclusive-feature"],
};
```

### Implementing Notifications

The template includes notification support via Redis:

```typescript
import { sendFrameNotification } from "@/lib/notification-client";

// Send a notification after successful payment
await sendFrameNotification({
  fid: userFid,
  title: "Payment Successful!",
  body: "You've unlocked premium content",
  notificationDetails: {
    url: "/premium",
    type: "payment_success",
  },
});
```

### Customizing the UI

The template uses Tailwind CSS with a pixel theme. Modify `theme.css` to customize:

```css
/* Custom theme variables */
:root {
  --ockThemePrimary: #4F46E5;
  --ockThemeSecondary: #7C3AED;
  --ockConnectWalletBackground: #FFFFFF;
  /* ... more theme variables ... */
}
```

## Testing Your Miniapp

### Local Development

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Test wallet connection and protected API calls

### Testing in Farcaster

1. Use ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Update `NEXT_PUBLIC_URL` in `.env.local` with your ngrok URL

3. Cast your frame URL to test in Warpcast

4. Your miniapp will appear with the "Use App" button

## Deployment

### Production Checklist

* Set `NETWORK=base` for mainnet
* Configure CDP API keys for mainnet settlement
* Update `RESOURCE_WALLET_ADDRESS` to your production wallet
* Set proper `NEXT_PUBLIC_URL` for your domain
* Test payment flows thoroughly on testnet first
* Configure Redis for production notifications

## Best Practices

### User Experience

* **Clear Pricing**: Always show prices before requiring payment
* **Loading States**: Show progress during payment processing
* **Error Handling**: Provide clear error messages and recovery options
* **Success Feedback**: Confirm successful payments immediately

### Security

* **Environment Variables**: Never commit sensitive keys
* **Server Validation**: Always verify payments server-side
* **Network Checking**: Ensure users are on the correct network
* **Rate Limiting**: Consider adding rate limits to protected endpoints

## Common Issues and Solutions

### Payment Not Processing

```typescript
// Ensure wallet client is properly configured
if (!walletClient) {
  console.error("Wallet client not available");
  return;
}

// Check network matches configuration
if (chainId !== expectedChainId) {
  console.error("Wrong network");
  return;
}
```

### Miniapp Not Detected

```typescript
// Ensure Frame SDK is initialized
try {
  await sdk.actions.ready();
} catch (error) {
  console.log("Not in miniapp context");
}
```

### 402 Errors Not Handled

```typescript
// Verify middleware matcher includes your route
export const config = {
  matcher: ["/api/your-route"], // Add your route here
};
```

## Next Steps

1. **Explore the Template**: Review all files in the [example repository](https://github.com/coinbase/x402/tree/main/examples/typescript/fullstack/farcaster-miniapp)
2. **Customize for Your Use Case**: Modify the template to fit your specific needs
3. **Add Your Features**: Build on top of the payment foundation
4. **Deploy and Share**: Launch your miniapp to the Farcaster community

## Support

* [x402 Documentation](/x402)
* [OnchainKit Documentation](https://onchainkit.xyz)
* [Farcaster Mini Apps Guide](https://miniapps.farcaster.xyz/)
* [CDP Discord Community](https://discord.gg/cdp)

Start building your monetized Farcaster miniapp today with x402!
