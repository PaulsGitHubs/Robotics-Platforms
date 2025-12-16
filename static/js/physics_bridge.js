import { createRigidBody } from "../../physics/rigid_body.js";
import { registerBody } from "../../physics/physics.js";
import { attachKeyboardController } from "../../physics/controllers.js";

export function enablePhysics(entity, options) {
  const body = createRigidBody(entity, options);
  registerBody(body);

  if (options.playerControlled) {
    attachKeyboardController(body);
  }
}
