// static/js/entities.js
import { viewer } from "./scene.js";

export const EntityManager = {
    entities: [],

    addPoint(lon, lat, height = 0, color = Cesium.Color.RED) {
        const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            point: {
                pixelSize: 12,
                color
            }
        });

        this.entities.push(entity);
        return entity;
    },

    addModel(url, lon, lat, height = 0, scale = 1) {
        const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            model: { uri: url, scale }
        });

        this.entities.push(entity);
        return entity;
    },

    remove(entity) {
        viewer.entities.remove(entity);
        this.entities = this.entities.filter(e => e !== entity);
    },

    clear() {
        viewer.entities.removeAll();
        this.entities = [];
    },

    getAll() {
        return this.entities;
    }
};
