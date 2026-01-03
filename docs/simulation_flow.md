# Simulation Flow

This document explains how the simulation lifecycle works and how components communicate.

1. Initialization

   - `initScene()` creates the Cesium Viewer, sets imagery/terrain depending on Ion token availability, and starts the physics loop (if physics enabled).
   - UI modules are initialized (`initEditor`, `initSearchPanel`, `startUserLocationTracking`, etc.).

2. Simulation managers

   - `SimulationManager` encapsulates entities (vehicles, satellites) and binds an `update()` method to viewer preUpdate events.
   - Each entity type (VehicleEntity, AircraftEntity) provides `update()` and control methods (accelerate, brake, setWaypoint).

3. Physics loop

   - A central `physicsStep(dt)` is executed each `preUpdate` and integrates rigid bodies, applies buoyancy, handles collision, and updates Cesium entity positions.

4. Event triggers

   - Checkpoints and triggers (e.g., police stop) are evaluated each update and may call `vehicle.brake()` or other methods.

5. Object placement & AI

   - `enableClickToPlace()` lets users place models on the globe. After placement the frontend POSTs to `/ai/object` for classification and annotations. AI responses may add labels or suggested actions to the entity.

6. Persistence & UX

   - Entities and user selections are kept in memory; persistent storage or server-side sessions are optional next steps for real deployments.

7. Tests & validation
   - Unit tests for backend endpoints exist in `backend/tests`. E2E Playwright tests under `frontend/tests/e2e` validate UI flows such as search, placement, and building loading.

---

Guidelines: keep simulation managers small, prefer deterministic updates in `preUpdate`, and offload heavy AI calls to backend endpoints for reliability.
