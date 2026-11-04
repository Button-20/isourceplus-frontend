// Subscriptions (SwaggerHub "subscription_api", 2026-11-04). Paid through
// Paystack in two steps:
//
//   POST subscriptions/tranx/init/?plan_name=BRONZE|SILVER|GOLD|DIAMOND|PLATINUM
//        &plan_type=buyer|supplier|transporter
//        &plan_interval=quarterly|biannually|annually  (default quarterly)
//        [&is_trial=true]                               (quarterly only)
//        → Paystack authorization_url, reference and plan_code
//   …the user pays on Paystack, which returns to /subscription/callback…
//   POST subscriptions/subscribe/?authorization_url&plan_code&reference
//        → the new subscription
//
//   GET  subscriptions/                       the company's subscriptions
//   POST subscriptions/upgrade/?plan_name&plan_type[&plan_interval]
//   GET  subscriptions/{id}/                  one subscription
//   POST subscriptions/{id}/activate/ | deactivate/   reactivate / cancel
//        (auto-renewal on / off)
//   GET  subscriptions/{id}/payment-info/update/?is_email=true|false
//        a link to update the saved card (emailed, or returned)
//
// Subscription: id, status (PROCESSING | ACTIVE | NOT_RENEW | ATTENTION |
// COMPLETED | CANCELLED), plan (tier), is_trial, trial_ends_at, start_date,
// next_payment_date, is_upgrading, entity_name, branches[].
import http from "@/services/lib/http";
import { storage } from "@/services/lib/storage";
import { rejectEnvelope } from "@/services/api/grn.service";
import { apiErrorMessage, messageFromBody } from "@/services/lib/api-error";

export const SUBSCRIPTION_STATUS_LABELS = {
  PROCESSING: "Processing",
  ACTIVE: "Active",
  NOT_RENEW: "Not renewing",
  ATTENTION: "Needs attention",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Statuses in which the company still holds the plan.
const CURRENT_STATUSES = ["ACTIVE", "NOT_RENEW", "ATTENTION", "PROCESSING"];

// The checkout details kept across the Paystack round trip.
const CHECKOUT_KEY = "subscriptionData";

const unwrap = (data) => (data && "data" in data ? data.data : data);

// The Paystack checkout in an init/upgrade reply, wherever it's nested:
// { authorization_url, reference, plan_code } or null.
export function findCheckout(data) {
  const seen = new Set();
  const found = {};
  const walk = (node, depth) => {
    if (!node || typeof node !== "object" || depth > 5 || seen.has(node))
      return;
    seen.add(node);
    for (const key of ["authorization_url", "reference", "plan_code"]) {
      if (!found[key] && typeof node[key] === "string" && node[key])
        found[key] = node[key];
    }
    Object.values(node).forEach((v) => walk(v, depth + 1));
  };
  walk(data, 0);
  return found.authorization_url ? found : null;
}

// → { authorization_url, reference, plan_code }
export async function startSubscriptionCheckout({
  planName,
  planType,
  planInterval = "quarterly",
  isTrial = false,
}) {
  const { data } = await http.post(
    "subscriptions/tranx/init/",
    {},
    {
      params: {
        plan_name: planName.toUpperCase(),
        plan_type: planType,
        plan_interval: isTrial ? "quarterly" : planInterval,
        is_trial: isTrial ? "true" : "false",
      },
    },
  );
  rejectEnvelope(data, "Couldn't start the payment.");
  const checkout = findCheckout(data);
  if (!checkout)
    throw new Error("The payment link is missing. Please try again.");
  return checkout;
}

// Remember the checkout so the callback page can complete it.
export const saveCheckout = (checkout, details = {}) =>
  storage.setJSON(CHECKOUT_KEY, { ...details, ...checkout });
export const loadCheckout = () => storage.getJSON(CHECKOUT_KEY, {});
export const clearCheckout = () => storage.remove(CHECKOUT_KEY);

// After Paystack: create the subscription from the paid checkout.
export async function completeSubscription({
  authorizationUrl,
  planCode,
  reference,
}) {
  const { data } = await http.post(
    "subscriptions/subscribe/",
    {},
    {
      params: {
        authorization_url: authorizationUrl,
        plan_code: planCode,
        reference,
      },
    },
  );
  rejectEnvelope(data, "Couldn't complete the subscription.");
  return unwrap(data);
}

export async function listSubscriptions() {
  const { data } = await http.get("subscriptions/");
  rejectEnvelope(data, "Couldn't load your subscription.");
  const body = unwrap(data);
  return Array.isArray(body) ? body : body?.results || [];
}

export async function getSubscription(id) {
  const { data } = await http.get(`subscriptions/${id}/`);
  rejectEnvelope(data, "Couldn't load your subscription.");
  return unwrap(data);
}

// Everything the management card needs, newest first:
//   current   — the plan the company holds now (fresh from GET {id}/), or null
//   cancelled — with no current plan, the latest cancelled one (it can be
//               reactivated), or null
//   history   — every subscription
export async function getSubscriptionOverview() {
  const history = [...(await listSubscriptions())].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );
  const held =
    history.find((s) => !s.status || CURRENT_STATUSES.includes(s.status)) ||
    null;
  let current = held;
  if (held?.id) {
    try {
      current = (await getSubscription(held.id)) || held;
    } catch {
      /* the list's copy will do */
    }
  }
  const cancelled = held
    ? null
    : history.find((s) => s.status === "CANCELLED") || null;
  return { current, cancelled, history };
}

// → { checkout } when the upgrade needs a payment, else { subscription }.
export async function upgradeSubscription({
  planName,
  planType,
  planInterval,
}) {
  const { data } = await http.post(
    "subscriptions/upgrade/",
    {},
    {
      params: {
        plan_name: planName.toUpperCase(),
        plan_type: planType,
        ...(planInterval ? { plan_interval: planInterval } : {}),
      },
    },
  );
  rejectEnvelope(data, "Couldn't change your plan.");
  const checkout = findCheckout(data);
  return checkout ? { checkout } : { subscription: unwrap(data) };
}

export async function setAutoRenew(id, on) {
  const { data } = await http.post(
    `subscriptions/${id}/${on ? "activate" : "deactivate"}/`,
    {},
  );
  rejectEnvelope(
    data,
    on ? "Couldn't turn auto-renewal on." : "Couldn't turn auto-renewal off.",
  );
  return unwrap(data);
}

// Cancel = stop renewing (the plan runs to the end of the paid period);
// reactivate = renew again.
export const cancelSubscription = (id) => setAutoRenew(id, false);
export const reactivateSubscription = (id) => setAutoRenew(id, true);

// A link to update the saved card: emailed (→ null) or returned.
export async function requestCardUpdate(id, { email = false } = {}) {
  const { data } = await http.get(`subscriptions/${id}/payment-info/update/`, {
    params: { is_email: email ? "true" : "false" },
  });
  rejectEnvelope(data, "Couldn't get the card update link.");
  if (email) return null;
  const body = unwrap(data);
  return (
    findCheckout(data)?.authorization_url ||
    (typeof body === "string" && /^https?:\/\//.test(body) ? body : null) ||
    body?.link ||
    body?.url ||
    null
  );
}

export function subscriptionErrorMessage(err, fallback) {
  // Some failures nest the message: { data: { message } }.
  const body = err?.response?.data;
  const nested = !messageFromBody(body) && messageFromBody(body?.data?.message);
  return nested || apiErrorMessage(err, fallback);
}
