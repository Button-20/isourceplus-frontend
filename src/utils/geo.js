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
      (err) => {
        // Give a useful reason instead of one generic message. Lower-accuracy
        // requests work on desktops/WiFi where a high-accuracy GPS fix times out.
        const message =
          err?.code === 1
            ? "Location permission was denied. Allow it in your browser, or enter your location manually."
            : err?.code === 3
              ? "Couldn't get your location in time. Try again or enter it manually."
              : "Couldn't get your location. Enter it manually.";
        reject(new Error(message));
      },
      // Lower accuracy + longer timeout + cached fix are far more reliable
      // across desktop and mobile; high-accuracy timed out on many devices.
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 },
    );
  });
}

// Google Maps driving directions between two [lat, lng] points.
export const mapsDirectionsUrl = (from, to) =>
  `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${from.join(",")}&destination=${to.join(",")}`;
