import { attachKeyboardController } from '../physics/controllers.js';

export class PlayerController {
  constructor(entity) {
    this.entity = entity;
    attachKeyboardController(entity.body);
  }

  update() {}
}
