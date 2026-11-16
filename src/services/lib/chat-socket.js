// Real-time chat over WebSocket (mirrors notification-socket.js).
//
//   connect  wss://<this origin>/ws/chat/ — proxied to the backend, which
//            attaches the HttpOnly access cookie; a JS-held token is sent as
//            ?token= otherwise. With VITE_WS_URL set (Vercel) it connects there.
//   receive  { type: subscribed | unsubscribed | chat_message | chat_typing |
//              chat_read | inbox_update | error }
//   send     { action: subscribe, conversation_id } ·
//            { action: unsubscribe } · { action: typing, is_typing }
import { authStorage } from "@/services/lib/auth";
import { ENV } from "@/services/lib/env";

const socketUrl = () => {
  const { protocol, host } = window.location;
  const origin =
    ENV.WS_URL || `${protocol === "https:" ? "wss" : "ws"}://${host}`;
  const url = new URL(`${origin}/ws/chat/`);
  const token = authStorage.getAccessToken();
  if (token) url.searchParams.set("token", token);
  return url.toString();
};

// onMessage(msg) — every server frame, parsed.
// onStatus(status) — "connecting" | "live".
export function createChatSocket({ onMessage, onStatus }) {
  let ws = null;
  let stopped = false;
  let timer = null;
  let conversationId = null;

  const setStatus = (s) => onStatus?.(s);
  const schedule = (delay) => {
    clearTimeout(timer);
    timer = setTimeout(open, delay);
  };

  const send = (payload) => {
    if (ws?.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  };

  function open() {
    if (stopped) return;
    setStatus("connecting");
    try {
      ws = new WebSocket(socketUrl());
    } catch {
      schedule(2000);
      return;
    }
    const socket = ws;

    socket.onopen = () => {
      setStatus("live");
      if (conversationId) {
        send({ action: "subscribe", conversation_id: conversationId });
      }
    };

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      onMessage?.(msg);
    };

    socket.onclose = (event) => {
      if (ws === socket) ws = null;
      if (stopped || event.code === 1000) return;
      schedule(2000);
    };
    socket.onerror = () => {};
  }

  open();

  return {
    subscribe(id) {
      conversationId = String(id);
      send({ action: "subscribe", conversation_id: conversationId });
    },
    sendTyping(isTyping) {
      send({ action: "typing", is_typing: isTyping });
    },
    close() {
      stopped = true;
      clearTimeout(timer);
      if (ws) ws.close(1000);
      ws = null;
    },
  };
}
