import { SensorFactory } from "./sensor_factory.js";
import { getViewer } from "../scene.js";

export function enableSensorPlacement() {
    const viewerDiv = document.getElementById("viewer");

    viewerDiv.addEventListener("dragover", (e) => e.preventDefault());

    viewerDiv.addEventListener("drop", (e) => {
        e.preventDefault();

        const viewer = getViewer();
        if (!viewer) {
            console.error("Viewer not ready yet");
            return;
        }

        const sensorType = e.dataTransfer.getData("sensorType");

        const pos = viewer.camera.pickEllipsoid(
            new Cesium.Cartesian2(e.clientX, e.clientY)
        );

        if (!pos) {
            alert("Drop on the terrain, not outside.");
            return;
        }

        const carto = Cesium.Cartographic.fromCartesian(pos);
        const lon = Cesium.Math.toDegrees(carto.longitude);
        const lat = Cesium.Math.toDegrees(carto.latitude);

        const sensor = SensorFactory.create(sensorType, viewer, {
            lon,
            lat,
            height: 2
        });

        if (sensor) {
            sensor.addToScene();
            console.log(`Placed ${sensorType} at ${lon}, ${lat}`);
        }
    });
}
