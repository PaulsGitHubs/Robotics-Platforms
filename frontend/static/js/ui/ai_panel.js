export function initAIPanel() {
  console.log("AI panel ready");
  const root = document.getElementById('ui');
  if (!root) return;

  const startBtn = document.createElement('button');
  startBtn.id = 'startAutopilot';
  startBtn.textContent = 'Start Autopilot';
  root.appendChild(startBtn);

  const stopBtn = document.createElement('button');
  stopBtn.id = 'stopAutopilot';
  stopBtn.textContent = 'Stop Autopilot';
  root.appendChild(stopBtn);

  startBtn.addEventListener('click', async () => {
    const mod = await import('/static/js/simulation/simulation_manager.js');
    const vehicle = mod.getActiveVehicle();
    if (!vehicle) {
      console.warn('No active vehicle to control');
      return;
    }
    const pos = vehicle.entity.position.getValue();
    const carto = Cesium.Cartographic.fromCartesian(pos);
    const lon = Cesium.Math.toDegrees(carto.longitude);
    const lat = Cesium.Math.toDegrees(carto.latitude);
    const alt = carto.height || 0;

    const wps = [
      { lon: lon + 0.001, lat: lat, alt },
      { lon: lon + 0.002, lat: lat + 0.0005, alt },
      { lon: lon + 0.003, lat: lat + 0.001, alt },
    ];
    vehicle.followWaypoints(wps, 50);
  });

  stopBtn.addEventListener('click', async () => {
    const mod = await import('/static/js/simulation/simulation_manager.js');
    const vehicle = mod.getActiveVehicle();
    if (!vehicle) return;
    vehicle.waypoints = [];
    if (vehicle.physical) {
      vehicle.physical.velocity.x = 0;
      vehicle.physical.velocity.y = 0;
      vehicle.physical.velocity.z = 0;
    }
  });
}
