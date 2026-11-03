// "Invoices": proforma and sales invoices on one page, switched by tabs kept in
// ?type=proforma|sales. Each type keeps its own filter tabs (Draft · Published · Expired).
// Buyers only get sales invoices (the ones received, by status) — proformas
// reach them as offers under Received Offers.
import { useSearchParams } from "react-router-dom";
import { ReceiptText, Wallet } from "lucide-react";

import EventManagementPage from "@/pages/event-lists/EventManagementPage";
import { useAuth } from "@/services/context/app.context";
import { isBuyerView } from "@/services/api/event-lists.service";

const INVOICE_TYPES = [
  {
    key: "proforma",
    kind: "proforma",
    label: "Proforma invoices",
    icon: ReceiptText,
  },
  { key: "sales", kind: "salesInvoice", label: "Sales invoices", icon: Wallet },
];

export default function InvoicesPage() {
  const { jobTitle, viewMode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  if (isBuyerView(jobTitle, viewMode)) {
    return <EventManagementPage key="salesInvoice" kind="salesInvoice" />;
  }

  const active =
    INVOICE_TYPES.find((t) => t.key === searchParams.get("type")) ||
    INVOICE_TYPES[0];

  const kindTabs = {
    label: "Invoice type",
    active: active.key,
    tabs: INVOICE_TYPES,
    // Keep the filter tab (both types share the same tabs) when switching.
    onSelect: (key) => {
      const next = new URLSearchParams(searchParams);
      next.set("type", key);
      setSearchParams(next, { replace: true });
    },
  };

  return (
    <EventManagementPage
      key={active.kind}
      kind={active.kind}
      kindTabs={kindTabs}
    />
  );
}
