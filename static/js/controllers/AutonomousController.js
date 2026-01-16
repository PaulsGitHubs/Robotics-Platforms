export class AutonomousController {
  constructor(entity) {
    this.entity = entity;
    this.route = [];
    this.currentIndex = 0;
    this.active = false;
    this.maxSpeed = 5;
  }

  setRoute(points) {
    this.route = points;
    this.currentIndex = 0;
    this.active = true;
  }

  stop() {
    if (!this.entity.body) return;
    this.entity.body.velocity.x = 0;
    this.entity.body.velocity.y = 0;
    this.active = false;
  }

  update(delta) {
    if (!this.active || this.route.length === 0 || !this.entity.body) return;

    const target = this.route[this.currentIndex];
    const body = this.entity.body;

    const dx = target.x - body.position.x;
    const dy = target.y - body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // reached waypoint
    if (dist < 1) {
      this.currentIndex++;
      if (this.currentIndex >= this.route.length) {
        this.stop();
      }
      return;
    }

    // normalize direction
    const nx = dx / dist;
    const ny = dy / dist;

    body.velocity.x = nx * this.maxSpeed;
    body.velocity.y = ny * this.maxSpeed;
  }
}
