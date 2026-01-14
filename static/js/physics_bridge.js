import { createRigidBody } from '/static/js/physics/rigid_body.js';
import { registerBody } from '/static/js/physics-runtime/PhysicsRouter.js';
import { attachKeyboardController } from '/static/js/physics/controllers.js';

export function enablePhysics(entity, options = {}) {
  const body = createRigidBody(entity, options);
  // attach physics body to entity for easier access by wrappers
  entity.body = body;
  registerBody(body);

  if (options.playerControlled) {
    attachKeyboardController(body);
  }
  return body;
}
