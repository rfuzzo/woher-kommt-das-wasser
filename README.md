# Wie viel Wasser hat Österreich?

Sister project to [Woher kommt der Strom?](https://rfuzzo.github.io/woher-kommt-der-strom/): one calm page about Austria's water year.

The first release explains the annual storage cycle and attempts to load current discharge from six representative eHYD gauges directly in the browser. It is deliberately not a flood-warning service and never substitutes cached readings when the official live interface is unavailable.

German and English, light and dark, no cookies, no trackers.

## Data verification — 6 August 2026

- eHYD's former JSON endpoint, `/services/Diagram/pegelBgis?hzbnr=<id>`, currently returns the eHYD application HTML rather than gauge JSON. The live panel retains the established response parser and fails visibly and safely until the official interface is restored or its replacement is documented.
- GeoSphere Austria's dataset catalogue is available without an API key. It lists `snowgrid_cl-v2-1d-1km` as historical grid and time-series data, TAWES current observations, and the `klima-v2-*` historical station series.
- The GeoSphere documentation confirms that public data is CC BY 4.0 and that dataset metadata is available by appending `/metadata` to an endpoint.

The next data pass must verify whether SNOWGRID-CL is suitable for a current seasonal snow-water-equivalent product rather than only climate context. Snow depth will not be converted into water content using an invented fixed density.

## Product rules

- River values are provisional, operated discharge — never described as natural flow.
- Raw m³/s values are not compared across rivers; each gauge is normalized only against its own NW/MW references.
- “Normal for this date” will name the 1991–2020 baseline.
- Missing hydrographic values stay missing. No gap is rendered as zero.
- Flood and hazard advice always links to official services.

## Local development

```bash
pnpm install
pnpm run dev
```

The site uses the Sites vinext starter and produces Cloudflare Worker-compatible output.
