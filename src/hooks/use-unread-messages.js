// Total unread message count across all conversations, for the sidebar's
// "Messages" badge. Updated from REST, the chat WebSocket's `inbox_update`
// event, and a visibility-aware poll as a fallback.
import { useCallback, useEffect, useState } from "react";

import { listConversations } from "@/services/api/chat.service";
import { createChatSocket } from "@/services/lib/chat-socket";

const POLL_MS = 30000;

export function useUnreadMessages(enabled = true) {
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const conversations = await listConversations();
      const total = (conversations || []).reduce(
        (sum, c) => sum + (Number(c?.unread_count) || 0),
        0,
      );
      setUnread(total);
    } catch {
      // Keep the previous count; the next poll/socket event retries.
    } finally {
      setLoaded(true);
    }
  }, [enabled]);

  // Initial REST snapshot, then re-fetch on visibility changes.
  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, load]);

  // Live updates: the chat socket joins the user's channel on connect, so the
  // backend's `inbox_update` broadcast (sent when a message lands) reaches us
  // without subscribing to a specific conversation.
  useEffect(() => {
    if (!enabled) return undefined;
    const socket = createChatSocket({
      onMessage: (msg) => {
        if (msg?.type === "inbox_update") load();
      },
      onStatus: () => {},
    });
    return () => socket.close();
  }, [enabled, load]);

  // Poll fallback while the socket is down (or never connected).
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, load]);

  return { unread, loaded };
}
