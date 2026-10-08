import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, PackageCheck } from "lucide-react";

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
import {
  confirmGoodsReceipt,
  escrowErrorMessage,
} from "@/services/api/escrow.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const EMPTY = { receiver_name: "", vehicle_number: "", gps_address: "" };

// Buyer confirms the goods / service arrived: who received it, the delivery
// vehicle and where. The backend then creates a draft GRN for inspection.
// `onConfirmed(result)` runs on success.
export default function ConfirmReceiptModal({
  open,
  onOpenChange,
  refNum,
  onConfirmed,
}) {
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (open) setValues(EMPTY);
  }, [open]);

  const set = (key) => (e) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  // Fill the GPS field from the device location ("lat, lng").
  const useMyLocation = () => {
    if (!navigator.geolocation)
      return toast.error("Location isn't available on this device.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValues((v) => ({
          ...v,
          gps_address: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
        }));
        setLocating(false);
      },
      () => {
        toast.error("Couldn't get your location. Enter it manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      receiver_name: values.receiver_name.trim(),
      vehicle_number: values.vehicle_number.trim(),
      gps_address: values.gps_address.trim(),
    };
    if (!body.receiver_name)
      return toast.error("Please enter who received the goods.");
    setSaving(true);
    try {
      const result = await confirmGoodsReceipt(refNum, body);
      toast.success(
        result?.message ||
          "Receipt confirmed. Inspect the goods received note below.",
      );
      onConfirmed?.(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(escrowErrorMessage(err, "Couldn't confirm receipt."));
      console.error("Confirm receipt error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-brand" /> Confirm receipt
          </DialogTitle>
          <DialogDescription>
            Confirm the goods or service arrived. A goods received note is
            created for you to inspect before paying.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="receiver_name" className={labelClass}>
              Received by <span className="text-destructive">*</span>
            </label>
            <Input
              id="receiver_name"
              value={values.receiver_name}
              onChange={set("receiver_name")}
              placeholder="Name of the person who received it"
              maxLength={255}
              required
            />
          </div>
          <div>
            <label htmlFor="vehicle_number" className={labelClass}>
              Vehicle number
            </label>
            <Input
              id="vehicle_number"
              value={values.vehicle_number}
              onChange={set("vehicle_number")}
              placeholder="e.g. GR 1234-24"
              maxLength={32}
            />
          </div>
          <div>
            <label htmlFor="gps_address" className={labelClass}>
              GPS address
            </label>
            <div className="flex gap-2">
              <Input
                id="gps_address"
                value={values.gps_address}
                onChange={set("gps_address")}
                placeholder="e.g. GA-123-4567 or 5.6037, -0.1870"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={useMyLocation}
                disabled={locating || saving}
                className="shrink-0"
                aria-label="Use my current location"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
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
              disabled={saving || !values.receiver_name.trim()}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…
                </>
              ) : (
                <>
                  <PackageCheck className="mr-1.5 h-4 w-4" /> Confirm receipt
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
