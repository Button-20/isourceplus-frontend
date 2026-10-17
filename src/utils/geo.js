// Device location as "lat, lng" (6 decimals) — the form the waybill and GRN
// endpoints accept for a GPS position. Rejects when unavailable or denied.
export function currentPositionString() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location isn't available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve(
          `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
        ),
      () => reject(new Error("Couldn't get your location. Enter it manually.")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

// Google Maps driving directions between two [lat, lng] points.
export const mapsDirectionsUrl = (from, to) =>
  `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${from.join(",")}&destination=${to.join(",")}`;
