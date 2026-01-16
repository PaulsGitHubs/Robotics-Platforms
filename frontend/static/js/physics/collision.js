export function handleCollisions(bodies) {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      resolveCollision(bodies[i], bodies[j]);
    }
  }
}

function resolveCollision(a, b) {
  const pa = a.entity.position.getValue();
  const pb = b.entity.position.getValue();

  const distance = Cesium.Cartesian3.distance(pa, pb);
  if (distance < 1.5) {
    a.velocity.z *= -a.restitution;
    b.velocity.z *= -b.restitution;
  }
}
