export function createRigidBody(entity, options = {}) {
  return {
    entity,

    // Physical properties
    mass: options.mass ?? 1,
    drag: options.drag ?? 0.02,
    restitution: options.restitution ?? 0.3, // bounce
    friction: options.friction ?? 0.5,

    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },

    useGravity: options.useGravity ?? true,
    isStatic: options.isStatic ?? false
  };
}

export function integrate(body, dt) {
  if (body.isStatic) return;

  body.velocity.x += body.acceleration.x * dt;
  body.velocity.y += body.acceleration.y * dt;
  body.velocity.z += body.acceleration.z * dt;

  body.velocity.x *= (1 - body.drag);
  body.velocity.y *= (1 - body.drag);
  body.velocity.z *= (1 - body.drag);

  const pos = body.entity.position.getValue();
  body.entity.position = Cesium.Cartesian3.fromElements(
    pos.x + body.velocity.x * dt,
    pos.y + body.velocity.y * dt,
    pos.z + body.velocity.z * dt
  );
}
