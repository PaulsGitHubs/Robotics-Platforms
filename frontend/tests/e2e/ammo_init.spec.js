import { test, expect } from '@playwright/test';

test('Ammo init behaves correctly (success or graceful fallback)', async ({ page }) => {
  const messages = [];
  page.on('console', (msg) => messages.push(msg.text()));

  await page.goto('/templates/digital_twin.modular.html');
  await page.waitForSelector('#viewer', { timeout: 5000 });

  // Ask the app to attempt Ammo init via the router
  await page.evaluate(async () => {
    const router = await import('/static/js/physics-runtime/PhysicsRouter.js');
    // Attempt to enable Ammo mode (will only enable after init completes)
    router.setMode('ammo');
  });

  // Give it some time for async init to run and log
  await page.waitForTimeout(2000);

  const foundInitSuccess = messages.some((m) => m.includes('[AmmoAdapter] Ammo initialized successfully'));
  const foundFallback = messages.some((m) => m.includes('[AmmoAdapter] Ammo failed to load → using Light physics'));
  const foundBad = messages.some((m) => m.includes('Ammo.js not available on window'));

  expect(foundBad).toBeFalsy();
  expect(foundInitSuccess || foundFallback).toBeTruthy();
});