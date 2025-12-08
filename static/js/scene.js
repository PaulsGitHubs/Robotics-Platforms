// static/js/scene.js

export let viewer = null;

export async function initScene() {
    console.log("Initializing Cesium scene...");

    viewer = new Cesium.Viewer("viewer", {
        animation: false,
        timeline: false,
        baseLayerPicker: true,
        sceneModePicker: false,
        geocoder: false,
        homeButton: false,
        fullscreenButton: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false
    });

    // Default camera view (New York)
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-74.0060, 40.7128, 2000),
        duration: 2
    });

    // Global event log
    viewer.scene.globe.depthTestAgainstTerrain = true;
    console.log("Cesium viewer created.");
}

// Utility for scripts
export function clearAllEntities() {
    if (!viewer) return;
    viewer.entities.removeAll();
}
