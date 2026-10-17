import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LocateFixed, MapPinCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { currentPositionString } from "@/utils/geo";
import {
  markWaybillArrived,
  waybillErrorMessage,
} from "@/services/api/waybills.service";

// Transporter marks arrival at the delivery location (POST
// waybills/<ref>/arrived/ { location }). Coordinates are stored on the
// waybill; a place name is recorded in its notes. `onArrived(waybill)` gets
// the updated waybill when the response includes it.
export default function MarkArrivalModal({
  open,
  onOpenChange,
  refNum,
  defaultLocation = "",
  onArrived,
}) {
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setLocation(defaultLocation);
  }, [open, defaultLocation]);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      setLocation(await currentPositionString());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocating(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!location.trim()) return toast.error("Enter your arrival location.");
    setSaving(true);
    try {
      const { waybill, message } = await markWaybillArrived(refNum, location);
      toast.success(message || "Arrival recorded.");
      onArrived?.(waybill);
      onOpenChange(false);
    } catch (err) {
      toast.error(waybillErrorMessage(err, "Couldn't record the arrival."));
      console.error("Mark arrival error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinCheck className="h-5 w-5 text-brand" /> Mark arrival
          </DialogTitle>
          <DialogDescription>
            Let the receiver know you&apos;ve arrived at the delivery location.
            Using your current location also records it on the waybill.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="arrival-location"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Location <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                id="arrival-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kumasi Central Market or 6.69, -1.62"
                className="flex-1"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={useMyLocation}
                disabled={locating || saving}
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

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !location.trim()}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording…
                </>
              ) : (
                <>
                  <MapPinCheck className="mr-1.5 h-4 w-4" /> Mark arrival
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
