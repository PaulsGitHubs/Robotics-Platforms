
// }

import { getViewer } from '/static/js/scene.js';

function debounce(fn, wait = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

async function fetchSuggestions(q) {
  if (!q) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&limit=5`;
    const res = await fetch(url);
    const data = await res.json();
    return data.map((d) => ({ label: d.display_name, lat: d.lat, lon: d.lon }));
  } catch (e) {
    console.warn('Failed to fetch suggestions', e);
    return [];
  }
}

export function initSearchPanel() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchPanel, { once: true });
    return;
  }

  let input = document.getElementById('searchBox');
  let btn = document.getElementById('searchBtn');
  let datalist = document.getElementById('searchSuggestions');

  // If UI elements are missing, create them so the search panel still works when embedded differently
  const ui = document.getElementById('ui') || document.body;
  if (!input) {
    input = document.createElement('input');
    input.id = 'searchBox';
    input.placeholder = 'Search location...';
    ui.insertBefore(input, ui.firstChild);
    console.log('Created search input dynamically');
  }
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'searchBtn';
    btn.textContent = 'Search';
    ui.insertBefore(btn, input.nextSibling);
    console.log('Created search button dynamically');
  }
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'searchSuggestions';
    document.body.appendChild(datalist);
  }

  const onInput = debounce(async () => {
    const q = (input.value || '').trim();
    if (!q) return;
    const items = await fetchSuggestions(q);
    datalist.innerHTML = '';
    items.forEach((it) => {
      const opt = document.createElement('option');
      opt.value = it.label;
      datalist.appendChild(opt);
    });
  }, 250);

  input.addEventListener('input', onInput);

  btn.onclick = async () => {
    const q = input.value.trim();
    if (!q) return;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
    );

    const data = await res.json();
    if (!data.length) {
      alert('Location not found');
      return;
    }

    const { lat, lon } = data[0];
    const viewer = getViewer();

    if (viewer) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(Number(lon), Number(lat), 2000),
      });
    }
  };

  console.log('Search panel initialized');
}
