export function createRigidBody(entity, options = {}) {
  // Initialize body with physical properties and persistent position state
  const body = {
    entity,

    mass: options.mass ?? 1,
    drag: options.drag ?? 0.02,
    restitution: options.restitution ?? 0.3,
    friction: options.friction ?? 0.5,

    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },

    useGravity: options.useGravity ?? true,
    isStatic: options.isStatic ?? false,
  };

  // Initialize world-space position components from the entity's current position
  try {
    const pos =
      entity && entity.position && typeof entity.position.getValue === 'function'
        ? entity.position.getValue()
        : Cesium.Cartesian3.fromDegrees(0, 0, 0);
    body._x = pos.x;
    body._y = pos.y;
    body._z = pos.z;
  } catch (e) {
    body._x = 0;
    body._y = 0;
    body._z = 0;
  }

  // Use a CallbackProperty so Cesium queries the live body position each frame
  try {
    entity.position = new Cesium.CallbackProperty(() => {
      return Cesium.Cartesian3.fromElements(body._x, body._y, body._z);
    }, false);
  } catch (e) {
    /* ignore */
  }

  return body;
}

export function integrate(body, dt) {
  if (!body || body.isStatic) return;

  // Integrate velocities
  body.velocity.x += body.acceleration.x * dt;
  body.velocity.y += body.acceleration.y * dt;
  body.velocity.z += body.acceleration.z * dt;

  // Apply simple drag
  body.velocity.x *= 1 - body.drag;
  body.velocity.y *= 1 - body.drag;
  body.velocity.z *= 1 - body.drag;

  // Update the position components directly; the CallbackProperty will reflect this change
  body._x += body.velocity.x * dt;
  body._y += body.velocity.y * dt;
  body._z += body.velocity.z * dt;
}
