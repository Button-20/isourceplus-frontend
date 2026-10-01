// Cross-entity backend "choices" endpoints (enums the backend owns). Each
// returns the raw payload; callers normalize with `normalizeChoices` from
// "@/utils/choices". Base URL + CSRF/cookies come from the shared http client.
import http from "@/services/lib/http";

// GET country-choices/ — shared by the company and transporter forms.
export async function getCountryChoices() {
  const { data } = await http.get("country-choices/");
  return data;
}

// GET spend-category-choices/ — `spend_category` enum (agriculture,
// banking_finance, construction, … slugs) used by the RFx / tender forms.
export async function getSpendCategoryChoices() {
  const { data } = await http.get("spend-category-choices/");
  return data;
}

// GET procurement/type-choices/ — `procurement_type` enum (product, service,
// subscription, rental, lease, maintenance, project, …) for RFx / tenders.
export async function getProcurementTypeChoices() {
  const { data } = await http.get("procurement/type-choices/");
  return data;
}

// GET priority-choices/ — `priority` enum ("non urgent" / "urgent") shared by
// RFx, tenders, waybills, proforma offers and the invoice/payment edit forms.
export async function getPriorityChoices() {
  const { data } = await http.get("priority-choices/");
  return data;
}

// GET delivery-choices/ — `do_delivery` enum ("self", …) for RFx and company
// proforma offers.
export async function getDeliveryChoices() {
  const { data } = await http.get("delivery-choices/");
  return data;
}

// GET method-choices/ — sourcing `method` enum ("general sourcing",
// "client sourcing"). The bare path is the documented one; if the backend only
// exposes the tender-scoped alias, fall back to it so the list still loads.
export async function getMethodChoices() {
  try {
    const { data } = await http.get("method-choices/");
    return data;
  } catch (err) {
    if (err.response?.status !== 404) throw err;
    const { data } = await http.get("tender/method-choices/");
    return data;
  }
}

// GET procedure-choices/ — `procedure` enum (open / sealed) for RFx, tenders
// and waybills.
export async function getProcedureChoices() {
  const { data } = await http.get("procedure-choices/");
  return data;
}

// GET tender/type-choices/ — tender `type` enum (nct / ict).
export async function getTenderTypeChoices() {
  const { data } = await http.get("tender/type-choices/");
  return data;
}

// GET item/unit-of-measure-choices/ — item rows on RFx / tender / waybill.
export async function getUnitOfMeasureChoices() {
  const { data } = await http.get("item/unit-of-measure-choices/");
  return data;
}

// GET item/extra-value-choices/ — waybill item `extra_value`.
export async function getExtraValueChoices() {
  const { data } = await http.get("item/extra-value-choices/");
  return data;
}

// GET currency-choices/ — currency enum (GHS, NGN, …); shared by purchase
// orders, sales invoices, payment orders and proforma invoices.
export async function getCurrencyChoices() {
  const { data } = await http.get("currency-choices/");
  return data;
}

// GET vat/type-choices/ — proforma `vat_type` (exclusive / inclusive …).
export async function getVatTypeChoices() {
  const { data } = await http.get("vat/type-choices/");
  return data;
}

// GET purchase-order/type-choices/ — purchase order `type` (npo, …).
export async function getPurchaseOrderTypeChoices() {
  const { data } = await http.get("purchase-order/type-choices/");
  return data;
}

// GET payment-method-choices/ — purchase order `preferred_payment_channel`
// (MoMo, Bank, …).
export async function getPaymentMethodChoices() {
  const { data } = await http.get("payment-method-choices/");
  return data;
}

// GET purchase-order/fund-escrow/choices/ — purchase order `fund_escrow`
// (yes / no).
export async function getFundEscrowChoices() {
  const { data } = await http.get("purchase-order/fund-escrow/choices/");
  return data;
}
