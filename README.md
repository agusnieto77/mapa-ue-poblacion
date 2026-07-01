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

Abrí `index.html` en cualquier navegador, o visitá la versión publicada:

**https://agusnieto77.github.io/mapa-ue-poblacion/**

- Mové el slider para cambiar de año
- Click en un país para ver detalles
- Botón play para animar la evolución temporal
- Flechas izquierda/derecha o barra espaciadora como atajos

## Tecnologías

- [Leaflet](https://leafletjs.com/) - mapas interactivos
- [Chart.js](https://chartjs.org/) - gráficos
- [CARTO](https://carto.com/) - tiles de mapa oscuro
- GeoJSON embebido (sin dependencia de CDNs para los datos de países)

## Fuente de datos

Eurostat - Population projections. Datos de población por país para los años 2015, 2020, 2030, 2040, 2050, 2060, 2070 y 2080.
