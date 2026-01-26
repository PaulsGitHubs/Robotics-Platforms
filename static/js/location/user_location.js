/* global Cesium */
/* global Cesium */
/* eslint-env browser */
import { getViewer } from '../scene.js';

export function startUserLocationTracking() {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const viewer = getViewer();

      if (!viewer) return;

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 1200),
        duration: 1.5,
      });

      // Show user marker
      viewer.entities.removeById('user-location');
      viewer.entities.add({
        id: 'user-location',
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
        point: {
          pixelSize: 10,
          color: Cesium.Color.BLUE,
        },
        label: {
          text: 'You',
          pixelOffset: new Cesium.Cartesian2(0, -25),
          scale: 0.6,
        },
      });
    },
    (err) => console.error('GPS error:', err),
    { enableHighAccuracy: true }
  );
}
