export function applyBuoyancy(body, waterLevel = 0) {
  const pos = body.entity.position.getValue();

  if (pos.z < waterLevel) {
    const depth = waterLevel - pos.z;
    const buoyantForce = depth * body.mass * 0.8;

    body.velocity.z += buoyantForce * 0.01;
  }
}
