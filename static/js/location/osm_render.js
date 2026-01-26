export function renderOSM(viewer, elements) {
  elements.forEach(e => {
    if (!e.lat || !e.lon) return;

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(e.lon, e.lat),
      point: { pixelSize: 6, color: Cesium.Color.CYAN },
      label: { text: e.tags?.name || "OSM Object" }
    });
  });
}
