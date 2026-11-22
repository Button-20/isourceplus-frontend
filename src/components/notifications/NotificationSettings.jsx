// Notification settings (GET notification-settings/get-or-create/, saved with
// PATCH notification-settings/<id>/). When the socket is live the same
// choices are pushed over it (update_preferences) so they apply at once.
//
// quiet_hours_enabled is a list of times — read here as [start, end]; empty
// means no quiet hours. enabled_categories is free text (≤ 20 chars each).
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Mail,
  MessageSquare,
  Moon,
  RefreshCw,
  Save,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getNotificationSettings,
  notificationErrorMessage,
  updateNotificationSettings,
} from "@/services/api/notifications.service";
import { useNotifications } from "@/services/context/notifications.context";

// "22:00:00" ↔ "22:00" for <input type="time">.
const toInput = (t) => (t ? String(t).slice(0, 5) : "");
const toApi = (t) => (t ? `${t}:00` : "");

const fromSettings = (s = {}) => ({
  push: Boolean(s.receive_push_notifications),
  email: Boolean(s.receive_email_notifications),
  sms: Boolean(s.receive_sms_notifications),
  categories: Array.isArray(s.enabled_categories) ? s.enabled_categories : [],
  quietStart: toInput(s.quiet_hours_enabled?.[0]),
  quietEnd: toInput(s.quiet_hours_enabled?.[1]),
});

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        checked ? "bg-brand" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

const CHANNELS = [
  ["push", Smartphone, "Push notifications", "In-app and browser alerts."],
  ["email", Mail, "Email", "A copy of each notification by email."],
  ["sms", MessageSquare, "SMS", "Text messages for important updates."],
];

export default function NotificationSettings() {
  const ctx = useNotifications();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(fromSettings());
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getNotificationSettings();
      setSettings(data);
      setForm(fromSettings(data));
      setAvailableCategories(
        Array.isArray(data.available_categories) ? data.available_categories : [],
      );
    } catch (err) {
      setError(
        notificationErrorMessage(
          err,
          "Couldn't load your notification settings.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCategory = (value) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(value)
        ? f.categories.filter((c) => c !== value)
        : [...f.categories, value],
    }));
  };

  const quietPartial = Boolean(form.quietStart) !== Boolean(form.quietEnd);

  const save = async () => {
    if (!settings?.id || quietPartial) return;
    setSaving(true);
    const quiet =
      form.quietStart && form.quietEnd
        ? [toApi(form.quietStart), toApi(form.quietEnd)]
        : [];
    try {
      const data = await updateNotificationSettings(settings.id, {
        receive_push_notifications: form.push,
        receive_email_notifications: form.email,
        receive_sms_notifications: form.sms,
        enabled_categories: form.categories,
        quiet_hours_enabled: quiet,
      });
      ctx?.updatePreferences({
        email_notifications: form.email,
        push_notifications: form.push,
        quiet_hours_enabled: quiet.length > 0,
        categories: form.categories,
      });
      if (data && typeof data === "object" && data.id) {
        setSettings(data);
        setForm(fromSettings(data));
      }
      toast.success("Notification settings saved.");
    } catch (err) {
      toast.error(
        notificationErrorMessage(
          err,
          "Couldn't save your notification settings.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
        settings…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="mt-3 font-medium">Couldn&apos;t load settings</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={load}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      <section className="p-5 sm:p-6">
        <h2 className="font-semibold">Channels</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose how you hear about activity on your documents.
        </p>
        <ul className="mt-4 space-y-3">
          {CHANNELS.map(([key, Icon, title, hint]) => (
            <li
              key={key}
              className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Toggle
                checked={form[key]}
                onChange={set(key)}
                disabled={saving}
                label={title}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Moon className="h-4 w-4 text-brand" /> Quiet hours
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Hold push and SMS alerts between these times. Leave both empty to turn
          quiet hours off.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium">From</span>
            <Input
              type="time"
              value={form.quietStart}
              onChange={(e) => set("quietStart")(e.target.value)}
              disabled={saving}
              className="w-36"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">To</span>
            <Input
              type="time"
              value={form.quietEnd}
              onChange={(e) => set("quietEnd")(e.target.value)}
              disabled={saving}
              className="w-36"
            />
          </label>
          {(form.quietStart || form.quietEnd) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setForm((f) => ({ ...f, quietStart: "", quietEnd: "" }))
              }
              disabled={saving}
            >
              Clear
            </Button>
          )}
        </div>
        {quietPartial && (
          <p className="mt-2 text-xs text-destructive">
            Set both a start and an end time.
          </p>
        )}
      </section>

      <section className="p-5 sm:p-6">
        <h2 className="font-semibold">Categories</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Only notify me about these categories. Leave all unchecked to receive
          everything.
        </p>
        {availableCategories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {availableCategories.map((c) => {
              const selected = form.categories.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  disabled={saving}
                  onClick={() => toggleCategory(c.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50",
                    selected
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground",
                  )}
                >
                  {selected && <span aria-hidden>✓</span>}
                  {c.label}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No categories are available for your account type.
          </p>
        )}
      </section>

      <div className="flex justify-end gap-2 p-5 sm:p-6">
        <Button
          variant="outline"
          onClick={() => setForm(fromSettings(settings))}
          disabled={saving}
        >
          Reset
        </Button>
        <Button onClick={save} disabled={saving || quietPartial}>
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save settings
        </Button>
      </div>
    </div>
  );
}
