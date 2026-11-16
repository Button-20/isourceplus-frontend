// "Messages": the org's chat inbox — every conversation the organisation is a
// party to, newest activity first, with counterpart, last message and unread
// count. Chats are started from a document's "chat issuer" button.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  chatErrorMessage,
  listConversations,
} from "@/services/api/chat.service";

const fmt = (v) => {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
};

const initials = (name) =>
  (name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Avatar({ name, logo }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name || ""}
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
      {initials(name)}
    </div>
  );
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listConversations());
    } catch (err) {
      toast.error(chatErrorMessage(err, "Couldn't load your messages."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full space-y-6 font-montserrat">
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <MessageSquare className="h-3.5 w-3.5" /> Messages
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Conversations
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Chat with the organisations you do business with.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <RefreshCw
              className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 font-medium">No conversations yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Open a document you received and tap “Chat issuer” to start a
              conversation.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/messages/${c.id}`)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
                >
                  <Avatar
                    name={c.counterpart?.name}
                    logo={c.counterpart?.logo}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">
                        {c.counterpart?.name || "Unknown organisation"}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {fmt(c.updated_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {c.subject && (
                        <span className="font-medium text-foreground">
                          {c.subject} ·{" "}
                        </span>
                      )}
                      {c.last_message?.preview || "No messages yet"}
                    </p>
                  </div>
                  {Number(c.unread_count) > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
