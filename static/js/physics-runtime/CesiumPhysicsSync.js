export function syncBodyToEntity(body) {
  if (!body || !body.entity) return;
  try {
    if (body.entity.position && typeof body.entity.position.getValue === 'function') return;
    body.entity.position = Cesium.Cartesian3.fromElements(
      body.position.x,
      body.position.y,
      body.position.z
    );
  } catch (e) {}
}

export function showBoundingBox(viewer, body, color = Cesium.Color.RED) {
  if (!viewer || !body || !body.entity) return null;
  try {
    const pos = Cesium.Cartesian3.fromElements(body.position.x, body.position.y, body.position.z);
    const box = viewer.entities.add({
      position: pos,
      box: {
        dimensions: new Cesium.Cartesian3(2, 2, 2),
        material: color.withAlpha(0.2),
        outline: true,
        outlineColor: color,
      },
    });
    return box;
  } catch (e) {
    return null;
  }
}
