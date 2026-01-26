/* UI helpers to show GPS coordinates and tracking status */
let _viewer = null;
let _watchId = null;
let _marker = null;

export function initGPSUI(viewer) {
  _viewer = viewer;
  const status = document.createElement('div');
  status.id = 'gpsStatus';
  status.style.marginLeft = '10px';
  status.textContent = 'GPS: unavailable';
  document.getElementById('ui').appendChild(status);

  const trackBtn = document.createElement('button');
  trackBtn.id = 'toggleTrack';
  trackBtn.textContent = 'Start Tracking';
  document.getElementById('ui').appendChild(trackBtn);

  const followBtn = document.createElement('button');
  followBtn.id = 'followUser';
  followBtn.textContent = 'Follow User';
  followBtn.dataset.enabled = '0';
  document.getElementById('ui').appendChild(followBtn);

  let _follow = false;
  followBtn.addEventListener('click', () => {
    _follow = followBtn.dataset.enabled === '0';
    followBtn.dataset.enabled = _follow ? '1' : '0';
    followBtn.textContent = _follow ? 'Following' : 'Follow User';
  });

  trackBtn.addEventListener('click', () => {
    if (_watchId) {
      navigator.geolocation.clearWatch(_watchId);
      _watchId = null;
      trackBtn.textContent = 'Start Tracking';
      status.textContent = 'GPS: stopped';
      if (_marker) {
        try {
          _viewer.entities.remove(_marker);
        } catch (e) {}
        _marker = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      status.textContent = 'GPS not supported';
      return;
    }

    _watchId = navigator.geolocation.watchPosition(
      (p) => {
        const { latitude, longitude, accuracy } = p.coords;
        status.textContent = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(
          accuracy
        )}m)`;

        if (!_viewer) return;
        if (_marker) {
          _marker.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
        } else {
          _marker = _viewer.entities.add({
            id: 'user-location',
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 0),
            point: { pixelSize: 12, color: Cesium.Color.BLUE },
            label: { text: 'You', pixelOffset: new Cesium.Cartesian2(0, -25) },
          });
        }

        // fly to on first fix, or follow if enabled
        if (_follow) {
          // smooth follow with short duration
          _viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 800),
            duration: 0.4,
          });
        } else {
          // fly on first fix
          _viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 1000),
            duration: 0.8,
          });
        }
      },
      (err) => {
        status.textContent = 'GPS error';
        console.error('GPS error:', err);
      },
      { enableHighAccuracy: true }
    );

    trackBtn.textContent = 'Stop Tracking';
  });

  // Track active vehicle in simulation (if any)
  const trackVehBtn = document.createElement('button');
  trackVehBtn.id = 'trackVehicle';
  trackVehBtn.textContent = 'Track Vehicle';
  document.getElementById('ui').appendChild(trackVehBtn);

  let _vehHandler = null;
  trackVehBtn.addEventListener('click', async () => {
    if (_vehHandler) {
      try {
        _viewer.clock.onTick.removeEventListener(_vehHandler);
      } catch (e) {}
      _vehHandler = null;
      trackVehBtn.textContent = 'Track Vehicle';
      return;
    }

    const mod = await import('/static/js/simulation/simulation_manager.js');
    const vehicle = mod.getActiveVehicle();
    if (!vehicle) {
      status.textContent = 'No vehicle to track';
      return;
    }

    _vehHandler = () => {
      try {
        const pos = vehicle.entity.position.getValue();
        // Clone the Cartesian3 to avoid mutating the vehicle's position directly
        const posClone = Cesium.Cartesian3.clone(pos);
        if (!_marker) {
          _marker = _viewer.entities.add({
            id: 'tracked-vehicle',
            position: posClone,
            point: { pixelSize: 12, color: Cesium.Color.RED },
            label: { text: 'Vehicle', pixelOffset: new Cesium.Cartesian2(0, -25) },
          });
        } else {
          _marker.position = posClone;
        }
      } catch (e) {
        console.warn('Vehicle tracking error', e);
      }
    };

    _viewer.clock.onTick.addEventListener(_vehHandler);
    trackVehBtn.textContent = 'Stop Tracking';
  });
}
