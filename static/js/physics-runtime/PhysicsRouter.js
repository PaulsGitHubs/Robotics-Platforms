import * as light from '../physics/physics.js';

let mode = 'light';
let ammo = null;
let _ammoInitAttempted = false;
let _ammoFallbackLogged = false;

// Track registered bodies so we can forward creates/removes to Ammo when active
const _registered = new Set();

export async function initPhysics(modeChoice = 'light') {
  if (modeChoice !== 'ammo') {
    mode = 'light';
    return;
  }

  if (_ammoInitAttempted) return;
  _ammoInitAttempted = true;

  try {
    const { AmmoAdapter } = await import('./AmmoAdapter.js');
    ammo = new AmmoAdapter();
    const enabled = await ammo.init(); // resolves to true/false
    if (enabled) {
      for (const b of _registered) {
        try {
          ammo.createBody(b);
        } catch (e) {}
      }
      mode = 'ammo';
      console.log('[PhysicsRouter] Ammo physics enabled');
    } else {
      mode = 'light';
      if (!_ammoFallbackLogged) {
        console.info('[PhysicsRouter] Ammo not available → using Light physics');
        _ammoFallbackLogged = true;
      }
    }
  } catch (e) {
    mode = 'light';
    if (!_ammoFallbackLogged) {
      console.info('[PhysicsRouter] Ammo initialization failed → using Light physics');
      _ammoFallbackLogged = true;
    }
  }
}

export function getMode() {
  return mode;
}

export function setMode(choice) {
  if (choice === 'ammo') {
    initPhysics('ammo');
  } else {
    mode = 'light';
    for (const b of _registered) {
      try {
        light.registerBody(b);
      } catch (e) {
        // Swallow to avoid console noise
      }
    }
  }
}

export function registerBody(body) {
  _registered.add(body);
  if (mode === 'ammo' && ammo && ammo.enabled) {
    try { ammo.createBody(body); } catch (e) {}
  } else {
    try { light.registerBody(body); } catch (e) {}
  }
}

export function unregisterBody(body) {
  _registered.delete(body);
  if (mode === 'ammo' && ammo && ammo.enabled) {
    try { ammo.removeBody(body); } catch (e) {}
  }
}

export function stepPhysics(dt) {
  if (mode === 'ammo' && ammo && ammo.enabled) {
    try { ammo.step(dt); } catch (e) {}
  } else {
    try { light.physicsStep(dt); } catch (e) {}
  }
}

export function applyForce(body, force) {
  if (!body || !force) return;
  if (mode === 'ammo' && ammo && ammo.enabled) {
    try { ammo.applyForce(body, force); } catch (e) {}
  } else {
    try { if (typeof body.applyForce === 'function') body.applyForce(force); } catch (e) {}
  }
}

export function applyTorque(body, torque) {
  if (!body || !torque) return;
  if (mode === 'ammo' && ammo && ammo.enabled) {
    try { ammo.applyTorque(body, torque); } catch (e) {}
  } else {
    try { if (typeof body.applyTorque === 'function') body.applyTorque(torque); } catch (e) {}
  }
}

export function getRegisteredBodies() {
  return Array.from(_registered);
}

export function applySnapshot(snapshot) {
  // snapshot: [{ id, position: {x,y,z}, velocity: {x,y,z} }, ...]
  if (!Array.isArray(snapshot)) return;
  for (const s of snapshot) {
    for (const b of _registered) {
      if (b.id === s.id) {
        b.serverPosition = s.position;
        b.serverVelocity = s.velocity;
        // optionally apply a smaller alpha if large discrepancy
        if (!b.reconciliationAlpha) b.reconciliationAlpha = 0.15;
      }
    }
  }
}
