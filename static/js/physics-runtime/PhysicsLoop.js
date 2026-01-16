import { stepPhysics, initPhysics, getMode, getRegisteredBodies } from './PhysicsRouter.js';

let running = false;
let accumulator = 0;
let lastTime = 0;
let _viewer = null;

const FIXED_DT = 1 / 60; // fixed simulation step
const MAX_ACCUMULATED = 0.25; // clamp for stability

let _postRenderHandler = null;
let tickCount = 0;
let lastTickLog = performance.now();

export async function startPhysicsLoop(viewer, mode = 'light') {
  if (running) return;
  if (!viewer || !viewer.scene) throw new Error('Cesium viewer is required to start physics loop');

  _viewer = viewer;

  // Initialize router (which will initialize Ammo if requested)
  await initPhysics(mode);

  running = true;
  accumulator = 0;
  lastTime = performance.now();

  _postRenderHandler = () => {
    if (!running) return;

    const now = performance.now();
    let delta = (now - lastTime) / 1000;
    lastTime = now;

    delta = Math.min(delta, MAX_ACCUMULATED);
    accumulator += delta;

    while (accumulator >= FIXED_DT) {
      stepPhysics(FIXED_DT);
      accumulator -= FIXED_DT;
      tickCount++;
    }

    // update debug overlay every 500ms
    if (now - lastTickLog > 500) {
      const el = document.getElementById('physicsDebug');
      if (el) {
        let info = `Mode: ${getMode() === 'ammo' ? 'Ammo' : 'Light'} | Ticks: ${tickCount}`;
        try {
          const bodies = getRegisteredBodies();
          if (bodies && bodies.length) {
            const b = bodies[0];
            const applied = b.lastAppliedForce || { x: 0, y: 0, z: 0 };
            const motor = b.lastMotorForce || { x: 0, y: 0, z: 0 };
            const torque = b.lastAppliedTorque || { x: 0, y: 0, z: 0 };
            info += ` | engine:${motor.y?.toFixed?.(1)||0} brake:${applied.y?.toFixed?.(1)||0} steer:${torque.z?.toFixed?.(1)||0}`;
          }
        } catch (e) {}
        el.textContent = info;
      }
      tickCount = 0;
      lastTickLog = now;
    }
  };

  viewer.scene.postRender.addEventListener(_postRenderHandler);
}

export function stopPhysicsLoop() {
  if (!running || !_viewer || !_postRenderHandler) return;
  _viewer.scene.postRender.removeEventListener(_postRenderHandler);
  _postRenderHandler = null;
  _viewer = null;
  running = false;
}
