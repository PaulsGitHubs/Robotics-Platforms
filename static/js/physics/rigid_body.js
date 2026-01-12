import { Environment } from './environment.js';

// export function createRigidBody(entity, options = {}) {
//   // Initialize body with physical properties and persistent position state
//   const body = {
//     entity,

//     mass: options.mass ?? 1,
//     drag: options.drag ?? 0.02,
//     restitution: options.restitution ?? 0.3,
//     friction: options.friction ?? 0.5,

//     velocity: { x: 0, y: 0, z: 0 },
//     acceleration: { x: 0, y: 0, z: 0 },

//     useGravity: options.useGravity ?? true,
//     isStatic: options.isStatic ?? false,
//   };

//   // Initialize world-space position components from the entity's current position
//   try {
//     const pos =
//       entity && entity.position && typeof entity.position.getValue === 'function'
//         ? entity.position.getValue()
//         : Cesium.Cartesian3.fromDegrees(0, 0, 0);
//     body._x = pos.x;
//     body._y = pos.y;
//     body._z = pos.z;
//   } catch (e) {
//     body._x = 0;
//     body._y = 0;
//     body._z = 0;
//   }

//   // Use a CallbackProperty so Cesium queries the live body position each frame
//   try {
//     entity.position = new Cesium.CallbackProperty(() => {
//       return Cesium.Cartesian3.fromElements(body._x, body._y, body._z);
//     }, false);
//   } catch (e) {
//     /* ignore */
//   }

//   return body;
// }

// export function integrate(body, dt) {
//   if (!body || body.isStatic) return;

//   // Integrate velocities
//   body.velocity.x += body.acceleration.x * dt;
//   body.velocity.y += body.acceleration.y * dt;
//   body.velocity.z += body.acceleration.z * dt;

//   // Apply simple drag
//   body.velocity.x *= 1 - body.drag;
//   body.velocity.y *= 1 - body.drag;
//   body.velocity.z *= 1 - body.drag;

//   // Update the position components directly; the CallbackProperty will reflect this change
//   body._x += body.velocity.x * dt;
//   body._y += body.velocity.y * dt;
//   body._z += body.velocity.z * dt;
// }

export function createRigidBody(entity, options = {}) {
  const initialPos =
    entity && entity.position && typeof entity.position.getValue === 'function'
      ? entity.position.getValue(Cesium.JulianDate.now())
      : Cesium.Cartesian3.fromDegrees(0, 0, 0);

  const body = {
    id: entity?.id ?? `body-${Date.now()}`,
    entity,

    mass: options.mass ?? 1,
    drag: options.drag ?? 0.02,
    restitution: options.restitution ?? 0.3,
    friction: options.friction ?? 0.5,

    // actual current velocity (used by integrator)
    _velocity: { x: 0, y: 0, z: 0 },
    // target velocity set by controllers or AI (writes to `body.velocity.x` will update this)
    _targetVelocity: { x: 0, y: 0, z: 0 },

    // user-visible `velocity` API is a Proxy: reads return actual velocity, writes update target velocity
    velocity: null, // set below as Proxy

    acceleration: { x: 0, y: 0, z: 0 },

    useGravity: options.useGravity ?? true,
    isStatic: options.isStatic ?? false,

    // authoritative server state (for multiplayer) and reconciliation helpers
    serverPosition: null,
    serverVelocity: null,
    reconciliationAlpha: 0.1,

    // world space position stored as plain object for Ammo adapter compatibility
    position: {
      x: initialPos.x || 0,
      y: initialPos.y || 0,
      z: initialPos.z || 0,
    },

    // accumulators for external forces/torques applied each tick
    _forceAccumulator: { x: 0, y: 0, z: 0 },
    _torqueAccumulator: { x: 0, y: 0, z: 0 },

    // debug helpers
    lastAppliedForce: { x: 0, y: 0, z: 0 },
    lastAppliedTorque: { x: 0, y: 0, z: 0 },

    // API methods (defined below to capture `body` reference)
    applyForce: null,
    applyTorque: null,
  };

  // Provide applyForce / applyTorque that accumulate forces (N) and torques
  body.applyForce = (f) => {
    if (!f) return;
    body._forceAccumulator.x += f.x || 0;
    body._forceAccumulator.y += f.y || 0;
    body._forceAccumulator.z += f.z || 0;
    body.lastAppliedForce = { x: f.x || 0, y: f.y || 0, z: f.z || 0 };
    console.log(`applyForce on ${body.id}:`, body.lastAppliedForce);
  };

  body.applyTorque = (t) => {
    if (!t) return;
    body._torqueAccumulator.x += t.x || 0;
    body._torqueAccumulator.y += t.y || 0;
    body._torqueAccumulator.z += t.z || 0;
    body.lastAppliedTorque = { x: t.x || 0, y: t.y || 0, z: t.z || 0 };
    console.log(`applyTorque on ${body.id}:`, body.lastAppliedTorque);
  };

  // Proxy velocity so `body.velocity.x = value` is treated as desired target velocity
  body.velocity = new Proxy(body._velocity, {
    set(target, prop, value) {
      target[prop] = value;
      // set target velocity for smooth motor-driven updates
      body._targetVelocity[prop] = value;
      // expose for debugging
      try {
        body.lastDesiredVelocity = { ...body._targetVelocity };
      } catch (e) {}
      return true;
    },
    get(target, prop) {
      return target[prop];
    },
  });

  // Set up Cesium CallbackProperty so Cesium queries the latest body position
  try {
    entity.position = new Cesium.CallbackProperty(() => {
      const p = body.position;
      return Cesium.Cartesian3.fromElements(p.x, p.y, p.z);
    }, false);
  } catch (e) {
    // ignore if entity doesn't support CallbackProperty
  }

  return body;
}

export function integrate(body, dt) {
  if (body.isStatic) return;

  // Compute motor-like force from target velocity (simple PD-like controller)
  const motorForce = { x: 0, y: 0, z: 0 };
  const kp = Math.min(200, 50 * (body.mass || 1)); // proportional gain scaled by mass
  for (const axis of ['x', 'y', 'z']) {
    const err = (body._targetVelocity[axis] || 0) - (body._velocity[axis] || 0);
    // desired change per second; convert to force = mass * dv/dt
    const desiredAccel = (err) / (dt || 1/60);
    const f = desiredAccel * (body.mass || 1);
    motorForce[axis] = Math.max(-kp * (body.mass || 1), Math.min(kp * (body.mass || 1), f));
  }

  // Sum applied forces (external + motor)
  const netForce = {
    x: (body._forceAccumulator.x || 0) + motorForce.x,
    y: (body._forceAccumulator.y || 0) + motorForce.y,
    z: (body._forceAccumulator.z || 0) + motorForce.z,
  };

  // Expose motor force for debugging/visibility
  try {
    body.lastMotorForce = { ...motorForce };
  } catch (e) {}

  // Acceleration = netForce / mass
  body.acceleration.x = netForce.x / (body.mass || 1);
  body.acceleration.y = netForce.y / (body.mass || 1);
  body.acceleration.z = netForce.z / (body.mass || 1);

  // Gravity
  if (body.useGravity) {
    body.acceleration.z += Environment.gravity;
  }

  // Integrate velocities
  body._velocity.x += body.acceleration.x * dt;
  body._velocity.y += body.acceleration.y * dt;
  body._velocity.z += body.acceleration.z * dt;

  // Apply simple drag
  body._velocity.x *= 1 - body.drag;
  body._velocity.y *= 1 - body.drag;
  body._velocity.z *= 1 - body.drag;

  // Predictive position update
  body.position.x += body._velocity.x * dt;
  body.position.y += body._velocity.y * dt;
  body.position.z += body._velocity.z * dt;

  // Reconciliation: smoothly converge to server position if present
  if (body.serverPosition) {
    body.position.x += (body.serverPosition.x - body.position.x) * body.reconciliationAlpha;
    body.position.y += (body.serverPosition.y - body.position.y) * body.reconciliationAlpha;
    body.position.z += (body.serverPosition.z - body.position.z) * body.reconciliationAlpha;
  }

  // Clear force/torque accumulators after the integration step
  body._forceAccumulator.x = 0;
  body._forceAccumulator.y = 0;
  body._forceAccumulator.z = 0;
  body._torqueAccumulator.x = 0;
  body._torqueAccumulator.y = 0;
  body._torqueAccumulator.z = 0;
}
