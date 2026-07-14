(function() {
  'use strict';

  const YEARS = [2015, 2020, 2030, 2040, 2050, 2060, 2070, 2080];
  const PLAY_INTERVAL = 1200;

  const aliases = {
    'Czech Republic': 'Czechia',
    'Slovak Republic': 'Slovakia'
  };

  const state = {
    currentYearIdx: 0,
    playing: false,
    playInterval: null,
    geoLayer: null,
    selectedCountry: null,
    chartInstance: null,
    popData: null,
    map: null,
    initialBounds: null
  };

  function interpolateColor(c1, c2, t) {
    const r1 = parseInt(c1.slice(1, 3), 16),
          g1 = parseInt(c1.slice(3, 5), 16),
          b1 = parseInt(c1.slice(5, 7), 16),
          r2 = parseInt(c2.slice(1, 3), 16),
          g2 = parseInt(c2.slice(3, 5), 16),
          b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t),
          g = Math.round(g1 + (g2 - g1) * t),
          b = Math.round(b1 + (b2 - b1) * t);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  const colorStops = [
    [0, '#1a1a2e'],
    [500000, '#fff8e1'],
    [2000000, '#ffecb3'],
    [5000000, '#ffd54f'],
    [10000000, '#ffb74d'],
    [15000000, '#ff9800'],
    [25000000, '#f57c00'],
    [40000000, '#ef6c00'],
    [55000000, '#e53935'],
    [70000000, '#c62828'],
    [78000000, '#b71c1c'],
    [82000000, '#880e4f'],
    [90000000, '#4a148c']
  ];

  function getColor(pop) {
    if (!pop || pop <= 0) return '#1a1a2e';
    for (let i = 1; i < colorStops.length; i++) {
      if (pop < colorStops[i][0]) {
        const t = (pop - colorStops[i - 1][0]) / (colorStops[i][0] - colorStops[i - 1][0]);
        return interpolateColor(colorStops[i - 1][1], colorStops[i][1], t);
      }
    }
    return colorStops[colorStops.length - 1][1];
  }

  function formatNum(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatPct(v) {
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  }

  function resolveName(geoName) {
    if (state.popData[geoName]) return geoName;
    if (aliases[geoName]) return aliases[geoName];
    return null;
  }

  function initMap() {
    state.map = L.map('map', {
      center: [50, 15],
      zoom: 4,
      minZoom: 3,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(state.map);
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(state.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(state.map);
  }

  function updateMapColors() {
    if (!state.geoLayer) return;
    const year = YEARS[state.currentYearIdx];
    state.geoLayer.eachLayer(function(layer) {
      const name = layer.feature._popName;
      if (name && state.popData[name]) {
        const pop = state.popData[name].pop[year];
        const isSelected = name === state.selectedCountry;
        layer.setStyle({
          fillColor: getColor(pop),
          fillOpacity: isSelected ? 0.9 : 0.7,
          weight: isSelected ? 3 : 1,
          color: isSelected ? '#4fc3f7' : 'rgba(255,255,255,0.2)'
        });
      } else {
        layer.setStyle({
          fillColor: '#0d0d1a',
          fillOpacity: 0.3,
          weight: 0.5,
          color: 'rgba(255,255,255,0.05)'
        });
      }
    });
  }

  function updateUI() {
    const year = YEARS[state.currentYearIdx];
    document.querySelector('#year-display').innerHTML = '<span>' + year + '</span>';
    document.getElementById('year-slider').value = state.currentYearIdx;
    document.getElementById('year-slider').setAttribute('aria-valuenow', state.currentYearIdx);
    updateMapColors();
    if (state.selectedCountry) {
      updatePanel(state.selectedCountry, year);
      updateSelectedPopup(state.selectedCountry);
    }
  }

  function popupContent(name) {
    const pop = state.popData[name].pop[YEARS[state.currentYearIdx]] || 0;
    return '<div style="text-align:center">' +
           '<b style="font-size:15px;color:#fff">' + name + '</b>' +
           '<br><span style="font-size:11px;color:#888">' + YEARS[state.currentYearIdx] + '</span>' +
           '<br><span style="font-size:22px;font-weight:800;color:#4fc3f7">' + formatNum(pop) + '</span>' +
           '<br><span style="font-size:11px;color:#888">habitantes</span>' +
           '</div>';
  }

  function updateSelectedPopup(name) {
    const layer = state.geoLayer.getLayers().find(function(candidate) {
      return candidate.feature._popName === name;
    });
    if (layer && layer.isPopupOpen()) layer.getPopup().setContent(popupContent(name));
  }

  function updatePanel(name, year) {
    const d = state.popData[name];
    if (!d) return;
    document.getElementById('panel-country').textContent = name;
    document.getElementById('panel-year').textContent = 'Datos para ' + year;
    document.getElementById('stat-pop').textContent = formatNum(d.pop[year]) + ' hab.';
    const density = (d.pop[year] / d.area).toFixed(1);
    document.getElementById('stat-density').textContent = density + ' hab./km2';
    const change = ((d.pop[year] - d.pop[2015]) / d.pop[2015] * 100);
    const changeEl = document.getElementById('stat-change');
    changeEl.innerHTML = formatPct(change) + '<span class="stat-change ' + (change >= 0 ? 'up' : 'down') + '">' + (change >= 0 ? '&#8593;' : '&#8595;') + '</span>';
    let peakYear = 2015, peakPop = 0;
    for (const y of YEARS) {
      if (d.pop[y] > peakPop) { peakPop = d.pop[y]; peakYear = y; }
    }
    document.getElementById('stat-peak').textContent = formatNum(peakPop) + ' (' + peakYear + ')';
    renderChart(name);
  }
  function renderChart(name) {
    const d = state.popData[name];
    if (!d) return;
    const canvas = document.getElementById('country-chart');
    if (!canvas) return;
    if (state.chartInstance) state.chartInstance.destroy();
    const year = YEARS[state.currentYearIdx];
    state.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: YEARS,
        datasets: [{
          data: YEARS.map(y => d.pop[y]),
          borderColor: '#4fc3f7',
          backgroundColor: 'rgba(79,195,247,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: YEARS.map(y => y === year ? 6 : 3),
          pointBackgroundColor: YEARS.map(y => y === year ? '#fff' : '#4fc3f7'),
          pointBorderColor: YEARS.map(y => y === year ? '#4fc3f7' : 'transparent'),
          pointBorderWidth: YEARS.map(y => y === year ? 2 : 0),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#888', font: { size: 9 } },
            grid: { color: 'rgba(255,255,255,0.04)' }
          },
          y: {
            ticks: { color: '#888', font: { size: 9 }, callback: function(v) { return (v / 1000000).toFixed(0) + 'M'; } },
            grid: { color: 'rgba(255,255,255,0.04)' }
          }
        }
      }
    });
  }

  function onEachFeature(feature, layer) {
    const name = feature.properties && feature.properties.name;
    if (!name || !state.popData[name]) return;
    feature._popName = name;
    const year = YEARS[state.currentYearIdx];
    const popData = state.popData[name];
    if (!popData || !popData.pop) return;
    const pop = popData.pop[year] || 0;
    layer.setStyle({
      fillColor: getColor(pop),
      fillOpacity: 0.7,
      weight: 1,
      color: 'rgba(255,255,255,0.2)'
    });
    layer.bindTooltip(function() {
      const currentPop = popData.pop[YEARS[state.currentYearIdx]] || 0;
      return '<div class="country-name">' + name + '</div>' +
             '<div class="pop-value">' + formatNum(currentPop) + '</div>' +
             '<div class="pop-label">habitantes (' + YEARS[state.currentYearIdx] + ')</div>';
    }, { className: 'info-tooltip', sticky: true });
    layer.on({
      mouseover: function(e) {
        if (!state.selectedCountry || state.selectedCountry !== name) {
          e.target.setStyle({ weight: 2, color: '#4fc3f7', fillOpacity: 0.85 });
          e.target.bringToFront();
        }
      },
      mouseout: function(e) {
        if (state.selectedCountry !== name) {
          e.target.setStyle({ weight: 1, color: 'rgba(255,255,255,0.2)', fillOpacity: 0.7 });
        }
      },
      click: function(e) {
        if (state.selectedCountry) {
          const prev = state.geoLayer.getLayers().find(function(l) {
            return l.feature._popName === state.selectedCountry;
          });
          if (prev) prev.setStyle({ weight: 1, color: 'rgba(255,255,255,0.2)', fillOpacity: 0.7 });
        }
        state.selectedCountry = name;
        e.target.setStyle({ weight: 3, color: '#4fc3f7', fillOpacity: 0.9 });
        e.target.bringToFront();
        updatePanel(name, YEARS[state.currentYearIdx]);
        document.getElementById('panel').classList.add('visible');
        document.getElementById('panel').setAttribute('aria-hidden', 'false');
        e.target.bindPopup(popupContent(name), { maxWidth: 280 }).openPopup();
      }
    });
  }
  function stripBom(text) {
    if (text.charCodeAt(0) === 0xFEFF) return text.slice(1);
    return text;
  }

  function loadGeoData() {
    fetch('data/eu-countries.json?v=' + Date.now())
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load GeoJSON');
        return response.text();
      })
      .then(function(text) {
        const json = JSON.parse(stripBom(text));
        if (!json || !json.features) {
          throw new Error('GeoJSON inválido');
        }
        console.log('Características GeoJSON cargadas:', json.features.length);
        return loadPopData(json);
      })
      .catch(function(error) {
        console.error('Error loading GeoJSON:', error);
        showError('Error cargando el mapa: ' + error.message);
      });
  }

  function loadPopData(geoJSON) {
    return fetch('data/population.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load population data');
        return response.text();
      })
      .then(function(text) {
        const popData = JSON.parse(stripBom(text));
        if (!popData || typeof popData !== 'object') {
          throw new Error('Datos de población inválidos');
        }
        const countries = Object.keys(popData);
        console.log('Países con datos de población:', countries.length);
        state.popData = popData;
        processGeoJSON(geoJSON);
      })
      .catch(function(error) {
        console.error('Error loading population data:', error);
        showError('Error cargando los datos de población: ' + error.message);
      });
  }

  function processGeoJSON(geoJSON) {
    try {
      const features = geoJSON.features.filter(function(f) {
        return f.geometry && f.geometry.coordinates && f.properties && f.properties.name;
      }).map(function(f) {
        const name = f.properties.name;
        if (!name || !state.popData[name]) {
          console.warn('País sin datos:', name);
          return null;
        }
        const geometry = f.geometry;
        if (geometry.type === 'MultiPolygon') {
          const europeanPolygons = geometry.coordinates.filter(function(polygon) {
            return polygon.some(function(ring) {
              return ring.some(function(coord) {
                return coord[0] >= -15 && coord[0] <= 45 && coord[1] >= 30 && coord[1] <= 75;
              });
            });
          });
          if (europeanPolygons.length === 0) {
            console.warn('País sin coordenadas válidas:', name);
            return null;
          }
          geometry.coordinates = europeanPolygons;
        }
        return {
          type: 'Feature',
          properties: f.properties,
          geometry: geometry
        };
      }).filter(function(f) { return f !== null; });
      const validCountries = features.filter(function(f) { return f.geometry; }).length;
      console.log('Países válidos cargados:', validCountries);
      const geo = { type: 'FeatureCollection', features: features };
      state.geoLayer = L.geoJSON(geo, { onEachFeature: onEachFeature }).addTo(state.map);
      state.initialBounds = state.geoLayer.getBounds();
      state.map.fitBounds(state.initialBounds, { paddingBottomRight: [0, 160], paddingTopLeft: [0, 40] });
      document.getElementById('loading').style.display = 'none';
      updateUI();
    } catch (e) {
      console.error('GeoJSON processing error:', e);
      showError('Error procesando el mapa: ' + e.message);
    }
  }

  function showError(message) {
    document.getElementById('loading').innerHTML = '<div class="error-message"><p>' + message + '</p></div>';
  }

  function initControls() {
    document.getElementById('year-slider').addEventListener('input', function() {
      state.currentYearIdx = parseInt(this.value);
      updateUI();
    });
    document.getElementById('play-btn').addEventListener('click', function() {
      if (state.playing) {
        state.playing = false;
        clearInterval(state.playInterval);
        this.innerHTML = '&#9654;';
        this.classList.remove('playing');
        this.setAttribute('aria-label', 'Reproducir animación');
        this.setAttribute('aria-pressed', 'false');
      } else {
        state.playing = true;
        this.innerHTML = '&#9646;&#9646;';
        this.classList.add('playing');
        this.setAttribute('aria-label', 'Pausar animación');
        this.setAttribute('aria-pressed', 'true');
        state.playInterval = setInterval(function() {
          state.currentYearIdx = (state.currentYearIdx + 1) % YEARS.length;
          updateUI();
          if (state.currentYearIdx === YEARS.length - 1) {
            state.playing = false;
            clearInterval(state.playInterval);
            document.getElementById('play-btn').innerHTML = '&#9654;';
            document.getElementById('play-btn').classList.remove('playing');
            document.getElementById('play-btn').setAttribute('aria-label', 'Reproducir animación');
            document.getElementById('play-btn').setAttribute('aria-pressed', 'false');
          }
        }, PLAY_INTERVAL);
      }
    });
    document.getElementById('panel-close').addEventListener('click', function() {
      document.getElementById('panel').classList.remove('visible');
      document.getElementById('panel').setAttribute('aria-hidden', 'true');
      if (state.selectedCountry) {
        const prev = state.geoLayer.getLayers().find(function(l) {
          return l.feature._popName === state.selectedCountry;
        });
        if (prev) prev.setStyle({ weight: 1, color: 'rgba(255,255,255,0.2)', fillOpacity: 0.7 });
        state.selectedCountry = null;
      }
      state.map.closePopup();
      state.map.closeTooltip();
      state.geoLayer.eachLayer(function(layer) {
        layer.closeTooltip();
      });
      if (state.initialBounds) {
        state.map.fitBounds(state.initialBounds, { paddingBottomRight: [0, 160], paddingTopLeft: [0, 40] });
      }
    });
    document.addEventListener('keydown', function(e) {
      if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' && state.currentYearIdx < YEARS.length - 1) {
        e.preventDefault();
        state.currentYearIdx++;
        updateUI();
      } else if (e.key === 'ArrowLeft' && state.currentYearIdx > 0) {
        e.preventDefault();
        state.currentYearIdx--;
        updateUI();
      } else if (e.key === ' ') {
        e.preventDefault();
        document.getElementById('play-btn').click();
      }
    });
  }

  function init() {
    try {
      initMap();
      initControls();
      loadGeoData();
    } catch (e) {
      console.error('[INIT] Error fatal:', e);
      showError('Error de inicialización: ' + e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
