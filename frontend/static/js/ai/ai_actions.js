/* global Cesium */
/* eslint-env browser */
import { getViewer } from '../scene.js';
import { getActiveVehicle } from '../simulation/simulation_manager.js';

/**
 * Main AI command processor
 */
export async function applyAIActions(text, editorInstance) {
  if (!text) return;

  const lower = text.toLowerCase();

  // helper to resolve "my location" from the UI or navigator
  async function resolveMyLocation() {
    try {
      const view = getViewer();
      if (view) {
        const user = view.entities.getById('user-location');
        if (user && user.position) {
          const p = user.position.getValue();
          const c = Cesium.Cartographic.fromCartesian(p);
          return {
            lat: Cesium.Math.toDegrees(c.latitude),
            lon: Cesium.Math.toDegrees(c.longitude),
          };
        }
      }

      // fallback to the browser geolocation API
      if (navigator.geolocation) {
        return await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      }
    } catch (e) {
      console.warn('Failed to resolve my location:', e);
    }
    return null;
  }

  // -------------------------------
  // VEHICLE CONTROL
  // -------------------------------
  if (lower.includes('brake') || lower.includes('slow down')) {
    const vehicle = getActiveVehicle();
    if (vehicle?.brake) {
      vehicle.brake();
      console.log('Vehicle braking');
    }
    return;
  }

  if (lower.includes('accelerate') || lower.includes('speed up')) {
    const vehicle = getActiveVehicle();
    if (vehicle?.accelerate) {
      vehicle.accelerate();
    }
    return;
  }

  // Drive to a named location (uses Nominatim geocoding) and supports "my location"
  if (lower.includes('drive to') || lower.match(/\bgo to\b/)) {
    // extract location text
    const m = text.match(/(?:drive to|go to)\s+(.+)/i);
    if (!m) return;
    let location = m[1].trim();

    // support 'my location' / 'my position' / 'me'
    if (/\b(my location|my position|me)\b/i.test(location)) {
      const my = await resolveMyLocation();
      if (!my) {
        console.warn('Unable to resolve user location for "my location"');
        return;
      }
      const { lat, lon } = my;
      const vehicle = getActiveVehicle();
      if (vehicle) {
        const pos = vehicle.entity.position.getValue();
        const carto = Cesium.Cartographic.fromCartesian(pos);
        const curLon = Cesium.Math.toDegrees(carto.longitude);
        const curLat = Cesium.Math.toDegrees(carto.latitude);
        vehicle.followWaypoints([
          { lon: curLon, lat: curLat, alt: 0 },
          { lon, lat: lat, alt: 0 },
        ]);
        console.log(`Vehicle navigating to your location (${lat}, ${lon})`);
      }
      return;
    }

    // if coordinates are provided, parse them
    const coordMatch = location.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
    let lon, lat;
    if (coordMatch) {
      lon = parseFloat(coordMatch[1]);
      lat = parseFloat(coordMatch[2]);
    } else {
      // geocode using Nominatim
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await res.json();
        if (!data || !data.length) {
          console.warn('Geocoding failed for', location);
          return;
        }
        lat = parseFloat(data[0].lat);
        lon = parseFloat(data[0].lon);
      } catch (err) {
        console.error('Geocoding error:', err);
        return;
      }
    }

    const vehicle = getActiveVehicle();
    if (vehicle) {
      // Create a simple waypoint set: current -> target
      const pos = vehicle.entity.position.getValue();
      const carto = Cesium.Cartographic.fromCartesian(pos);
      const curLon = Cesium.Math.toDegrees(carto.longitude);
      const curLat = Cesium.Math.toDegrees(carto.latitude);
      const wps = [
        { lon: curLon, lat: curLat, alt: 0 },
        { lon, lat, alt: 0 },
      ];
      vehicle.followWaypoints(wps, vehicle.autopilotSpeed || 20);
      console.log(`Vehicle navigating to ${location} (${lat}, ${lon})`);
    }
    return;
  }

  // -------------------------------
  // SPAWN AIRCRAFT
  // -------------------------------
  if (lower.includes('spawn aircraft') || lower.match(/spawn\s+(aircraft|plane|airplane)/i)) {
    const viewer = getViewer();
    if (!viewer) return;

    // attempt to extract coordinates or 'my location'
    const mCoords = text.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
    let target = null;
    if (mCoords) {
      target = { lat: parseFloat(mCoords[1]), lon: parseFloat(mCoords[2]) };
    } else if (/\b(my location|my position|me)\b/i.test(text)) {
      target = await resolveMyLocation();
    }

    // spawn position: if target provided spawn at target, otherwise spawn above the current view center
    let spawnPos = null;
    if (target) {
      spawnPos = Cesium.Cartesian3.fromDegrees(target.lon, target.lat, 2000);
    } else {
      try {
        const cam = viewer.camera.position;
        spawnPos = cam || Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 2000);
      } catch (e) {
        spawnPos = Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 2000);
      }
    }

    // create entity (use model when available)
    let ent = null;
    try {
      const head = await fetch('/static/assets/models/aircraft/airplane.glb', { method: 'HEAD' });
      const contentLen = head.headers.get('content-length');
      if (head.ok && contentLen && parseInt(contentLen, 10) > 50) {
        ent = viewer.entities.add({
          id: `aircraft-${Date.now()}`,
          name: 'aircraft',
          position: spawnPos,
          model: { uri: '/static/assets/models/aircraft/airplane.glb' },
        });
      } else {
        ent = viewer.entities.add({
          id: `aircraft-${Date.now()}`,
          name: 'aircraft',
          position: spawnPos,
          point: { pixelSize: 12, color: Cesium.Color.WHITE },
        });
      }
    } catch (e) {
      ent = viewer.entities.add({
        id: `aircraft-${Date.now()}`,
        name: 'aircraft',
        position: spawnPos,
        point: { pixelSize: 12, color: Cesium.Color.WHITE },
      });
    }

    // Register as active vehicle and enable lightweight physics to allow autopilot
    try {
      const mod = await import('/static/js/simulation/simulation_manager.js');
      const phys = await import('/static/js/physics_bridge.js');
      const veh = mod.setActiveVehicleFromEntity(ent);
      try {
        phys.enablePhysics(ent, { mass: 800, drag: 0.01, playerControlled: false });
      } catch (e) {
        console.warn('Failed to enable physics on aircraft', e);
      }

      // If the command included a destination that is different from spawn, set it as waypoint
      if (target && (Math.abs(target.lat) > 0 || Math.abs(target.lon) > 0)) {
        veh.followWaypoints([{ lon: target.lon, lat: target.lat, alt: 0 }], 60);
        console.log(`Spawned aircraft and heading to ${target.lat}, ${target.lon}`);
      } else {
        console.log('Spawned aircraft at', spawnPos);
      }
    } catch (e) {
      console.warn('Aircraft registration failed', e);
    }

    return;
  }

  // -------------------------------
  // CAMERA / MAP CONTROL
  // -------------------------------
  if (lower.includes('fly to')) {
    const match = text.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
    if (!match) return;

    const lon = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    const viewer = getViewer();
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 3000),
        duration: 2,
      });
    }
    return;
  }

  // -------------------------------
  // ADD POINT TO MAP
  // -------------------------------
  if (lower.includes('add point')) {
    const match = text.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
    if (!match) return;

    const lon = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    const viewer = getViewer();
    if (viewer) {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        point: { pixelSize: 10, color: Cesium.Color.YELLOW },
      });
    }
    return;
  }

  // -------------------------------
  // EXECUTE SAFE SCRIPT (DEV MODE)
  // -------------------------------
  if (lower.startsWith('run ')) {
    const code = text.replace(/^run\s*/i, '');
    runCodeFromAI(code);
    return;
  }

  console.warn('AI command not recognized:', text);
}

/**
 * Runs sandboxed JS (limited)
 */
function runCodeFromAI(code) {
  try {
    const fn = new Function('viewer', `"use strict";\n${code}`);
    fn(getViewer());
    console.log('AI code executed.');
  } catch (err) {
    console.error('AI execution error:', err);
  }
}
