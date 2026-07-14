# Mapa de Proyección Poblacional UE 2015-2080

Mapa interactivo que visualiza la evolución demográfica de los países de la Unión Europea entre 2015 y 2080, con datos de Eurostat.

## Características

- **Mapa coroplético** con escala de color continua (interpolación lineal entre 13 paradas)
- **Slider temporal** con animación automática (play/pause)
- **Panel de detalles** por país: población, densidad, cambio vs 2015, pico demográfico
- **Gráfico de tendencia** poblacional con Chart.js
- **Tooltips y popups** interactivos al hacer clic en cada país
- 26 países UE representados (Chipre excluida por resolución cartográfica 110m)

## Uso

La aplicación carga los datos con `fetch`, por lo que debe ejecutarse desde un servidor HTTP. Podés usar cualquier servidor estático o visitar la versión publicada:

**https://agusnieto77.github.io/mapa-ue-poblacion/**

Para desarrollo local, desde la raíz del proyecto:

```bash
python -m http.server 3000
```

Luego abrí `http://127.0.0.1:3000`.

- Mové el slider para cambiar de año.
- Hacé click en un país para ver el panel, el popup y el gráfico.
- Usá play/pausa para recorrer los años automáticamente.
- Con el mapa enfocado, usá las flechas izquierda/derecha para navegar los años.

## Tecnologías

- [Leaflet](https://leafletjs.com/) - mapas interactivos
- [Chart.js](https://chartjs.org/) - gráficos
- [CARTO](https://carto.com/) - tiles de mapa oscuro
- Archivos GeoJSON y JSON locales para los datos de países y población

## Fuente de datos

Eurostat - Population projections. Datos de población por país para los años 2015, 2020, 2030, 2040, 2050, 2060, 2070 y 2080.

## Estructura

```text
.
├── index.html                 # Estructura, estilos y dependencias CDN
├── app.js                     # Estado, interacciones y renderizado Leaflet
├── data/
│   ├── eu-countries.json      # Geometrías de países
│   └── population.json        # Población y superficie por país
├── README.md
└── AGENTS.md
```
