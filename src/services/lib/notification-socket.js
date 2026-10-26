// Real-time notifications over WebSocket (SwaggerHub
// "notifications_wbsocket", AsyncAPI, 2026-10-26).
//
//   connect   wss://<this origin>/ws/notifications/ — proxied to the backend
//             (vite.config.js / server.js), which attaches the HttpOnly access
//             cookie as the JWT. A JS-held access token (bearer backends) is
//             sent as ?token= instead.
//   receive   { type: initial_data | new_notification | unread_count_update |
//             mark_read_success | mark_all_progress | mark_all_success |
//             preferences_updated | category_notification | token_updated |
//             auth_expired | success | error | system_message, … }
//   send      { action: mark_read, notification_id } · { action:
//             mark_all_read } · { action: update_preferences, preferences } ·
//             { action: subscribe_category, category, subscribe_action } ·
//             { action: update_token, token }
//   close     4001 unauthenticated · 4002 auth timeout · 4003 forbidden /
//             notifications disabled · 4004 access token expired
//
// The access token lives 5 minutes. With cookie auth page JS can't read it to
// send `update_token`, so on expiry (auth_expired / 4001 / 4004) this
// refreshes the session (rotating the cookie) and reconnects instead.
import { authStorage } from "@/services/lib/auth";

const MAX_DELAY_MS = 30000;
// After this many failed attempts in a row the caller is told the socket is
// unavailable (and falls back to polling); retries continue, just slower.
const FAILURES_BEFORE_UNAVAILABLE = 3;
const UNAVAILABLE_RETRY_MS = 60000;

const socketUrl = () => {
  const { protocol, host } = window.location;
  const url = new URL(
    `${protocol === "https:" ? "wss" : "ws"}://${host}/ws/notifications/`,
  );
  const token = authStorage.getAccessToken();
  if (token) url.searchParams.set("token", token);
  return url.toString();
};

// onMessage(msg) — every server frame, parsed.
// onStatus(status) — "connecting" | "live" | "unavailable" | "forbidden".
// refresh() — rotates the session; resolves truthy on success.
export function createNotificationSocket({ onMessage, onStatus, refresh }) {
  let ws = null;
  let stopped = false;
  let failures = 0;
  let timer = null;
  let refreshedForThisFailure = false;

  const setStatus = (s) => onStatus?.(s);

  const schedule = (delay) => {
    clearTimeout(timer);
    timer = setTimeout(open, delay);
  };

  const retry = () => {
    if (stopped) return;
    failures += 1;
    if (failures >= FAILURES_BEFORE_UNAVAILABLE) {
      setStatus("unavailable");
      schedule(UNAVAILABLE_RETRY_MS);
    } else {
      schedule(Math.min(1000 * 2 ** (failures - 1), MAX_DELAY_MS));
    }
  };

  const reauthAndRetry = async () => {
    if (stopped) return;
    if (!refreshedForThisFailure) {
      refreshedForThisFailure = true;
      try {
        if (await refresh?.()) {
          schedule(0);
          return;
        }
      } catch {
        /* fall through to the normal backoff */
      }
    }
    retry();
  };

  function open() {
    if (stopped) return;
    setStatus(
      failures >= FAILURES_BEFORE_UNAVAILABLE ? "unavailable" : "connecting",
    );
    try {
      ws = new WebSocket(socketUrl());
    } catch {
      retry();
      return;
    }
    const socket = ws;

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg?.type === "initial_data") {
        failures = 0;
        refreshedForThisFailure = false;
        setStatus("live");
      }
      onMessage?.(msg);
    };

    socket.onclose = (event) => {
      if (ws === socket) ws = null;
      if (stopped || event.code === 1000) return;
      if (event.code === 4003) {
        // Profile inactive / notifications disabled — retrying won't help.
        setStatus("forbidden");
        return;
      }
      if ([4001, 4002, 4004].includes(event.code)) {
        reauthAndRetry();
        return;
      }
      retry();
    };
    // onerror is always followed by onclose; nothing to do here.
    socket.onerror = () => {};
  }

  open();

  return {
    // → true when the frame went out (socket open).
    send(payload) {
      if (ws?.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify(payload));
      return true;
    },
    isOpen: () => ws?.readyState === WebSocket.OPEN,
    close() {
      stopped = true;
      clearTimeout(timer);
      if (ws) ws.close(1000);
      ws = null;
    },
  };
}
