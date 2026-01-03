/* global Cesium */
/* eslint-env browser */
import { physicsStep } from '/static/js/physics/physics.js';

let viewer = null;
let lastTime = performance.now();

export function getViewer() {
  return viewer;
}

export async function initScene() {
  console.log('Initializing Cesium scene...');

  if (typeof Cesium === 'undefined') {
    console.error('Cesium not loaded. Check CDN/network or your Ion token.');
    const el = document.getElementById('viewer') || document.getElementById('cesiumContainer');
    if (el) el.textContent = 'Cesium failed to load. Check network or CDN.';
    return;
  }

  // If Cesium Ion token is set, prefer world terrain/imagery
  const hasIon = typeof Cesium !== 'undefined' && Cesium.Ion?.defaultAccessToken;

  viewer = new Cesium.Viewer('viewer', {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    sceneModePicker: false,
    geocoder: false,
    homeButton: false,
    fullscreenButton: false,
    navigationHelpButton: false,
    infoBox: false,
    selectionIndicator: false,

    imageryProvider: hasIon && Cesium.createWorldImagery ? Cesium.createWorldImagery() : undefined,
    terrainProvider:
      hasIon && Cesium.createWorldTerrain
        ? Cesium.createWorldTerrain()
        : new Cesium.EllipsoidTerrainProvider(),
  });

  // Optional: transparent background so UI overlays can be seen
  viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
  // Ensure the viewer container element itself is transparent for embedding
  try {
    if (viewer && viewer.container && viewer.container.style)
      viewer.container.style.background = 'transparent';
  } catch (e) {}

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 2000),
    duration: 2,
  });

  viewer.scene.globe.depthTestAgainstTerrain = true;

  startPhysicsLoop();

  console.log('Cesium viewer created.');
}

function startPhysicsLoop() {
  viewer.scene.preUpdate.addEventListener(() => {
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;
    physicsStep(delta);
  });
}

// Click-to-place helpers
let _placingHandler = null;
export function enableClickToPlace(modelUri = '/static/assets/models/cars/sedan.glb') {
  if (!viewer) return;
  if (_placingHandler) return; // already enabled

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  const placeEntity = async (position) => {
    // Try a cheap existence check for the model file (HEAD) and fall back to a point if not found
    let ent;
    try {
      const head = await fetch(modelUri, { method: 'HEAD' });
      const contentLen = head.headers.get('content-length');
      if (head.ok && contentLen && parseInt(contentLen, 10) > 50) {
        ent = viewer.entities.add({ position, model: { uri: modelUri }, name: 'placed-object' });
      } else {
        ent = viewer.entities.add({
          position,
          point: { pixelSize: 12, color: Cesium.Color.ORANGE },
          name: 'placed-object',
        });
      }
    } catch (e) {
      // network/HEAD failed — fallback to a visible point
      ent = viewer.entities.add({
        position,
        point: { pixelSize: 12, color: Cesium.Color.ORANGE },
        name: 'placed-object',
      });
    }

    // Attach a label directly to the entity so it follows it
    ent.label = {
      text: ent.name || 'placed-object',
      font: '13px sans-serif',
      pixelOffset: new Cesium.Cartesian2(0, -30),
      showBackground: true,
    };

    // Register this entity as the active vehicle so AI/track/labels operate on it
    try {
      const mod = await import('/static/js/simulation/simulation_manager.js');
      mod.createSimulation(viewer); // ensure sim manager exists
      mod.setActiveVehicleFromEntity(ent);
    } catch (e) {
      console.warn('Failed to register active vehicle:', e);
    }

    // Try to classify the placed object via backend AI endpoint
    try {
      const modelName = modelUri.split('/').pop();
      const res = await fetch('/ai/object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object: { model: modelName } }),
      });
      if (res.ok) {
        const js = await res.json();
        if (js.classification) {
          ent.name = js.classification + (js.suggestions ? ` (${js.suggestions.join(',')})` : '');
          ent.label.text = ent.name;
        }
      }
    } catch (e) {
      console.warn('AI classify failed', e);
    }
  };

  handler.setInputAction((click) => {
    // use pickEllipsoid as a fallback when scene.pickPosition is not available
    const cartesian =
      viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid) ||
      viewer.scene.pickPosition(click.position);
    if (!cartesian) return;

    placeEntity(cartesian);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // Touch fallback: handle touchstart to allow placement on mobile
  const canvas = viewer.scene.canvas;
  const touchHandler = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const cartesian =
      viewer.camera.pickEllipsoid(new Cesium.Cartesian2(x, y), viewer.scene.globe.ellipsoid) ||
      viewer.scene.pickPosition(new Cesium.Cartesian2(x, y));
    if (!cartesian) return;
    placeEntity(cartesian);
  };

  canvas.addEventListener('touchstart', touchHandler, { passive: false });

  // store both so disabling cleans up
  handler._touchHandler = touchHandler;

  _placingHandler = handler;
}

export function disableClickToPlace() {
  if (!_placingHandler) return;
  try {
    // Remove any attached touch handler (cleanup for mobile)
    const canvas = viewer && viewer.scene && viewer.scene.canvas;
    if (canvas && _placingHandler._touchHandler) {
      try {
        canvas.removeEventListener('touchstart', _placingHandler._touchHandler, { passive: false });
      } catch (e) {
        // Some browsers don't accept the same options object when removing — try without options
        try {
          canvas.removeEventListener('touchstart', _placingHandler._touchHandler);
        } catch (e2) {
          /* ignore */
        }
      }
    }

    try {
      _placingHandler.destroy();
    } catch (e) {
      /* ignore */
    }
  } catch (e) {
    console.warn('Error while disabling click-to-place:', e);
  } finally {
    _placingHandler = null;
  }
}

// 3D buildings loader
let _buildingsTileset = null;
let _satelliteLayer = null;
let _satelliteEnabled = false;
let _lightingEnabled = false;

export async function load3DBuildings(assetId = 96188) {
  if (!viewer) return null;
  if (!Cesium.Ion?.defaultAccessToken) {
    console.warn('No Cesium Ion token set; cannot load Ion asset tileset');
    return null;
  }

  try {
    const resource = await Cesium.IonResource.fromAssetId(assetId);
    if (_buildingsTileset) {
      try {
        viewer.scene.primitives.remove(_buildingsTileset);
      } catch (e) {}
      _buildingsTileset = null;
    }

    _buildingsTileset = await Cesium.Cesium3DTileset.fromUrl(resource);
    viewer.scene.primitives.add(_buildingsTileset);
    console.log('3D buildings loaded');
    return _buildingsTileset;
  } catch (e) {
    console.error('Failed to load 3D buildings:', e);
    return null;
  }
}

export function toggleBuildingsVisibility(visible) {
  if (!_buildingsTileset) return;
  _buildingsTileset.show = visible;
}

// Satellite imagery toggle
export function toggleSatelliteImagery(enabled) {
  if (!viewer) return;
  if (enabled === _satelliteEnabled) return;

  if (enabled) {
    // Add ESRI World Imagery layer as satellite imagery provider
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    });
    _satelliteLayer = viewer.imageryLayers.addImageryProvider(provider);
    _satelliteEnabled = true;
  } else {
    if (_satelliteLayer) {
      try {
        viewer.imageryLayers.remove(_satelliteLayer);
      } catch (e) {}
      _satelliteLayer = null;
    }
    _satelliteEnabled = false;
  }
}

// Lighting and terrain improvements
export function setLighting(enabled) {
  if (!viewer) return;
  viewer.scene.globe.enableLighting = !!enabled;
  viewer.shadows = !!enabled;
  if (enabled) {
    viewer.scene.globe.depthTestAgainstTerrain = true;
  }
  _lightingEnabled = !!enabled;
}

export function clearAllEntities() {
  if (viewer) viewer.entities.removeAll();
}

