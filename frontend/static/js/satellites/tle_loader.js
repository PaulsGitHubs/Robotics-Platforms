import * as satellite from "satellite.js";
import { addSatellite, updateSatellites } from "./satellite_manager.js";

export function loadTLES(tleList) {
  return tleList.map(tle =>
    satellite.twoline2satrec(tle.line1, tle.line2)
  );
}

export function propagateSatellites(satRecs) {
  const now = new Date();
  return satRecs.map(rec => {
    const posVel = satellite.propagate(rec, now);
    const gmst = satellite.gstime(now);
    const geo = satellite.eciToGeodetic(posVel.position, gmst);

    return Cesium.Cartesian3.fromRadians(
      geo.longitude,
      geo.latitude,
      geo.height * 1000
    );
  });
}
