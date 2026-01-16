import { SatelliteEntity } from "../entities/SatelliteEntity.js";

export class SatelliteManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.satellites = [];
  }

  addSatellite() {
    const sat = new SatelliteEntity(this.viewer);
    this.satellites.push(sat);
  }

  update(delta) {
    this.satellites.forEach(sat => sat.update(delta));
  }
}
