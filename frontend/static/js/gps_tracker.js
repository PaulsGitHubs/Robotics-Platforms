export function trackUser(viewer) {
  navigator.geolocation.watchPosition(pos => {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        pos.coords.longitude,
        pos.coords.latitude,
        1500
      )
    });
  });
}
