/* Label nearby entities relative to the 'user-location' entity */
let viewer = null;
let handler = null;
let labels = new Map();

export function startNearbyLabeling(v, radiusMeters = 200) {
  viewer = v;
  if (!viewer) return;

  handler = () => {
    const user = viewer.entities.getById('user-location');
    if (!user) return;
    const upos = user.position.getValue();

    // find entities (skip the user marker itself and labels)
    viewer.entities.values.forEach((ent) => {
      if (!ent.position || ent.id === 'user-location') return;

      const pos = ent.position.getValue();
      const dist = Cesium.Cartesian3.distance(upos, pos);
      if (dist <= radiusMeters) {
        if (!labels.has(ent)) {
          const labelEnt = viewer.entities.add({
            position: ent.position,
            label: {
              text: ent.name || ent.id || 'entity',
              pixelOffset: new Cesium.Cartesian2(0, -20),
              scale: 0.7,
            },
          });
          labels.set(ent, labelEnt);
        }
      } else {
        // remove label if too far
        const le = labels.get(ent);
        if (le) {
          try {
            viewer.entities.remove(le);
          } catch (e) {}
          labels.delete(ent);
        }
      }
    });
  };

  viewer.scene.preUpdate.addEventListener(handler);
}

export function stopNearbyLabeling() {
  if (!viewer) return;
  if (handler) {
    viewer.scene.preUpdate.removeEventListener(handler);
    handler = null;
  }
  for (const l of labels.values()) {
    try {
      viewer.entities.remove(l);
    } catch (e) {}
  }
  labels.clear();
  viewer = null;
}
