# Wie viel Wasser hat Österreich?

Sister project to [Woher kommt der Strom?](https://rfuzzo.github.io/woher-kommt-der-strom/): one compact page showing what official stations currently say about Austria's water inputs.

German and English, light and dark, no cookies, no trackers.

Live site: [rfuzzo.github.io/woher-kommt-das-wasser](https://rfuzzo.github.io/woher-kommt-das-wasser/)

## What the page currently shows

- **Precipitation over the latest 24 hours** at one representative TAWES station per federal state. This is deliberately presented as nine stations, not as a national average.
- **Water-year precipitation since 1 November** at the same locations, compared with the median of 30 matching periods ending from 1991 through 2020.
- **Current snow depth** at the three high-elevation TAWES stations that currently publish the `SCHNEE` parameter, with station elevation and air temperature.
- A clear boundary around what is missing: river discharge and groundwater are not displayed until their source is machine-readable and verified again.

The browser fetches GeoSphere Austria's TAWES and quality-controlled `klima-v2-1d` endpoints directly. It sums published 10-minute precipitation readings and rejects a station when fewer than 120 values are present in the 24-hour window. Missing values are never converted to zero.

## Data verification — 6 August 2026

- GeoSphere's TAWES metadata documents `RR` as precipitation during the latest 10 minutes, `SCHNEE` as measured total snow depth in centimetres, and `TL` as air temperature.
- The historical TAWES endpoint returns 10-minute station series as GeoJSON and permits direct browser access with CORS.
- Of the high-elevation stations checked, Dachstein-Schladminger Gletscher, Pitztaler Gletscher and Kanzelhöhe currently publish a snow-depth value. The displayed number is depth, never snow-water equivalent.
- eHYD's former `/services/Diagram/pegelBgis?hzbnr=<id>` JSON interface currently returns the application HTML instead of gauge JSON. River flow remains omitted rather than cached or scraped from an undocumented interface.

Public GeoSphere data is CC BY 4.0.

## Local development

```bash
pnpm install
pnpm run dev
```

For the standalone static build used by GitHub Pages:

```bash
pnpm run dev:pages
pnpm run build:pages
```

Pushes to `main` publish `dist-pages` through the repository's GitHub Pages workflow.
