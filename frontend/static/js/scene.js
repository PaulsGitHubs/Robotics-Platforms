import { physicsStep } from "../../physics/physics.js";

let viewer = null;
let lastTime = performance.now();

export function getViewer() {
    return viewer;
}

export async function initScene() {
    console.log("Initializing Cesium scene (Ion disabled)...");

    viewer = new Cesium.Viewer("viewer", {
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

        // 🔴 THIS DISABLES CESIUM ION COMPLETELY
        imageryProvider: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    });

    // Optional: light blue background so globe isn't black
    viewer.scene.backgroundColor = Cesium.Color.SKYBLUE;

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 2000),
        duration: 2
    });

    viewer.scene.globe.depthTestAgainstTerrain = true;

    startPhysicsLoop();

    console.log("Cesium viewer created (no Ion).");
}

function startPhysicsLoop() {
    viewer.scene.preUpdate.addEventListener(() => {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        physicsStep(delta);
    });
}

export function clearAllEntities() {
    if (viewer) viewer.entities.removeAll();
}
