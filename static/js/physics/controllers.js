export function attachKeyboardController(body) {
  window.addEventListener('keydown', (e) => {
    const input = { id: body.id, key: e.key, ts: Date.now() };

    // Send only inputs to the server (if available)
    try {
      if (window.__physicsNetwork) {
        window.__physicsNetwork.sendInput(input);
      }
    } catch (err) {
      // ignore
    }

    // Use forces/torques for movement (engine/brake/steering) rather than directly manipulating velocity
    const mass = body.mass || 1;
    const engineForce = 150 * mass; // scaled to mass
    const steerTorque = 20 * mass; // simple steering torque

    if (e.key === 'w') {
      body.applyForce({ x: 0, y: engineForce, z: 0 });
    }
    if (e.key === 's') {
      body.applyForce({ x: 0, y: -engineForce, z: 0 });
    }
    if (e.key === 'a') {
      // apply yaw torque
      body.applyTorque({ x: 0, y: 0, z: steerTorque });
    }
    if (e.key === 'd') {
      body.applyTorque({ x: 0, y: 0, z: -steerTorque });
    }
    if (e.key === ' ') {
      body.applyForce({ x: 0, y: 0, z: mass * 6 });
    }
  });
}
