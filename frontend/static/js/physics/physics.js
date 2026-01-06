import { integrate } from './rigid_body.js';
import { Environment } from './environment.js';
import { handleCollisions } from './collision.js';
import { applyBuoyancy } from './buoyancy.js';

const bodies = [];

export function registerBody(body) {
  bodies.push(body);
}

// Debugging helper: return the list of registered bodies
export function getBodies() {
  return bodies;
}

export function physicsStep(dt) {
  bodies.forEach((body) => {
    // Gravity
    if (body.useGravity) {
      body.acceleration.z = Environment.gravity;
    }

    //Buoyancy (water level at z = 0)
    applyBuoyancy(body, 0);

    // Integrate motion
    integrate(body, dt);
  });

  handleCollisions(bodies);
}
