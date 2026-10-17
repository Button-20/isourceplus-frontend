import { useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  ExternalLink,
  Flag,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentPositionString, mapsDirectionsUrl } from "@/utils/geo";
import {
  getWaybillDirections,
  waybillErrorMessage,
} from "@/services/api/waybills.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

const fmtDistance = (m) =>
  m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

const fmtDuration = (s) => {
  const mins = Math.round(s / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
};

const fmtDateTime = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";
};

const isPoint = (c) =>
  Array.isArray(c) && c.length === 2 && c.every((n) => Number.isFinite(n));

// Transporter route planner: driving distance, time and ETA from where they
// are (or any start point) to the delivery destination.
export default function WaybillDirectionsPanel({ waybill }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState(waybill?.destination || "");
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      setOrigin(await currentPositionString());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocating(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!origin.trim()) return toast.error("Enter where you're starting from.");
    if (!destination.trim()) return toast.error("Enter the destination.");
    setLoading(true);
    try {
      setResult(
        await getWaybillDirections(waybill.ref_num, { origin, destination }),
      );
    } catch (err) {
      setResult(null);
      toast.error(waybillErrorMessage(err, "Couldn't get directions."));
      console.error("Get directions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const from = result?.start?.coordinates;
  const to = result?.end?.coordinates;

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Route className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">Directions</h2>
          <p className="text-xs text-muted-foreground">
            Driving distance, time and ETA to the delivery point.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="route-origin" className={labelClass}>
              From
            </label>
            <div className="flex gap-2">
              <Input
                id="route-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Place, GA-123-4567 or 5.60, -0.18"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={useMyLocation}
                disabled={locating || loading}
                aria-label="Use my current location"
                className="shrink-0"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <label htmlFor="route-destination" className={labelClass}>
              To
            </label>
            <Input
              id="route-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Delivery destination"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding route…
              </>
            ) : (
              <>
                <Navigation className="mr-1.5 h-4 w-4" /> Get directions
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="space-y-4 border-t border-border/60 pt-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Distance", fmtDistance(result.distanceM)],
                ["Driving time", fmtDuration(result.durationS)],
                ["ETA", fmtDateTime(result.etaIso)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 font-display text-base font-semibold">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <ul className="space-y-2 text-sm">
              {result.start?.name && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{result.start.name}</span>
                </li>
              )}
              {result.end?.name && (
                <li className="flex items-start gap-2">
                  <Flag className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{result.end.name}</span>
                </li>
              )}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Estimate
                {result.provider ? ` from ${result.provider}` : ""}
              </span>
              {isPoint(from) && isPoint(to) && (
                <a
                  href={mapsDirectionsUrl(from, to)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                >
                  Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
