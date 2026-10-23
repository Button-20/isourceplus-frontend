// "Waybills": owners (lead buyers / sales managers) switch between in-house
// and out-sourced waybills (?source=in-house|out-sourced), each with
// Draft · Published · Expired. Transporters get Published plus their carried
// waybills by tracking status (see event-lists.service).
import { useSearchParams } from "react-router-dom";
import { Truck, Warehouse } from "lucide-react";

import EventManagementPage from "@/pages/event-lists/EventManagementPage";
import { useAuth } from "@/services/context/app.context";
import { isEventOwner } from "@/services/api/event-lists.service";

const SOURCES = [
  { key: "in-house", label: "In-house", icon: Warehouse },
  { key: "out-sourced", label: "Out-sourced", icon: Truck },
];

export default function WaybillsPage() {
  const { jobTitle, viewMode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOwner = isEventOwner("waybill", jobTitle, viewMode);

  if (!isOwner) return <EventManagementPage key="waybill" kind="waybill" />;

  const active =
    SOURCES.find((s) => s.key === searchParams.get("source")) || SOURCES[0];
  const kindTabs = {
    label: "Waybill type",
    active: active.key,
    tabs: SOURCES,
    // Keep the status tab when switching source.
    onSelect: (key) => {
      const next = new URLSearchParams(searchParams);
      next.set("source", key);
      setSearchParams(next, { replace: true });
    },
  };

  return (
    <EventManagementPage
      key={`waybill-${active.key}`}
      kind="waybill"
      kindTabs={kindTabs}
      listContext={{ source: active.key }}
    />
  );
}
