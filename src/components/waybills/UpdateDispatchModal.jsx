import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";

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
  updateWaybillDispatch,
  waybillErrorMessage,
} from "@/services/api/waybills.service";

// Update a waybill's dispatch data (vehicle + driver) via
// POST waybills/<ref>/update-dispatch/. `onUpdated(waybill)` receives the
// updated waybill fields when the request succeeds.
export default function UpdateDispatchModal({
  open,
  onOpenChange,
  refNum,
  defaults = {},
  onUpdated,
}) {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVehicleNumber(defaults.vehicle_number || "");
    setDriverName(defaults.driver_name || "");
    setDriverPhone(defaults.driver_phone || "");
  }, [open, defaults]);

  const ready = vehicleNumber.trim() && driverName.trim() && driverPhone.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) {
      return toast.error(
        "Vehicle number, driver name and driver phone are all required.",
      );
    }
    setSaving(true);
    try {
      const { dispatch, message } = await updateWaybillDispatch(refNum, {
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        driver_phone: driverPhone,
      });
      toast.success(message || "Dispatch data updated.");
      onUpdated?.(dispatch);
      onOpenChange(false);
    } catch (err) {
      toast.error(waybillErrorMessage(err, "Couldn't update dispatch data."));
      console.error("Update dispatch error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-brand" /> Update dispatch data
          </DialogTitle>
          <DialogDescription>
            Record the vehicle and driver carrying this waybill&apos;s goods.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="dispatch-vehicle"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Vehicle number <span className="text-destructive">*</span>
            </label>
            <Input
              id="dispatch-vehicle"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. GW 1234-21"
              required
            />
          </div>

          <div>
            <label
              htmlFor="dispatch-driver"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Driver name <span className="text-destructive">*</span>
            </label>
            <Input
              id="dispatch-driver"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. Kwame Mensah"
              required
            />
          </div>

          <div>
            <label
              htmlFor="dispatch-phone"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Driver phone <span className="text-destructive">*</span>
            </label>
            <Input
              id="dispatch-phone"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="e.g. 024 000 0000"
              type="tel"
              required
            />
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
              disabled={saving || !ready}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Truck className="mr-1.5 h-4 w-4" /> Save dispatch data
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
