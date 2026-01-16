export class AIController {
  constructor(entity) {
    this.entity = entity;
  }

  apply(action) {
    if (action.type === "BRAKE") {
      this.entity.brake();
    }
  }
}
