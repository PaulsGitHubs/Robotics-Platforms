export async function loadNearbyObjects(lat, lng) {
  const res = await fetch(`/api/simulation/zone?lat=${lat}&lng=${lng}`);
  const data = await res.json();

  data.correlation.forEach(el => {
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(el.lon, el.lat),
      label: { text: el.tags?.name || el.type }
    });
  });
}
