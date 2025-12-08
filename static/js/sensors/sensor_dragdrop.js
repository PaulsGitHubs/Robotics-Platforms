// static/js/sensors/sensor_dragdrop.js
import { SensorFactory } from "./sensor_factory.js";
import { viewer } from "../scene.js";

export function enableSensorPlacement() {
    const viewerDiv = document.getElementById("viewer");

    viewerDiv.addEventListener("dragover", (e) => e.preventDefault());

    viewerDiv.addEventListener("drop", (e) => {
        e.preventDefault();

        const sensorType = e.dataTransfer.getData("sensorType");

        // Pick position from screen
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
