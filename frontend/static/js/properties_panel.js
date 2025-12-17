// static/js/properties_panel.js

import { EntityManager } from "./entities.js";

export const PropertiesPanel = {
    selected: null,

    selectEntity(entity) {
        this.selected = entity;
        this.render();
    },

    clear() {
        this.selected = null;
        this.render();
    },

    render() {
        const panel = document.getElementById("consoleOutput");
        if (!panel) return;

        if (!this.selected) {
            panel.innerText = "No entity selected.";
            return;
        }

        const p = this.selected;

        panel.innerText = `
Selected Entity:
------------------
ID: ${p.id}
Type: ${p.point ? "Point" : "Model"}

`;
    }
};
