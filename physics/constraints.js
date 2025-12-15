export function applyConstraints(body) {
    // Ground constraint
    if (body.position.z < 0) {
        body.position.z = 0;
        body.velocity.z = 0;
    }

    // Max speed clamp
    const maxSpeed = 50;
    const speed = body.velocity.magnitude();

    if (speed > maxSpeed) {
        body.velocity = body.velocity.normalize().multiplyByScalar(maxSpeed);
    }
}
