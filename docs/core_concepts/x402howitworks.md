# How x402 Works

This page explains the complete payment flow in x402, from initial request to payment settlement.

## Overview

x402 enables programmatic payments over HTTP using a simple request-response flow. When a client requests a paid resource, the server responds with payment requirements, the client submits payment, and the server delivers the resource.

## Payment Flow

<img src="https://mintcdn.com/coinbase-prod/-uP70_EV6KGCA5Hq/x402/images/x402-protocol-flow.png?fit=max&auto=format&n=-uP70_EV6KGCA5Hq&q=85&s=d9dd623f1ff6ccc8092ab994c23c8c59" data-og-width="2984" width="2984" data-og-height="1725" height="1725" data-path="x402/images/x402-protocol-flow.png" data-optimize="true" data-opv="2" srcset="https://mintcdn.com/coinbase-prod/-uP70_EV6KGCA5Hq/x402/images/x402-protocol-flow.png?w=280&fit=max&auto=format&n=-uP70_EV6KGCA5Hq&q=85&s=fd270b61d4ca043ed17da4ed179b2c66 280w, https://mintcdn.com/coinbase-prod/-uP70_EV6KGCA5Hq/x402/images/x402-protocol-flow.png?w=560&fit=max&auto=format&n=-uP70_EV6KGCA5Hq&q=85&s=1757b276812f2d884d88f18b345928c6 560w, https://mintcdn.com/coinbase-prod/-uP70_EV6KGCA5Hq/x402/images/x402-protocol-flow.png?w=840&fit=max&auto=format&n=-uP70_EV6KGCA5Hq&q=85&s=4d1de430e1d2e19f0a09560106ce885a 840w, https://mintcdn.com/coinbase-prod/-uP70_EV6KGCA5Hq/x402/images/x402-protocol-flow.png?w=1100&fit=max&auto=format&n=-uP70_EV6KGCA5Hq&q=85&s=e8b34ae4370ac3c2b2373d0681383ce7 1100w, https://mintcdn.com/coinbase-prod/-uP70_EV6KGCA5Hq/x402/images/x402-protocol-flow.png?w=1650&fit=max&auto=format&n=-uP70_EV6KGCA5Hq&q=85&s=bd4a806edefdc793bfc4850d92cfb1f4 1650w, https://mintcdn.com/coinbase-prod/-uP70_EV6KGCA5Hq/x402/images/x402-protocol-flow.png?w=2500&fit=max&auto=format&n=-uP70_EV6KGCA5Hq&q=85&s=7fc035915f06c4a4da0c2946fb5a0948 2500w" />

### Step-by-Step Process

1. **Client makes HTTP request** - The [client](/x402/core-concepts/client-server) sends a standard HTTP request to a resource server for a protected endpoint.

2. **Server responds with 402** - The resource server returns an [HTTP 402 Payment Required](/x402/core-concepts/http-402) status code with payment details in the response body.

3. **Client creates payment** - The client examines the payment requirements and creates a payment payload using their [wallet](/x402/core-concepts/wallet) based on the specified scheme.

4. **Client resubmits with payment** - The client sends the same HTTP request again, this time including the `X-PAYMENT` header containing the signed payment payload.

5. **Server verifies payment** - The resource server validates the payment payload either:
   * Locally (if running their own verification)
   * Via a [facilitator](/x402/core-concepts/facilitator) service (recommended)

6. **Facilitator validates** - If using a facilitator, it checks the payment against the scheme and network requirements, returning a verification response.

7. **Server processes request** - If payment is valid, the server fulfills the original request. If invalid, it returns another 402 response.

8. **Payment settlement** - The server initiates blockchain settlement either:
   * Directly by submitting to the blockchain
   * Through the facilitator's `/settle` endpoint

9. **Facilitator submits onchain** - The facilitator broadcasts the transaction to the blockchain based on the payment's network and waits for confirmation.

10. **Settlement confirmation** - Once confirmed onchain, the facilitator returns a payment execution response.

11. **Server delivers resource** - The server returns a 200 OK response with:
    * The requested resource in the response body
    * An `X-PAYMENT-RESPONSE` header containing the settlement details

## Key Components

* **[Client & Server](/x402/core-concepts/client-server)** - The roles and responsibilities of each party
* **[Facilitator](/x402/core-concepts/facilitator)** - Optional service that handles payment verification and settlement
* **[HTTP 402](/x402/core-concepts/http-402)** - How payment requirements are communicated
* **[Networks & Facilitators](/x402/network-support)** - Available networks and facilitator options

## Why This Design?

The x402 protocol is designed to be:

* **Stateless** - No sessions or authentication required
* **HTTP-native** - Works with existing web infrastructure
* **Blockchain-agnostic** - Supports multiple networks through facilitators
* **Developer-friendly** - Simple integration with standard HTTP libraries

## Next Steps

* Ready to accept payments? See [Quickstart for Sellers](/x402/quickstart-for-sellers)
* Want to make payments? See [Quickstart for Buyers](/x402/quickstart-for-buyers)
* Looking for specific networks? Check [Network Support](/x402/network-support)
