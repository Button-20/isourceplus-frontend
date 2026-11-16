// A single chat thread: counterpart header, message list, and a composer with
// text + file attachments. Messages arrive over WebSocket and are sent over
// the REST API (so attachments work); the socket only delivers events.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Flag,
  Loader2,
  Paperclip,
  Send,
  ShieldOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  blockConversation,
  chatErrorMessage,
  getConversation,
  listMessages,
  markConversationRead,
  reportMessage,
  sendMessage,
} from "@/services/api/chat.service";
import { createChatSocket } from "@/services/lib/chat-socket";

const fmt = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })
    : "";
};

const mergeMessages = (prev, incoming) => {
  const map = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming || []) if (m?.id) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
};

export default function ConversationPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimer = useRef(null);

  const counterpart = conversation?.counterpart;

  const markRead = useCallback(() => {
    if (conversationId) markConversationRead(conversationId).catch(() => {});
  }, [conversationId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [conv, msgs] = await Promise.all([
        getConversation(conversationId),
        listMessages(conversationId),
      ]);
      setConversation(conv);
      setMessages(msgs);
    } catch (err) {
      toast.error(chatErrorMessage(err, "Couldn't load this conversation."));
      navigate("/dashboard/messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, navigate]);

  // Socket: subscribe to this conversation and merge incoming events.
  useEffect(() => {
    const socket = createChatSocket({
      onMessage: (msg) => {
        if (msg?.type === "chat_message" && msg.message) {
          setMessages((prev) => mergeMessages(prev, [msg.message]));
          if (!msg.message.is_mine) markRead();
        } else if (msg?.type === "chat_typing") {
          setTyping(Boolean(msg.is_typing));
        }
      },
      onStatus: () => {},
    });
    socketRef.current = socket;
    socket.subscribe(conversationId);
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [conversationId, markRead]);

  useEffect(() => {
    load();
    markRead();
  }, [load, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendTyping = (on) => {
    const socket = socketRef.current;
    clearTimeout(typingTimer.current);
    if (!on) {
      socket?.sendTyping(false);
      return;
    }
    socket?.sendTyping(true);
    typingTimer.current = setTimeout(() => sendTyping(false), 1500);
  };

  const handleText = (v) => {
    setText(v);
    sendTyping(Boolean(v.trim()));
  };

  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  };

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body && !files.length) return;
    setSending(true);
    try {
      const msg = await sendMessage({
        conversationId,
        body,
        attachments: files,
      });
      setMessages((prev) => mergeMessages(prev, [msg]));
      setText("");
      setFiles([]);
      sendTyping(false);
      markRead();
    } catch (err) {
      toast.error(chatErrorMessage(err, "Couldn't send the message."));
    } finally {
      setSending(false);
    }
  };

  const report = async (message) => {
    const reason = window.prompt("Why are you reporting this message?");
    if (!reason) return;
    try {
      await reportMessage(message.id, { reason, details: "" });
      toast.success("Thanks — we'll review this message.");
    } catch (err) {
      toast.error(chatErrorMessage(err, "Couldn't report this message."));
    }
  };

  const block = async () => {
    if (
      !window.confirm(
        "Block this organisation? They won't be able to message you.",
      )
    )
      return;
    try {
      await blockConversation(conversationId);
      toast.success("Organisation blocked.");
      navigate("/dashboard/messages");
    } catch (err) {
      toast.error(chatErrorMessage(err, "Couldn't block this organisation."));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card font-montserrat">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/messages")}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {counterpart?.name || "Conversation"}
          </p>
          {conversation.subject && (
            <p className="truncate text-xs text-muted-foreground">
              {conversation.subject}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={block}>
          <ShieldOff className="mr-1.5 h-4 w-4" /> Block
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Say hello to start the conversation.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.is_mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "group relative max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                m.is_mine
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-line break-words">{m.body}</p>
              {m.attachments?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs underline"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{a.filename}</span>
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                {!m.is_mine && (
                  <button
                    type="button"
                    onClick={() => report(m)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Report"
                    title="Report"
                  >
                    <Flag className="h-3 w-3" />
                  </button>
                )}
                {fmt(m.created_at)}
              </div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2 text-xs text-muted-foreground">
              typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="border-t border-border/60 px-4 py-3">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="max-w-[180px] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, j) => j !== i))
                  }
                  aria-label="Remove"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={pickFiles}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach files"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={text}
            onChange={(e) => handleText(e.target.value)}
            placeholder="Write a message…"
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={sending || (!text.trim() && !files.length)}
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
