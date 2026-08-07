# Wie viel Wasser hat Österreich?

Sister project to [Woher kommt der Strom?](https://rfuzzo.github.io/woher-kommt-der-strom/): one compact page showing what official stations currently say about Austria's water inputs.

German and English, light and dark, no cookies, no trackers.

Live site: [rfuzzo.github.io/woher-kommt-das-wasser](https://rfuzzo.github.io/woher-kommt-das-wasser/)

## What the page currently shows

- **Precipitation over the latest 24 hours** at one representative TAWES station per federal state. This is deliberately presented as nine stations, not as a national average.
- **Water-year precipitation since 1 November** at the same locations, compared with the median of 30 matching periods ending from 1991 through 2020.
- **Current snow depth** at the three high-elevation TAWES stations that currently publish the `SCHNEE` parameter, with station elevation and air temperature.
- A clear boundary around what is missing: groundwater is not displayed until its source is machine-readable and verified, and river discharge is left to the sister project — see the note below.

The browser fetches GeoSphere Austria's TAWES and quality-controlled `klima-v2-1d` endpoints directly. It sums published 10-minute precipitation readings and rejects a station when fewer than 120 values are present in the 24-hour window. Missing values are never converted to zero.

## Data verification

### 6 August 2026

- GeoSphere's TAWES metadata documents `RR` as precipitation during the latest 10 minutes, `SCHNEE` as measured total snow depth in centimetres, and `TL` as air temperature.
- The historical TAWES endpoint returns 10-minute station series as GeoJSON and permits direct browser access with CORS.
- Of the high-elevation stations checked, Dachstein-Schladminger Gletscher, Pitztaler Gletscher and Kanzelhöhe currently publish a snow-depth value. The displayed number is depth, never snow-water equivalent.
- eHYD's former `/services/Diagram/pegelBgis?hzbnr=<id>` JSON interface currently returns the application HTML instead of gauge JSON. River flow remains omitted rather than cached or scraped from an undocumented interface.

### 7 August 2026 — the eHYD observation above no longer holds

`/services/Diagram/pegelBgis?hzbnr=207373` returns `application/json` again (the
Danube at Wildungsmauer, 843 m³/s), and `/services/PegelAktuell/json` returns a
300-station GeoJSON snapshot. Both send `access-control-allow-origin: *`.

The 6 August reading was a real outage, not a permanent withdrawal. The sister
project saw the other half of the same incident on the same day: its river
panel fetched these endpoints from the browser and started failing CORS, and it
moved the requests server-side in response.

**River discharge stays omitted here, but for the original reason rather than
the availability one.** `pegelBgis` is an internal interface — it is what
eHYD's own map calls, not a published API — so it carries no compatibility
promise and has now demonstrated that by breaking. That is an acceptable risk
for a secondary panel that can hide itself, which is its role in the sister
project. It is not acceptable for a headline number here, which cannot quietly
vanish.

If river flow is wanted on this page, the route is a documented source —
[data.gv.at](https://www.data.gv.at/)'s hydrographic datasets, or the per-Land
services (Carinthia and Salzburg publish JSON/GeoJSON) — not this endpoint.

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
