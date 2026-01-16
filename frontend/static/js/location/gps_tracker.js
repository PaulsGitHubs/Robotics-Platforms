export function trackUser(viewer) {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported");
    return;
  }

  navigator.geolocation.watchPosition(
    pos => {
      const { latitude, longitude } = pos.coords;

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          longitude,
          latitude,
          1500
        ),
        duration: 1
      });
    },
    err => console.error("GPS error:", err),
    { enableHighAccuracy: true }
  );
}
