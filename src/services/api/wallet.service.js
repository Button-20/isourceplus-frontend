// Virtual wallet (buyer funds / client payouts).
import http from "@/services/lib/http";

// GET wallet/ — { id, balance, held_amount, currency, ... }
export async function getWallet() {
  const { data } = await http.get("wallet/");
  return data;
}

// GET wallet/transactions/ — the wallet's transaction history (newest first).
export async function listWalletTransactions() {
  const { data } = await http.get("wallet/transactions/");
  return Array.isArray(data) ? data : [];
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

// POST wallet/withdraw/ — withdraw own funds to the configured MoMo/Bank
// payout method; returns { detail, exttrid }.
export async function withdrawWallet({ amount }) {
  const { data } = await http.post("wallet/withdraw/", { amount });
  return data;
}
