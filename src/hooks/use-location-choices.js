// Region and district options from the backend enums: GET region-choices/
// and GET district-choices/?region=<region> (districts depend on the region).
// The current values stay selectable even before the lists load.
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getDistrictChoices } from "@/services/api/transporters.service";
import { getRegionChoices } from "@/services/api/waitlist.service";
import { apiErrorMessage } from "@/services/lib/api-error";
import { normalizeChoices, prettify } from "@/utils/choices";

const withCurrent = (choices, value) =>
  value && !choices.some((c) => c.value === value)
    ? [...choices, { value, label: prettify(value) }]
    : choices;

export function useLocationChoices({ region, district, enabled = true }) {
  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setRegionsLoading(true);
    getRegionChoices()
      .then((d) => !cancelled && setRegions(normalizeChoices(d)))
      .catch((err) => {
        if (cancelled) return;
        setRegions([]);
        toast.error(apiErrorMessage(err, "Couldn't load regions."));
      })
      .finally(() => !cancelled && setRegionsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !region) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setDistrictsLoading(true);
    getDistrictChoices(region)
      .then((d) => !cancelled && setDistricts(normalizeChoices(d)))
      .catch((err) => {
        if (cancelled) return;
        setDistricts([]);
        toast.error(apiErrorMessage(err, "Couldn't load districts."));
      })
      .finally(() => !cancelled && setDistrictsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [enabled, region]);

  return {
    regions: withCurrent(regions, region),
    regionsLoading,
    districts: withCurrent(districts, district),
    districtsLoading,
  };
}
