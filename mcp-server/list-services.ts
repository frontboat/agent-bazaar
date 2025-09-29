import { useFacilitator } from "x402/verify";
import { facilitator } from "@coinbase/x402";

// Get the list function from the facilitator
const { list } = useFacilitator(facilitator);

// Discover all available x402 services
const services = await list();
console.log(JSON.stringify(services, null, 2));