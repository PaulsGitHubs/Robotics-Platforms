import { integrate } from "./rigid_body.js";
import { Environment } from "./environment.js";
import { handleCollisions } from "./collision.js";
import { applyBuoyancy } from "./buoyancy.js";

const bodies = [];

export function registerBody(body) {
  bodies.push(body);
}

export function getBodies() {
  return bodies;
}

export function physicsStep(dt) {
  bodies.forEach(body => {
    if (body.useGravity && !body.isStatic) {
      body.acceleration.z = Environment.gravity;
    }

    applyBuoyancy(body, 0);
    integrate(body, dt);
  });

  handleCollisions(bodies);
}
