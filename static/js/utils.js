// static/js/utils.js

export const Utils = {
    randomColor() {
        return Cesium.Color.fromBytes(
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255)
        );
    },

    cartesianToLonLat(cartesian) {
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        return {
            lon: Cesium.Math.toDegrees(carto.longitude),
            lat: Cesium.Math.toDegrees(carto.latitude),
            height: carto.height
        };
    },

    lonLatToCartesian(lon, lat, height = 0) {
        return Cesium.Cartesian3.fromDegrees(lon, lat, height);
    },

    UUID() {
        return "xxxx-4xxx-yxxx-xxxx".replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0,
                  v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};
