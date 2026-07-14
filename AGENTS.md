# AGENTS.md

## Ejecución

- La aplicación usa `fetch` para cargar los datos locales; no abrir `index.html` mediante `file://`.
- Ejecutar desde un servidor HTTP estático, por ejemplo `python -m http.server 3000`, y abrir `http://127.0.0.1:3000`.
- También se puede desplegar en GitHub Pages, Netlify o Vercel.

## Tecnologías

- Leaflet 1.9.4 (mapas)
- Chart.js 4 (gráficos)
- Carto Dark Matter (tiles)

## Datos

- **geo**: `data/eu-countries.json` — GeoJSON con límites de países UE
- **población**: `data/population.json` — Proyecciones demográficas
- Fuente: Eurostat - Population projections
- Años: 2015, 2020, 2030, 2040, 2050, 2060, 2070, 2080
- 26 países UE (Chipre excluida por resolución cartográfica 110m)

## Estructura del proyecto

```
mapa2/
├── index.html       # Estructura, estilos y dependencias CDN
├── app.js           # Estado, Leaflet, controles y gráfico
├── data/
│   ├── eu-countries.json   # GeoJSON con límites geográficos
│   └── population.json     # Datos de población por país y año
└── README.md
```

## Notas técnicas

- `app.js` elimina un BOM UTF-8 si existe antes de parsear los JSON.
- Los `MultiPolygon` se filtran por grupos completos de polígonos con coordenadas europeas: longitud `-15..45`, latitud `30..75`. No aplanar sus anillos: deformaría geometrías y el encuadre de Leaflet.
- Los nombres de países se normalizan con aliases (por ejemplo, `Czech Republic` → `Czechia`).
- El slider tiene 8 posiciones (índices `0..7`) que mapean al array `YEARS`.
- Todo cambio de año debe actualizar mapa, panel, gráfico y popup del país seleccionado.
- Al cerrar el panel, restaurar `state.initialBounds`, no usar un centro o zoom fijo.
