import { StatusBadge } from "@/components/detail/DetailShell";
import { TICKET_STATUS } from "@/services/api/helpdesk.service";

// Helpdesk ticket status (1–5) as a coloured pill.
export default function TicketStatus({ status }) {
  const s = TICKET_STATUS[status];
  return s ? (
    <StatusBadge label={s.label} tone={s.tone} />
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}
