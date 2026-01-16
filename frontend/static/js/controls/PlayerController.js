export class PlayerController {
  constructor(entity) {
    this.entity = entity;
    window.addEventListener("keydown", e => this.handle(e));
  }

  handle(e) {
    if (e.key === "w") this.entity.accelerate();
    if (e.key === "s") this.entity.brake();
  }
}
