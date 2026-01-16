import { getBodies } from "../physics/physics.js";

export function syncPhysicsToCesium() {
  const time = Cesium.JulianDate.now();

  getBodies().forEach(body => {
    if (!body.entity) return;

    body.entity.position = body.position;
  });
}
