import { getBodies } from '/static/js/physics/physics.js';

let viewer = null;
let labels = new Map();
let handler = null;

export function enablePhysicsDebug(v) {
  // Respect an explicit opt-out flag; default to enabled if flag is undefined.
  if (window.__PHYSICS_DEBUG_ENABLED === false) {
    if (!window.__physicsDebugOptOutLogged) {
      console.info('[PhysicsDebug] Debug rendering disabled by configuration');
      window.__physicsDebugOptOutLogged = true;
    }
    return;
  }

  viewer = v;
  if (!viewer) return;

  // create per-body label entities
  getBodies().forEach((b, i) => {
    const id = `physics-debug-${i}`;
    const label = viewer.entities.add({
      id,
      position: b.entity.position,
      label: {
        text: `vx: ${b.velocity.x.toFixed(2)}`,
        showBackground: true,
        font: '14px monospace',
      },
    });
    labels.set(b, label);
  });

  handler = () => {
    getBodies().forEach((b) => {
      const labelEnt = labels.get(b);
      if (!labelEnt) return;
      const v = b.velocity || { x: 0, y: 0, z: 0 };
      labelEnt.label.text = `vx:${v.x.toFixed(2)} vy:${v.y.toFixed(2)}`;
      // align label to entity position
      labelEnt.position = b.entity.position;
    });
  };

  viewer.scene.preUpdate.addEventListener(handler);
}

export function disablePhysicsDebug() {
  if (!viewer) return;
  if (handler) {
    viewer.scene.preUpdate.removeEventListener(handler);
    handler = null;
  }

  // remove labels
  for (const label of labels.values()) {
    try {
      viewer.entities.remove(label);
    } catch (e) {}
  }
  labels.clear();
  viewer = null;
}
