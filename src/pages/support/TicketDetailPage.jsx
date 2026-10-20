// One helpdesk ticket (GET my-tickets/<id>/). Read-only for submitters:
// status, due date and resolution are set by the support team.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, LifeBuoy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DetailCard,
  DetailGrid,
  DetailHeader,
  DetailPage,
  Row,
  Section,
} from "@/components/detail/DetailShell";
import TicketStatus from "@/components/support/TicketStatus";
import {
  TICKET_PRIORITY,
  getMyTicket,
  helpdeskErrorMessage,
} from "@/services/api/helpdesk.service";

const fmt = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";
};

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getMyTicket(ticketId)
      .then((t) => !cancelled && setTicket(t))
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.status === 404
            ? "This ticket doesn't exist or wasn't filed by your company."
            : helpdeskErrorMessage(err, "Couldn't load this ticket."),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const back = () => navigate("/dashboard/support");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">Ticket not found</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-5" onClick={back}>
            Back to support
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DetailPage onBack={back} backLabel="Back to support">
      <DetailCard>
        <DetailHeader
          icon={LifeBuoy}
          title={ticket.title}
          subtitle={`Ticket #${ticket.id}`}
          badge={<TicketStatus status={ticket.status} />}
        />

        <Section title="Ticket details">
          <DetailGrid>
            <Row label="Priority">
              {TICKET_PRIORITY[ticket.priority] || "—"}
            </Row>
            <Row label="Queue">{ticket.queue || "—"}</Row>
            <Row label="Filed">{fmt(ticket.created)}</Row>
            <Row label="Last updated">{fmt(ticket.modified)}</Row>
            {ticket.due_date && <Row label="Due">{fmt(ticket.due_date)}</Row>}
          </DetailGrid>
        </Section>

        <Section title="Description">
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {ticket.description}
          </p>
        </Section>

        {ticket.resolution ? (
          <Section title="Resolution">
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="whitespace-pre-line leading-relaxed">
                {ticket.resolution}
              </p>
            </div>
          </Section>
        ) : null}
      </DetailCard>
    </DetailPage>
  );
}
