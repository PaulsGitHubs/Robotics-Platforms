/* VehicleEntity represents a vehicle wrapper around a Cesium entity */
export default class VehicleEntity {
  constructor(id, body) {
    this.id = id;
    // `body` is the Cesium entity; if a physics body is attached it will be at `body.body`
    this.entity = body;
    this.physical = body?.body || null;
    this.speed = 0;
    this.isStopped = false;

    // Autopilot state
    this.waypoints = [];
    this.autopilotSpeed = 50; // meters/sec default

    // Provide legacy-friendly velocity property pointing to the physics velocity if available
    if (this.physical) {
      // physics body provides `velocity`
      this.velocity = this.physical.velocity;
    } else {
      // fall back to entity storage
      if (!this.entity.velocity) this.entity.velocity = { x: 0, y: 0, z: 0 };
      this.velocity = this.entity.velocity;
    }
  }

  accelerate(amount = 0.2) {
    this.velocity.x += amount;
    console.log(`Vehicle ${this.id} accelerate → vx=${this.velocity.x.toFixed(2)}`);
  }

  brake() {
    if (this.velocity) {
      this.velocity.x = 0;
    }
    this.isStopped = true;
  }

  followWaypoints(waypoints = [], speed = 50) {
    // waypoints: [{lon, lat, alt}, ...]
    this.waypoints = waypoints.map((w) => Cesium.Cartesian3.fromDegrees(w.lon, w.lat, w.alt ?? 0));
    this.autopilotSpeed = speed;
  }

  update() {
    // If we have waypoint autopilot enabled, steer toward the next waypoint
    if (this.waypoints && this.waypoints.length) {
      const pos = this.entity.position.getValue();
      const target = this.waypoints[0];
      const diff = Cesium.Cartesian3.subtract(target, pos, new Cesium.Cartesian3());
      const dist = Cesium.Cartesian3.magnitude(diff);
      if (dist < 10) {
        // waypoint reached
        this.waypoints.shift();
        if (this.waypoints.length === 0) {
          // stop the vehicle
          if (this.physical) {
            this.physical.velocity.x = 0;
            this.physical.velocity.y = 0;
            this.physical.velocity.z = 0;
          } else if (this.velocity) {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.velocity.z = 0;
          }
        }
        return;
      }

      const dir = Cesium.Cartesian3.normalize(diff, new Cesium.Cartesian3());
      const speed = this.autopilotSpeed;
      if (this.physical) {
        this.physical.velocity.x = dir.x * speed;
        this.physical.velocity.y = dir.y * speed;
        this.physical.velocity.z = dir.z * speed;
      } else if (this.velocity) {
        // If we aren't using the physics system, gently apply velocity
        this.velocity.x = dir.x * (speed / 1000);
        this.velocity.y = dir.y * (speed / 1000);
        this.velocity.z = dir.z * (speed / 1000);
      }
    }
  }
}
