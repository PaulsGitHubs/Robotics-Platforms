import BaseEntity from "./BaseEntity.js";

export default class AircraftEntity extends BaseEntity {
  climb() {
    this.velocity.z += 2;
  }
}
