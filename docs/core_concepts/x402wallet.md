# Wallet

This page explains the role of the **wallet** in the x402 protocol.

In x402, a wallet is both a payment mechanism and a form of unique identity for buyers and sellers. Wallet addresses are used to send, receive, and verify payments, while also serving as identifiers within the protocol.

## Role of the Wallet

### For Buyers

Buyers use wallets to:

* Store USDC
* Sign payment payloads
* Authorize onchain payments programmatically

Wallets enable buyers, including AI agents, to transact without account creation or credential management.

### For Sellers

Sellers use wallets to:

* Receive USDC payments
* Define their payment destination within server configurations

A seller's wallet address is included in the payment requirements provided to buyers.

[CDP's Server Wallet](/server-wallets/v1/concepts/wallets) is our recommended option for programmatic payments and secure key management.

## Summary

* Wallets enable programmatic, permissionless payments in x402.
* Buyers use wallets to pay for services.
* Sellers use wallets to receive payments.
* Wallet addresses also act as unique identifiers within the protocol.

Next, explore:

* [How x402 Works](/x402/core-concepts/how-it-works) — See how wallets fit into the payment flow
* [Client & Server](/x402/core-concepts/client-server) — Understand buyer and seller roles
* [Quickstart for Sellers](/x402/quickstart-for-sellers) — Set up your receiving wallet
* [Quickstart for Buyers](/x402/quickstart-for-buyers) — Configure your payment wallet
