export default class BaseEntity {
  constructor(id, cesiumEntity) {
    this.id = id;
    this.entity = cesiumEntity;
    this.velocity = { x: 0, y: 0, z: 0 };
  }

  update(dt) {
    const pos = this.entity.position.getValue();
    this.entity.position = new Cesium.Cartesian3(
      pos.x + this.velocity.x * dt,
      pos.y + this.velocity.y * dt,
      pos.z + this.velocity.z * dt
    );
  }
}
