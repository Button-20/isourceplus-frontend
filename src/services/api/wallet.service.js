// Virtual wallet (buyer funds / client payouts).
import http from "@/services/lib/http";

// GET wallet/ — { id, balance, held_amount, currency, ... }
export async function getWallet() {
  const { data } = await http.get("wallet/");
  return data;
}

// POST wallet/fund/ — CTM hosted-checkout; returns { detail, redirect_url, exttrid }.
export async function fundWallet({ amount, customer_number, network }) {
  const { data } = await http.post("wallet/fund/", {
    amount,
    customer_number,
    network,
  });
  return data;
}

// POST wallet/payout/ — MTC payout to a client; returns { detail, exttrid }.
export async function payoutClient({ amount, client_number, network }) {
  const { data } = await http.post("wallet/payout/", {
    amount,
    client_number,
    network,
  });
  return data;
}
