import BaseEntity from "./BaseEntity.js";

export default class SensorEntity extends BaseEntity {
  read() {
    return Math.random();
  }
}
