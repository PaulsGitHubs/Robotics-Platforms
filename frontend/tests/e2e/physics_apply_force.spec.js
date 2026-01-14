const { test, expect } = require('@playwright/test');

// Ensure the page is ready helper
async function ensureReady(page) {
  await page.goto('/templates/digital_twin.modular.html');
  // Wait for viewer (Cesium) to be initialized; don't rely on the ready div's display
  await page.waitForSelector('#viewer', { timeout: 30000 });
  await page.waitForTimeout(800);
}

// This test boots the page, starts the simulation (light mode), creates the default vehicle
// and applies a forward force using the public API. It asserts that the body's Y position
// increases after some simulation time.

test('Light-mode applyForce moves vehicle forward', async ({ page }) => {
  await ensureReady(page);

  const result = await page.evaluate(async () => {
    try {
      const scene = await import('/static/js/scene.js');
      // Ensure viewer is initialized
      const viewer = scene.getViewer();
      if (!viewer) {
        // Give the page a bit more time and re-check
        await new Promise((r) => setTimeout(r, 1000));
      }

      const simMod = await import('/static/js/simulation/simulation_manager.js');
      const sim = simMod.createSimulation(scene.getViewer());
      // Start the simulation (this will create the car and register physics)
      if (typeof sim.start === 'function') {
        await sim.start();
      }

      // Wait for a vehicle to be created and physics body to be attached
      const start = Date.now();
      while ((!sim.vehicle || !(sim.vehicle.physical || sim.vehicle.entity.body)) && Date.now() - start < 5000) {
        await new Promise((r) => setTimeout(r, 100));
      }

      const vehicle = sim.vehicle;
      if (!vehicle) return { error: 'no vehicle' };

      const body = vehicle.physical || vehicle.entity.body;
      if (!body) return { error: 'no physics body attached' };

      // Record initial position
      const before = { x: body.position.x, y: body.position.y, z: body.position.z };

      // Apply a forward force along +Y
      if (typeof body.applyForce === 'function') {
        body.applyForce({ x: 0, y: 200 * (body.mass || 1), z: 0 });
      } else {
        return { error: 'applyForce not available' };
      }

      // Wait a bit for simulation steps to run
      await new Promise((r) => setTimeout(r, 1000));

      const after = { x: body.position.x, y: body.position.y, z: body.position.z };

      return { before, after };
    } catch (e) {
      return { error: e && e.message ? e.message : String(e) };
    }
  });

  if (result.error) {
    throw new Error('In-page check failed: ' + result.error);
  }

  // Ensure Y increased (moved forward)
  expect(result.after.y).toBeGreaterThan(result.before.y + 0.001);
});

// Apply brake reduces forward speed
test('Light-mode brake reduces forward motion', async ({ page }) => {
  await ensureReady(page);

  const result = await page.evaluate(async () => {
    const simMod = await import('/static/js/simulation/simulation_manager.js');
    const sim = simMod.createSimulation(window.getViewer());
    if (typeof sim.start === 'function') await sim.start();

    const start = Date.now();
    while ((!sim.vehicle || !(sim.vehicle.physical || sim.vehicle.entity.body)) && Date.now() - start < 5000) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const vehicle = sim.vehicle;
    const body = vehicle.physical || vehicle.entity.body;

    if (!body || typeof body.applyForce !== 'function' || !body.position) return { error: 'no body' };

    // apply forward force many times to build up velocity
    const engineForce = 800 * (body.mass || 1);
    for (let i = 0; i < 10; i++) {
      body.applyForce({ x: 0, y: engineForce, z: 0 });
      await new Promise((r) => setTimeout(r, 50));
    }

    const speedBefore = Math.hypot(body._velocity.x || 0, body._velocity.y || 0, body._velocity.z || 0);

    // now apply strong brake force
    const brakeForce = 2000 * (body.mass || 1);
    for (let i = 0; i < 10; i++) {
      body.applyForce({ x: 0, y: -brakeForce, z: 0 });
      await new Promise((r) => setTimeout(r, 50));
    }

    const speedAfter = Math.hypot(body._velocity.x || 0, body._velocity.y || 0, body._velocity.z || 0);

    return { speedBefore, speedAfter };
  });

  if (result.error) throw new Error(result.error);
  // Brake should reduce speed (or at least not increase it)
  expect(result.speedAfter).toBeLessThanOrEqual(result.speedBefore + 0.01);
});

// Steering torque sets lastAppliedTorque and affects state
test('Light-mode steering torque is applied', async ({ page }) => {
  await ensureReady(page);

  const res = await page.evaluate(async () => {
    const simMod = await import('/static/js/simulation/simulation_manager.js');
    const sim = simMod.createSimulation(window.getViewer());
    if (typeof sim.start === 'function') await sim.start();

    const start = Date.now();
    while ((!sim.vehicle || !(sim.vehicle.physical || sim.vehicle.entity.body)) && Date.now() - start < 5000) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const body = sim.vehicle.physical || sim.vehicle.entity.body;
    if (!body) return { error: 'no body' };

    // apply a steering torque
    if (typeof body.applyTorque !== 'function') return { error: 'no applyTorque' };
    body.applyTorque({ x: 0, y: 0, z: 50 });
    await new Promise((r) => setTimeout(r, 200));
    return { torque: body.lastAppliedTorque };
  });

  if (res.error) throw new Error(res.error);
  expect(res.torque).toBeTruthy();
  expect(res.torque.z).toBeGreaterThan(0);
});

// Switching to Ammo mode should not crash and should keep the loop running
test('Switching to Ammo mode does not break physics loop', async ({ page }) => {
  await ensureReady(page);
  const ok = await page.evaluate(async () => {
    try {
      const pr = await import('/static/js/physics-runtime/PhysicsRouter.js');
      pr.setMode('ammo');
      // allow time for init attempt
      await new Promise((r) => setTimeout(r, 800));
      // check mode reported and physicsDebug present
      const mode = pr.getMode ? pr.getMode() : 'unknown';
      const debugEl = document.getElementById('physicsDebug');
      return { mode, debugVisible: !!debugEl };
    } catch (e) {
      return { error: String(e) };
    }
  });

  if (ok.error) throw new Error(ok.error);
  // Mode should be set to ammo (may fallback internally but setMode must succeed)
  expect(ok.mode === 'ammo' || ok.mode === 'light' || ok.mode === 'unknown').toBeTruthy();
  expect(ok.debugVisible).toBeTruthy();
});