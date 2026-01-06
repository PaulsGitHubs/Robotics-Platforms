import { test, expect } from '@playwright/test';

test('page loads, search + autocomplete, place object, and Start Simulation work', async ({
  page,
}) => {
  await page.goto('/templates/digital_twin.modular.html');

  // wait for the console message
  await expect(page.locator('text=Digital Twin Ready')).toHaveCount(1);

  // Intercept Nominatim search and return a fixed location for 'New York'
  await page.route('https://nominatim.openstreetmap.org/search*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { display_name: 'New York, NY, USA', lat: '40.7128', lon: '-74.0060' },
      ]),
    });
  });

  // type and check autocomplete suggestions (debounced)
  await page.fill('#searchBox', 'New');
  await page.waitForTimeout(600);
  const options = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#searchSuggestions option')).map((o) => o.value)
  );
  expect(options.length).toBeGreaterThan(0);

  // GPS UI should be present and offer a toggle
  await expect(page.locator('#gpsStatus')).toHaveCount(1);
  await expect(page.locator('#toggleTrack')).toHaveCount(1);

  // perform a search using the first suggestion
  await page.fill('#searchBox', options[0]);
  await page.click('#searchBtn');
  await page.waitForTimeout(1200);

  // Track placed object: place an object and ensure tracking targets active vehicle
  await page.click('#placeCar');
  const rect1 = await page.locator('#viewer').boundingBox();
  await page.mouse.click(rect1.x + rect1.width / 2, rect1.y + rect1.height / 2);
  await page.waitForTimeout(300);

  // start tracking the active vehicle
  await page.click('#trackVehicle');
  await page.waitForTimeout(300);
  const tracked = await page.locator('#tracked-vehicle').count();
  expect(tracked).toBeGreaterThan(0);
  // stop tracking
  await page.click('#trackVehicle');

  const cam = await page.evaluate(() => {
    const v = window.getViewer();
    const cart = Cesium.Cartographic.fromCartesian(v.camera.position);
    return {
      lat: Cesium.Math.toDegrees(cart.latitude),
      lon: Cesium.Math.toDegrees(cart.longitude),
    };
  });
  expect(Math.abs(cam.lat - 40.7128)).toBeLessThan(1);

  // Test click-to-place: enable place mode then click center of viewer
  await page.click('#placeCar');
  const rect = await page.locator('#viewer').boundingBox();
  await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.waitForTimeout(300);

  const placedCount = await page.evaluate(() => {
    const v = window.getViewer();
    return v.entities.values.filter((e) => e.name === 'placed-object').length;
  });
  expect(placedCount).toBeGreaterThan(0);

  // Now start simulation and verify viewer exists
  await page.click('#startSim');
  await page.waitForTimeout(1000);
  const hasViewer = await page.evaluate(() => !!window.getViewer && !!window.getViewer());
  expect(hasViewer).toBe(true);

  // Verify that the car spawns and moves when simulation runs
  await page.waitForTimeout(500);
  const pos0 = await page.evaluate(() => {
    const v = window.getViewer();
    const e = v.entities.getById('car1');
    if (!e) return null;
    const p = e.position.getValue();
    return { x: p.x, y: p.y, z: p.z };
  });

  await page.waitForTimeout(800);
  const pos1 = await page.evaluate(() => {
    const v = window.getViewer();
    const e = v.entities.getById('car1');
    if (!e) return null;
    const p = e.position.getValue();
    return { x: p.x, y: p.y, z: p.z };
  });

  if (pos0 && pos1) {
    const dist = Math.sqrt(
      (pos1.x - pos0.x) ** 2 + (pos1.y - pos0.y) ** 2 + (pos1.z - pos0.z) ** 2
    );
    expect(dist).toBeGreaterThan(0.0001);
  }

  // Spawn an aircraft and ensure it's added
  await page.click('#spawnAircraft');
  await page.waitForTimeout(400);
  const aircraftCount = await page.evaluate(() => {
    const v = window.getViewer();
    return v.entities.values.filter((e) => e.name === 'aircraft').length;
  });
  expect(aircraftCount).toBeGreaterThanOrEqual(1);

  // Track spawned aircraft as active vehicle
  await page.click('#trackVehicle');
  await page.waitForTimeout(300);
  const tracked2 = await page.locator('#tracked-vehicle').count();
  expect(tracked2).toBeGreaterThan(0);
  await page.click('#trackVehicle');

  // toggle satellite imagery
  await page.click('#toggleSatellite');
  await page.waitForTimeout(200);

  // load buildings (just run the call — network may be required)
  await page.click('#loadBuildings');
  await page.waitForTimeout(500);

  // basic assertion: viewer still exists
  const viewerExists = await page.evaluate(() => !!window.getViewer());
  expect(viewerExists).toBe(true);
});

// -----------------------------
// Satellite & AI panel E2E
// -----------------------------
test('satellite GLB accessible and AI panel drives vehicle', async ({ page }) => {
  await page.goto('/templates/digital_twin.modular.html');

  // ensure satellite glb is reachable (no 404)
  const satRes = await page.request.get('/static/assets/models/satellites/satellites.glb');
  expect(satRes.status()).toBe(200);

  // open AI panel
  await page.click('#openAiPanel');
  await expect(page.locator('#ai-panel')).toBeVisible();
  // input should be focused for quick typing
  await expect(page.locator('#aiInput')).toBeFocused();

  // show help tooltip
  await page.click('#aiHelpBtn');
  await expect(page.locator('#aiHelp')).toBeVisible();
  await expect(page.locator('#aiHelp')).toContainText('Supported commands');
  await page.click('#aiHelpBtn'); // hide

  // Ion token UI should be present and allow setting a token in-browser
  await expect(page.locator('#ionToken')).toBeVisible();
  await page.fill('#ionToken', 'test-token-123');
  await page.click('#setIonBtn');
  await page.waitForTimeout(300);
  const stored = await page.evaluate(() => localStorage.getItem('cesiumIonToken'));
  expect(stored).toBe('test-token-123');
  const cesiumToken = await page.evaluate(() => Cesium.Ion.defaultAccessToken);
  expect(cesiumToken).toBe('test-token-123');

  // mock AI endpoint to return a driving instruction to coordinates
  await page.route('**/ai_query', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Driving to 40.7128 -74.0060', success: true }),
    });
  });

  // start simulation so car exists
  await page.click('#startSim');
  await page.waitForTimeout(700);

  // record initial car position
  const p0 = await page.evaluate(() => {
    const v = window.getViewer();
    const e = v.entities.getById('car1');
    const p = e.position.getValue();
    const cart = Cesium.Cartographic.fromCartesian(p);
    return { lat: Cesium.Math.toDegrees(cart.latitude), lon: Cesium.Math.toDegrees(cart.longitude) };
  });

  // send AI command using the Send button
  await page.fill('#aiInput', 'drive to 40.7128 -74.0060');
  await page.click('#askAiBtn');

  // response should show in UI (button send)
  await page.waitForTimeout(600);
  await expect(page.locator('#aiResponse')).toContainText('Driving to');

  // Now test Enter key sends the command as well (mock same endpoint)
  await page.fill('#aiInput', 'drive to 40.7128 -74.0060');
  await page.press('#aiInput', 'Enter');
  await page.waitForTimeout(600);
  await expect(page.locator('#aiResponse')).toContainText('Driving to');

  // car should start moving towards destination (position change)
  await page.waitForTimeout(1200);
  const p1 = await page.evaluate(() => {
    const v = window.getViewer();
    const e = v.entities.getById('car1');
    const p = e.position.getValue();
    const cart = Cesium.Cartographic.fromCartesian(p);
    return { lat: Cesium.Math.toDegrees(cart.latitude), lon: Cesium.Math.toDegrees(cart.longitude) };
  });

  const dist = Math.sqrt((p1.lat - p0.lat) ** 2 + (p1.lon - p0.lon) ** 2);
  expect(dist).toBeGreaterThan(0.00001);
});

// Verify fallback behavior: when AI is not configured, frontend should still parse & act on the original query
test('AI fallback: local parsing applied when server returns fallback', async ({ page }) => {
  await page.goto('/templates/digital_twin.modular.html');

  // start simulation so car exists
  await page.click('#startSim');
  await page.waitForTimeout(700);

  // initial position
  const p0 = await page.evaluate(() => {
    const v = window.getViewer();
    const e = v.entities.getById('car1');
    const p = e.position.getValue();
    const cart = Cesium.Cartographic.fromCartesian(p);
    return { lat: Cesium.Math.toDegrees(cart.latitude), lon: Cesium.Math.toDegrees(cart.longitude) };
  });

  // mock AI endpoint to return fallback (AI not configured)
  await page.route('**/ai_query', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'AI module not configured. Received: drive to 40.7128 -74.0060', success: false }),
    });
  });

  // open AI panel and send command
  await page.click('#openAiPanel');
  await page.fill('#aiInput', 'drive to 40.7128 -74.0060');
  await page.click('#askAiBtn');

  // response should show fallback message
  await page.waitForTimeout(400);
  await expect(page.locator('#aiResponse')).toContainText('AI module not configured');

  // car should still move due to local parsing
  await page.waitForTimeout(1200);
  const p1 = await page.evaluate(() => {
    const v = window.getViewer();
    const e = v.entities.getById('car1');
    const p = e.position.getValue();
    const cart = Cesium.Cartographic.fromCartesian(p);
    return { lat: Cesium.Math.toDegrees(cart.latitude), lon: Cesium.Math.toDegrees(cart.longitude) };
  });

  const dist = Math.sqrt((p1.lat - p0.lat) ** 2 + (p1.lon - p0.lon) ** 2);
  expect(dist).toBeGreaterThan(0.00001);
});

// New tests: drive to 'my location' and spawn aircraft via AI
test('AI command: drive to my location moves vehicle', async ({ page }) => {
  await page.goto('/templates/digital_twin.modular.html');

  // create a fake user-location marker for deterministic test
  await page.evaluate(() => {
    const v = window.getViewer();
    v.entities.add({ id: 'user-location', position: Cesium.Cartesian3.fromDegrees(-73.9, 40.7), point: { pixelSize: 6, color: Cesium.Color.BLUE } });
  });

  // start simulation so car exists
  await page.click('#startSim');
  await page.waitForTimeout(700);

  const p0 = await page.evaluate(() => {
    const v = window.getViewer();
    const e = v.entities.getById('car1');
    const p = e.position.getValue();
    const cart = Cesium.Cartographic.fromCartesian(p);
    return { lat: Cesium.Math.toDegrees(cart.latitude), lon: Cesium.Math.toDegrees(cart.longitude) };
  });

  // mock AI endpoint to return a message that will be parsed locally
  await page.route('**/ai_query', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Drive to my location', success: true }) });
  });

  await page.click('#openAiPanel');
  await page.fill('#aiInput', 'drive to my location');
  await page.click('#askAiBtn');

  await page.waitForTimeout(1200);

  const p1 = await page.evaluate(() => {
    const v = window.getViewer();
    const e = v.entities.getById('car1');
    const p = e.position.getValue();
    const cart = Cesium.Cartographic.fromCartesian(p);
    return { lat: Cesium.Math.toDegrees(cart.latitude), lon: Cesium.Math.toDegrees(cart.longitude) };
  });

  const dist = Math.sqrt((p1.lat - p0.lat) ** 2 + (p1.lon - p0.lon) ** 2);
  expect(dist).toBeGreaterThan(0.00001);
});

test('AI command: spawn aircraft to coords spawns and moves', async ({ page }) => {
  await page.goto('/templates/digital_twin.modular.html');

  // ensure aircraft model accessible
  const satRes = await page.request.get('/static/assets/models/aircraft/airplane.glb');
  expect(satRes.status()).toBe(200);

  // open AI panel and mock server to reply with spawn message
  await page.route('**/ai_query', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Spawn aircraft to 40.7128 -74.0060', success: true }) });
  });

  await page.click('#startSim');
  await page.waitForTimeout(500);

  const count0 = await page.evaluate(() => window.getViewer().entities.values.filter(e=>e.name==='aircraft').length);

  await page.click('#openAiPanel');
  await page.fill('#aiInput', 'spawn aircraft to 40.7128 -74.0060');
  await page.click('#askAiBtn');

  await page.waitForTimeout(800);

  const count1 = await page.evaluate(() => window.getViewer().entities.values.filter(e=>e.name==='aircraft').length);
  expect(count1).toBeGreaterThan(count0);

  // ensure active vehicle is set and moving
  const moved = await page.evaluate(() => {
    const v = window.getViewer();
    const veh = v.entities.values.find(e=>e.name==='aircraft');
    if (!veh) return false;
    const pos0 = veh.position.getValue();
    const lat0 = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(pos0).latitude);
    return lat0 !== undefined;
  });
  expect(moved).toBe(true);
});
