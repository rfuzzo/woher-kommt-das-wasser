# Wie viel Wasser hat Österreich?

Sister project to [Woher kommt der Strom?](https://rfuzzo.github.io/woher-kommt-der-strom/): one compact page showing what official stations currently say about Austria's water inputs.

German and English, light and dark, no cookies, no trackers.

Live site: [rfuzzo.github.io/woher-kommt-das-wasser](https://rfuzzo.github.io/woher-kommt-das-wasser/)

## What the page currently shows

- **Precipitation over the latest 24 hours** at one representative TAWES station per federal state. This is deliberately presented as nine stations, not as a national average.
- **Water-year precipitation since 1 November** at the same locations, compared with the median of 30 matching periods ending from 1991 through 2020.
- **Current snow depth** at the three high-elevation TAWES stations that currently publish the `SCHNEE` parameter, with station elevation and air temperature.
- **River discharge** at one gauge per major river, each the furthest downstream inside Austria, from the ministry's Downloaddienst Hydrographie Österreich.
- A clear boundary around what is missing: groundwater is published but not yet interpretable — see the note below.

The browser fetches GeoSphere Austria's TAWES and quality-controlled `klima-v2-1d` endpoints, and the hydrographic download service, directly. It sums published 10-minute precipitation readings and rejects a station when fewer than 120 values are present in the 24-hour window. Missing values are never converted to zero.

## Data verification

### 6 August 2026

- GeoSphere's TAWES metadata documents `RR` as precipitation during the latest 10 minutes, `SCHNEE` as measured total snow depth in centimetres, and `TL` as air temperature.
- The historical TAWES endpoint returns 10-minute station series as GeoJSON and permits direct browser access with CORS.
- Of the high-elevation stations checked, Dachstein-Schladminger Gletscher, Pitztaler Gletscher and Kanzelhöhe currently publish a snow-depth value. The displayed number is depth, never snow-water equivalent.
- eHYD's former `/services/Diagram/pegelBgis?hzbnr=<id>` JSON interface currently returns the application HTML instead of gauge JSON. River flow remains omitted rather than cached or scraped from an undocumented interface.

### 7 August 2026 — the eHYD observation above no longer holds, and there is a documented route

`/services/Diagram/pegelBgis?hzbnr=<id>` returns `application/json` again, so
the 6 August reading was an outage rather than a withdrawal. The sister project
saw the other half of the same incident that day: its river panel fetched these
endpoints from the browser and started failing CORS.

More usefully, that endpoint is not the only way in. **Downloaddienst
Hydrographie Österreich** is an OGC API Features service published by the
BMLUK and registered in the INSPIRE catalogue:

```
https://gis.lfrz.gv.at/api/geodata/i000501/ogc/features/v1
```

| collection | contents |
|---|---|
| `i000501:pegel_aktuell` | 300 surface-water gauges (268 discharge, 32 level) |
| `i000501:grundwasser_aktuell` | 229 groundwater stations |
| `i000501:niederschlag_aktuell` | precipitation stations |
| `i000501:messstellen_*` | station metadata per network |

Verified 7 August 2026: `access-control-allow-origin: *`, ISO 8601 timestamps
with offset, and CQL2 filtering, so the seven gauges this page shows arrive in
one 3.8 kB request instead of the full 150 kB collection:

```
?f=json&filter-lang=cql2-text&filter=hzbnr IN (200014,201889,…)
```

This is what the discharge panel now uses. It is documented, it carries a
published contract, and it makes the internal `pegelBgis` interface
unnecessary here.

### Why groundwater is still not shown

The service publishes it, so machine-readability is no longer the obstacle.
The obstacle is interpretation. `wert` is a level in metres above sea level,
which is not comparable between stations — 171 m at one site and 262 m at
another says nothing about which is low. The only comparative signal is
`farbcode`, a colour per station (on 7 August: 115 red, 104 orange, 9 green).

Those class boundaries are not documented anywhere the service exposes. The
WMS `GetLegendGraphic` for the layer returns a single generic symbol, and the
colours are applied by eHYD's own client. Red plausibly means low, and Austria
is in drought, so the guess would probably even be right — which is exactly
what makes publishing it a bad idea. A guessed legend on 229 stations would
read as authoritative and could not be checked by a reader.

Groundwater goes in when the classification is documented, or when a source
publishes a comparable measure such as depth below a long-term reference.

Public GeoSphere data is CC BY 4.0. eHYD data, where used, is CC BY 4.0 with
attribution to `ehyd.gv.at`.

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
