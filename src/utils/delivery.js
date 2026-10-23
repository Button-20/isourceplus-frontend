// `do_delivery` on RFxs, tenders and company proforma offers: self delivery or
// none (null). Not the live delivery-choices/ list — its other values (e.g.
// "out_source") belong to waybills. Radix Select can't hold an empty value, so
// "none" stands in for null in the form.
export const NO_DELIVERY = "none";

export const DELIVERY_OPTIONS = [
  { value: NO_DELIVERY, label: "No delivery" },
  { value: "self", label: "Self delivery" },
];

// Form value → payload value (JSON).
export const deliveryPayload = (v) => (v === "self" ? "self" : null);

// Multipart has no null: an empty string reads as null on a nullable DRF field.
export const deliveryFormValue = (v) => deliveryPayload(v) ?? "";
