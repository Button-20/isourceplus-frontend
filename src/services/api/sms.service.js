// SMS resale domain service.
//
//   All plans:           GET  plans/sms/
//   Balance:             GET  customer/sms/balance/
//   Purchase units:      POST customer/sms/purchase/          { plan_id }
//   Transactions:        GET  customer/sms/transactions/
//   Sent history:        GET  customer/sms/sent-SMS/history/
//   Send single / bulk:  POST customer/sms/send/  { message, recipients: [] }
//
// The backend deliberately merges "send" and "send_bulk" into one endpoint —
// a single recipient is just a one-element `recipients` array.
import http from "@/services/lib/http";

export async function getSmsPlans() {
  const { data } = await http.get("plans/sms/");
  return data;
}

export async function getSmsBalance() {
  const { data } = await http.get("customer/sms/balance/");
  return data;
}

// `planId` comes from the plan the user clicked in "All SMS plans".
export async function purchaseSmsUnits(planId) {
  const { data } = await http.post("customer/sms/purchase/", {
    plan_id: String(planId),
  });
  return data;
}

export async function getSmsTransactions() {
  const { data } = await http.get("customer/sms/transactions/");
  return data;
}

export async function getSentSmsHistory() {
  const { data } = await http.get("customer/sms/sent-SMS/history/");
  return data;
}

export async function sendSms({ message, recipients }) {
  const { data } = await http.post("customer/sms/send/", {
    message,
    recipients,
  });
  return data;
}
