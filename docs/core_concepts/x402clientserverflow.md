# Client / Server Flow

This page explains the roles and responsibilities of the **client** and **server** in the x402 protocol.

Understanding these roles is essential to designing, building, or integrating services that use x402 for programmatic payments.

<Info>
  Client refers to the technical component making an HTTP request. In practice, this is often the buyer of the resource.

  Server refers to the technical component responding to the request. In practice, this is typically the seller of the resource
</Info>

## Client Role

The client is the entity that initiates a request to access a paid resource.

Clients can include:

* Human-operated applications
* Autonomous agents
* Programmatic services acting on behalf of users or systems

### Responsibilities

* **Initiate requests:** Send an HTTP request to the resource server.
* **Handle payment requirements:** Read the `402 Payment Required` response and extract payment details.
* **Prepare payment payload:** Use the provided payment requirements to construct a valid payment payload.
* **Resubmit request with payment:** Retry the request with the `X-PAYMENT` header containing the signed payment payload.

Clients do not need to manage accounts, credentials, or session tokens beyond their crypto wallet. All interactions are stateless and occur over standard HTTP requests.

# Server Role

The server is the resource provider enforcing payment for access to its services.

Servers can include:

* API services
* Content providers
* Any HTTP-accessible resource requiring monetization

### Responsibilities

* **Define payment requirements:** Respond to unauthenticated requests with an HTTP `402 Payment Required`, including all necessary payment details in the response body.
* **Verify payment payloads:** Validate incoming payment payloads, either locally or by using a facilitator service.
* **Settle transactions:** Upon successful verification, submit the payment for settlement.
* **Provide the resource:** Once payment is confirmed, return the requested resource to the client.

Servers do not need to manage client identities or maintain session state. Verification and settlement are handled per request.

## How It Works

For a detailed explanation of the complete payment flow between clients and servers, see [How x402 Works](/x402/core-concepts/how-it-works).

## Summary

In the x402 protocol:

* The **client** requests resources and supplies the signed payment payload.
* The **server** enforces payment requirements, verifies transactions, and provides the resource upon successful payment.

This interaction is stateless, HTTP-native, and compatible with both human applications and automated agents.

Next, explore:

* [How x402 Works](/x402/core-concepts/how-it-works) — see the complete payment flow
* [Facilitator](/x402/core-concepts/facilitator) — how servers verify and settle payments
* [HTTP 402](/x402/core-concepts/http-402) — how servers communicate payment requirements to clients
