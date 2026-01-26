// import { integrate } from './rigid_body.js';
// import { Environment } from './environment.js';
// import { handleCollisions } from './collision.js';
// import { applyBuoyancy } from './buoyancy.js';

// const bodies = [];

// export function registerBody(body) {
//   bodies.push(body);
// }

// // Debugging helper: return the list of registered bodies
// export function getBodies() {
//   return bodies;
// }

// export function physicsStep(dt) {
//   bodies.forEach((body) => {
//     // Gravity
//     if (body.useGravity) {
//       body.acceleration.z = Environment.gravity;
//     }

//     //Buoyancy (water level at z = 0)
//     applyBuoyancy(body, 0);

//     // Integrate motion
//     integrate(body, dt);
//   });

//   handleCollisions(bodies);
// }

import { integrate } from './rigid_body.js';
import { Environment } from './environment.js';
import { handleCollisions } from './collision.js';
import { applyBuoyancy } from './buoyancy.js';

const bodies = [];

export function registerBody(body) {
  bodies.push(body);
}

export function getBodies() {
  return bodies;
}

export function physicsStep(dt) {
  bodies.forEach((body) => {
    if (body.useGravity && !body.isStatic) {
      body.acceleration.z = Environment.gravity;
    }

    applyBuoyancy(body, 0);
    integrate(body, dt);
  });

  handleCollisions(bodies);

  // Simple ground collision at z = 0
  bodies.forEach((body) => {
    if (body.isStatic) return;
    if (!body.position || typeof body.position.z !== 'number') return;
    if (body.position.z < 0) {
      body.position.z = 0;
      // bounce/stop
      body.velocity.z *= -body.restitution;
      // damp low energies
      if (Math.abs(body.velocity.z) < 0.1) body.velocity.z = 0;
    }
  });
}
