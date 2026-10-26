// Notifications for the signed-in user: the WebSocket when it's up, REST
// polling when it isn't. Mounted by DashboardLayout; read with
// useNotifications() (the bell, the Notifications page).
//
//   mode "live"     socket connected — initial_data seeds the list, then
//                   new_notification / unread_count_update keep it current
//   mode "polling"  socket unavailable — notifications/all/ every minute
//                   (while the tab is visible); unread is counted from the
//                   first page
//   mode "off"      the backend refused the socket (4003: notifications
//                   disabled / inactive profile) — REST only, no toasts
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { refreshSession } from "@/services/api/auth.service";
import {
  archiveNotification,
  forgetRead,
  listNotifications,
  markNotificationUnread,
  normalizeNotification,
  rememberRead,
} from "@/services/api/notifications.service";
import { createNotificationSocket } from "@/services/lib/notification-socket";

const POLL_MS = 60000;
const RECENT_LIMIT = 20;

const NotificationsContext = createContext(null);

const unreadIn = (items) => items.filter((n) => !n.read).length;

export function NotificationsProvider({ enabled = true, children }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState("connecting");
  const [preferences, setPreferences] = useState(null);
  const [loaded, setLoaded] = useState(false);
  // The REST inbox isn't on the server yet (and the socket isn't up).
  const [unavailable, setUnavailable] = useState(false);
  // Bumped on every server-side change so pages holding their own list
  // (the Notifications page) know to reload.
  const [revision, setRevision] = useState(0);
  const socketRef = useRef(null);
  // The latest list, for handlers that must decide before setState runs.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const live = status === "live";

  const loadRest = useCallback(async () => {
    try {
      const res = await listNotifications();
      const recent = res.items.slice(0, RECENT_LIMIT);
      setItems(recent);
      setUnread(unreadIn(res.items));
      setUnavailable(false);
    } catch (err) {
      // Otherwise keep what we have; the next poll retries.
      if (err?.unavailable) setUnavailable(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  const onMessage = useCallback((msg) => {
    switch (msg?.type) {
      case "initial_data":
        setItems(
          (msg.recent_notifications || [])
            .map(normalizeNotification)
            .slice(0, RECENT_LIMIT),
        );
        setUnread(Number(msg.unread_count) || 0);
        setPreferences(msg.user_preferences || null);
        setLoaded(true);
        setUnavailable(false);
        break;
      case "new_notification":
      case "category_notification": {
        const n = normalizeNotification(msg.notification);
        if (!n.id || itemsRef.current.some((p) => p.id === n.id)) break;
        itemsRef.current = [n, ...itemsRef.current].slice(0, RECENT_LIMIT);
        setItems(itemsRef.current);
        if (!n.read) setUnread((c) => c + 1);
        setRevision((r) => r + 1);
        toast(n.title || "New notification", {
          description: n.message || undefined,
        });
        break;
      }
      case "unread_count_update":
        setUnread(Number(msg.count) || 0);
        break;
      case "mark_read_success":
        setItems((prev) =>
          prev.map((n) =>
            n.id === String(msg.notification_id) ? { ...n, read: true } : n,
          ),
        );
        setUnread(Number(msg.unread_count) || 0);
        break;
      case "mark_all_success":
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);
        setRevision((r) => r + 1);
        break;
      case "preferences_updated":
        if (msg.preferences) setPreferences(msg.preferences);
        break;
      case "system_message":
        if (msg.message) toast.info(msg.message);
        break;
      default:
        break;
    }
  }, []);

  // The socket, for as long as the user is signed in.
  useEffect(() => {
    if (!enabled) return undefined;
    const socket = createNotificationSocket({
      onMessage,
      onStatus: setStatus,
      refresh: () => refreshSession().catch(() => false),
    });
    socketRef.current = socket;
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, onMessage]);

  // A REST snapshot straight away (the socket may take a while, or never
  // come), then polling whenever the socket isn't live.
  useEffect(() => {
    if (!enabled) return undefined;
    loadRest();
  }, [enabled, loadRest]);

  useEffect(() => {
    if (!enabled || live || status === "connecting") return undefined;
    const tick = () => {
      if (document.visibilityState === "visible") loadRest();
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, live, status, loadRest]);

  const patchItem = (id, fields) =>
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...fields } : n)),
    );

  // Over the socket when live; otherwise opening the notification over REST
  // is the closest thing to a mark-as-read.
  const markRead = useCallback(
    async (id) => {
      const target = items.find((n) => n.id === id);
      if (target && !target.read) {
        patchItem(id, { read: true });
        setUnread((c) => Math.max(0, c - 1));
      }
      if (
        !socketRef.current?.send({ action: "mark_read", notification_id: id })
      )
        rememberRead(id);
    },
    [items],
  );

  const markUnread = useCallback(async (id) => {
    const detail = await markNotificationUnread(id);
    forgetRead(id);
    if (itemsRef.current.find((n) => n.id === id)?.read) {
      patchItem(id, { read: false });
      setUnread((c) => c + 1);
    }
    return detail;
  }, []);

  // No REST mark-all: without the socket, remember every one we've shown
  // (`ids` — the caller's own list — plus the recent ones) as read.
  const markAllRead = useCallback(async (ids = []) => {
    if (socketRef.current?.send({ action: "mark_all_read" })) return true;
    [...ids, ...itemsRef.current.map((n) => n.id)].forEach(rememberRead);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    return true;
  }, []);

  const archive = useCallback(
    async (id) => {
      const detail = await archiveNotification(id);
      const target = items.find((n) => n.id === id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.read) setUnread((c) => Math.max(0, c - 1));
      return detail;
    },
    [items],
  );

  // → false when the socket isn't connected (the caller saves over REST).
  const updatePreferences = useCallback(
    (prefs) =>
      Boolean(
        socketRef.current?.send({
          action: "update_preferences",
          preferences: prefs,
        }),
      ),
    [],
  );

  const value = useMemo(
    () => ({
      items,
      unread,
      loaded,
      unavailable,
      revision,
      preferences,
      mode: live ? "live" : status === "forbidden" ? "off" : "polling",
      connecting: status === "connecting",
      refresh: loadRest,
      markRead,
      markUnread,
      markAllRead,
      archive,
      updatePreferences,
    }),
    [
      items,
      unread,
      loaded,
      unavailable,
      revision,
      preferences,
      live,
      status,
      loadRest,
      markRead,
      markUnread,
      markAllRead,
      archive,
      updatePreferences,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
