"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "de" | "en";
type Theme = "light" | "dark";
type FeedState = "loading" | "ready" | "error";

type Parameter = {
  data: Array<number | null>;
  name: string;
  unit: string;
};

type GeoSphereFeature = {
  properties: {
    station: string | number;
    parameters: Record<string, Parameter>;
  };
};

type GeoSphereResponse = {
  timestamps: string[];
  features: GeoSphereFeature[];
};

type RainDatum = Station & {
  total: number;
  coverage: number;
};

type SnowDatum = Station & {
  depth: number;
  temperature: number | null;
};

type WaterYearDatum = Station & {
  current: number;
  median: number;
  ratio: number;
};

type RiverDatum = {
  hzbnr: number;
  river: string;
  station: string;
  flow: number;
  unit: string;
  at: Date;
};

type Station = {
  id: string;
  climateId?: string;
  de: string;
  en: string;
  state: string;
  altitude: number;
};

const API = "https://dataset.api.hub.geosphere.at/v1/station/historical/tawes-v1-10min";
const CLIMATE_API = "https://dataset.api.hub.geosphere.at/v1/station/historical/klima-v2-1d";
// Downloaddienst Hydrographie Österreich — the ministry's OGC API Features
// service, registered in the INSPIRE catalogue. This is the documented route
// to the same gauges eHYD's own map draws, and unlike eHYD's internal
// interface it publishes ISO timestamps and permits cross-origin reads.
const HYDRO_API = "https://gis.lfrz.gv.at/api/geodata/i000501/ogc/features/v1/collections/i000501:pegel_aktuell/items";

// One gauge per major river, each the furthest downstream inside Austria, so
// the reading is what the river carries as it leaves the country.
const RIVER_GAUGES = [200014, 201889, 203539, 205922, 207373, 211490, 213595] as const;

const RAIN_STATIONS: Station[] = [
  { id: "11101", climateId: "15", de: "Bregenz", en: "Bregenz", state: "Vorarlberg", altitude: 424 },
  { id: "11320", climateId: "39", de: "Innsbruck", en: "Innsbruck", state: "Tirol", altitude: 578 },
  { id: "11350", climateId: "145", de: "Salzburg", en: "Salzburg", state: "Salzburg", altitude: 419 },
  { id: "11060", climateId: "56", de: "Linz", en: "Linz", state: "Oberösterreich", altitude: 262 },
  { id: "11389", climateId: "93", de: "St. Pölten", en: "St. Pölten", state: "Niederösterreich", altitude: 274 },
  { id: "11035", climateId: "105", de: "Wien", en: "Vienna", state: "Wien", altitude: 198 },
  { id: "11190", climateId: "22", de: "Eisenstadt", en: "Eisenstadt", state: "Burgenland", altitude: 184 },
  { id: "11240", climateId: "16400", de: "Graz", en: "Graz", state: "Steiermark", altitude: 340 },
  { id: "11331", climateId: "48", de: "Klagenfurt", en: "Klagenfurt", state: "Kärnten", altitude: 450 },
];

const SNOW_STATIONS: Station[] = [
  { id: "11268", de: "Dachstein-Gletscher", en: "Dachstein Glacier", state: "Oberösterreich", altitude: 2520 },
  { id: "11316", de: "Pitztaler Gletscher", en: "Pitztal Glacier", state: "Tirol", altitude: 2864 },
  { id: "11216", de: "Kanzelhöhe", en: "Kanzelhöhe", state: "Kärnten", altitude: 1520 },
];

const COPY = {
  de: {
    title: "Wie viel Wasser hat Österreich?",
    sub: "Was offizielle Messstellen gerade über Regen und Schnee zeigen — aus offenen Daten.",
    loading: "Messwerte werden geladen …",
    updated: "Stand",
    sourceAge: "direkt von GeoSphere Austria",
    tiles: {
      wettest: "Meiste Niederschlag · 24 h",
      rainStations: "Stationen mit Regen",
      snow: "Schnee an Hochlagen",
      among: "unter {n} Messstellen",
      of: "von {n} Stationen",
      at: "an {n} Messstellen",
    },
    rainTitle: "Niederschlag · letzte 24 Stunden",
    rainNote:
      "Je eine TAWES-Messstelle pro Bundesland. Die Auswahl ist ein Lagebild, kein flächengewichteter Österreich-Mittelwert. Summiert werden die veröffentlichten 10-Minuten-Werte; Lücken bleiben fehlend.",
    yearTitle: "Niederschlag · Wasserjahr",
    yearPeriod: "Seit 1. November bis {date}",
    yearReference: "Median 1991–2020",
    yearCurrent: "Dieses Wasserjahr",
    yearCompared: "vom Median",
    yearBands: {
      below: "unter Vergleich",
      near: "nahe Vergleich",
      above: "über Vergleich",
    },
    yearNote:
      "Qualitätsgeprüfte Tagessummen an denselben Standorten. Die Markierung zeigt 100 % des Medians aus 30 vergleichbaren Wasserjahren 1990/91 bis 2019/20. 90–110 % bedeutet hier nur „nahe am Vergleichswert“ und ist keine amtliche Dürreklassifikation.",
    yearLoading: "Wasserjahr-Vergleich wird berechnet …",
    yearError: "Der historische Vergleich ist gerade nicht verfügbar; die aktuellen Messungen bleiben davon unberührt.",
    riverTitle: "Abfluss · Flüsse",
    riverNote:
      "Je ein Pegel pro Fluss, jeweils der unterste in Österreich, also das, was der Fluss beim Verlassen des Landes führt. Momentanwerte des Downloaddienstes Hydrographie Österreich, nicht Tagesmittel. Ein Vergleich mit dem langjährigen Mittel steht über diese Schnittstelle nicht zur Verfügung und wird deshalb hier nicht behauptet.",
    riverLoading: "Abflusswerte werden geladen …",
    riverError: "Der Abfluss ist gerade nicht verfügbar; die Niederschlagsmessungen bleiben davon unberührt.",
    river: "Abfluss",
    gauge: "Pegel",
    snowTitle: "Schnee · aktuell",
    snowNote:
      "Gemessene Schneehöhe an den drei hoch gelegenen TAWES-Stationen, die derzeit einen Wert veröffentlichen. Schneehöhe ist nicht Schnee-Wasser-Äquivalent und wird hier nicht in Wasservolumen umgerechnet.",
    altitude: "Seehöhe",
    air: "Luft",
    noTemp: "Temperatur fehlt",
    limitsTitle: "Was noch fehlt",
    limitsBody:
      "Eine einzige belastbare Zahl für Österreichs verfügbares Wasser gibt es nicht. Grundwasser fehlt hier weiterhin: Der Downloaddienst liefert zwar 229 Messstellen, aber als Pegelstand in Metern über Adria, und die sind zwischen Standorten nicht vergleichbar. Die einzige vergleichende Angabe ist ein Farbcode, dessen Klassengrenzen der Dienst nicht dokumentiert. Eine geratene Legende wäre hier schlechter als eine Lücke.",
    rivers: "Grundwasser bei eHYD ansehen",
    tableToggle: "Werte als Tabelle",
    place: "Messstelle",
    rain: "Niederschlag",
    state: "Bundesland",
    errorTitle: "Die Messwerte konnten gerade nicht geladen werden.",
    errorBody: "Die Seite zeigt keine gespeicherten Werte als aktuell an. Bitte später noch einmal versuchen.",
    source: "Daten: GeoSphere Austria Dataset API (TAWES und klima-v2-1d), CC BY 4.0. Abfluss: Downloaddienst Hydrographie Österreich, CC BY 4.0 — Datenquelle: ehyd.gv.at.",
    sister: "Schwesterprojekt",
    sisterLink: "Woher kommt der Strom?",
    privacy: "Keine Cookies, kein Tracking, kein Datenverkauf.",
    theme: "Hell / dunkel",
  },
  en: {
    title: "How much water does Austria have?",
    sub: "What official stations currently show about rain and snow — from open data.",
    loading: "Loading measurements …",
    updated: "As of",
    sourceAge: "directly from GeoSphere Austria",
    tiles: {
      wettest: "Most precipitation · 24 h",
      rainStations: "Stations with rain",
      snow: "Snow at high sites",
      among: "among {n} stations",
      of: "of {n} stations",
      at: "at {n} stations",
    },
    rainTitle: "Precipitation · last 24 hours",
    rainNote:
      "One TAWES station per federal state. This is a snapshot, not an area-weighted Austrian average. Published 10-minute values are summed; gaps remain missing.",
    yearTitle: "Precipitation · water year",
    yearPeriod: "From 1 November to {date}",
    yearReference: "1991–2020 median",
    yearCurrent: "Current water year",
    yearCompared: "of median",
    yearBands: {
      below: "below reference",
      near: "near reference",
      above: "above reference",
    },
    yearNote:
      "Quality-controlled daily totals at the same locations. The marker is 100% of the median across 30 comparable water years from 1990/91 to 2019/20. Here, 90–110% only means “near the reference”; it is not an official drought classification.",
    yearLoading: "Calculating the water-year comparison …",
    yearError: "The historical comparison is currently unavailable; the live measurements are unaffected.",
    riverTitle: "Discharge · rivers",
    riverNote:
      "One gauge per river, each the furthest downstream inside Austria — what the river carries as it leaves the country. These are instantaneous readings from the Downloaddienst Hydrographie Österreich, not daily means. A comparison against the long-term average is not available through this interface, so none is claimed here.",
    riverLoading: "Loading discharge …",
    riverError: "Discharge is currently unavailable; the precipitation measurements are unaffected.",
    river: "Discharge",
    gauge: "Gauge",
    snowTitle: "Snow · current",
    snowNote:
      "Measured snow depth at the three high-elevation TAWES stations currently publishing a value. Snow depth is not snow-water equivalent and is not converted into water volume here.",
    altitude: "Elevation",
    air: "Air",
    noTemp: "Temperature missing",
    limitsTitle: "What is still missing",
    limitsBody:
      "There is no single defensible number for Austria's available water. Groundwater is still absent here: the download service does publish 229 stations, but as a level in metres above sea level, which is not comparable between sites. The only comparative signal is a colour code whose class boundaries the service does not document. A guessed legend would be worse than a gap.",
    rivers: "View groundwater at eHYD",
    tableToggle: "View values as a table",
    place: "Station",
    rain: "Precipitation",
    state: "State",
    errorTitle: "The measurements could not be loaded.",
    errorBody: "The page will not present stored values as current. Please try again later.",
    source: "Data: GeoSphere Austria Dataset API (TAWES and klima-v2-1d), CC BY 4.0. Discharge: Downloaddienst Hydrographie Österreich, CC BY 4.0 — Datenquelle: ehyd.gv.at.",
    sister: "Sister project",
    sisterLink: "Where does the electricity come from?",
    privacy: "No cookies, no tracking, no sale of data.",
    theme: "Light / dark",
  },
} as const;

function roundToTenMinutes(date: Date) {
  const next = new Date(date);
  next.setUTCSeconds(0, 0);
  next.setUTCMinutes(Math.floor(next.getUTCMinutes() / 10) * 10);
  return next;
}

function apiTime(date: Date) {
  return date.toISOString().slice(0, 16);
}

function apiDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function precipitationTotal(values: Array<number | null>) {
  return values.reduce((sum: number, value) => (
    Number.isFinite(value) ? sum + Math.max(0, value as number) : sum
  ), 0);
}

function utcDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

function lastFinite(values: Array<number | null> | undefined) {
  if (!values) return null;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) return values[index] as number;
  }
  return null;
}

function stationName(station: Station, lang: Lang) {
  return lang === "de" ? station.de : station.en;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("de");
  const [theme, setTheme] = useState<Theme>("light");
  const [state, setState] = useState<FeedState>("loading");
  const [rain, setRain] = useState<RainDatum[]>([]);
  const [snow, setSnow] = useState<SnowDatum[]>([]);
  const [dataAt, setDataAt] = useState<Date | null>(null);
  const [yearState, setYearState] = useState<FeedState>("loading");
  const [waterYear, setWaterYear] = useState<WaterYearDatum[]>([]);
  const [waterYearAt, setWaterYearAt] = useState<Date | null>(null);
  const [riverState, setRiverState] = useState<FeedState>("loading");
  const [rivers, setRivers] = useState<RiverDatum[]>([]);
  const copy = COPY[lang];

  useEffect(() => {
    const savedLang = window.localStorage.getItem("water-lang");
    // These preferences exist only in the browser, so they are restored after SSR hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedLang === "de" || savedLang === "en") setLang(savedLang);
    else if (navigator.language.toLowerCase().startsWith("en")) setLang("en");

    const savedTheme = window.localStorage.getItem("water-theme");
    const preferred = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("water-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const end = roundToTenMinutes(new Date());
      const rainStart = new Date(end.getTime() - (23 * 60 + 50) * 60_000);
      const snowStart = new Date(end.getTime() - 2 * 60 * 60_000);

      const rainQuery = new URLSearchParams({
        parameters: "RR",
        station_ids: RAIN_STATIONS.map((station) => station.id).join(","),
        start: apiTime(rainStart),
        end: apiTime(end),
        output_format: "geojson",
      });
      const snowQuery = new URLSearchParams({
        parameters: "SCHNEE,TL",
        station_ids: SNOW_STATIONS.map((station) => station.id).join(","),
        start: apiTime(snowStart),
        end: apiTime(end),
        output_format: "geojson",
      });

      const [rainResponse, snowResponse] = await Promise.all([
        fetch(`${API}?${rainQuery}`, { cache: "no-store" }),
        fetch(`${API}?${snowQuery}`, { cache: "no-store" }),
      ]);
      if (!rainResponse.ok || !snowResponse.ok) throw new Error("GeoSphere request failed");

      const [rainJson, snowJson] = await Promise.all([
        rainResponse.json() as Promise<GeoSphereResponse>,
        snowResponse.json() as Promise<GeoSphereResponse>,
      ]);

      const rainById = new Map(rainJson.features.map((feature) => [feature.properties.station, feature]));
      const snowById = new Map(snowJson.features.map((feature) => [feature.properties.station, feature]));

      const nextRain = RAIN_STATIONS.flatMap((station) => {
        const values = rainById.get(station.id)?.properties.parameters.RR?.data ?? [];
        const published = values.filter((value): value is number => Number.isFinite(value));
        if (published.length < 120) return [];
        return [{
          ...station,
          total: published.reduce((sum, value) => sum + value, 0),
          coverage: published.length,
        }];
      });

      const nextSnow = SNOW_STATIONS.flatMap((station) => {
        const parameters = snowById.get(station.id)?.properties.parameters;
        const depth = lastFinite(parameters?.SCHNEE?.data);
        if (depth == null) return [];
        return [{
          ...station,
          depth,
          temperature: lastFinite(parameters?.TL?.data),
        }];
      });

      if (nextRain.length < 7 || !nextSnow.length) throw new Error("No complete station data");
      if (cancelled) return;
      setRain(nextRain);
      setSnow(nextSnow);
      const publishedAt = rainJson.timestamps.at(-1);
      setDataAt(publishedAt ? new Date(publishedAt) : end);
      setState("ready");
    }

    load().catch(() => {
      if (!cancelled) setState("error");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRivers() {
      // CQL2 keeps this to the seven gauges rather than pulling all 300.
      const query = new URLSearchParams({
        f: "json",
        limit: "50",
        "filter-lang": "cql2-text",
        filter: `hzbnr IN (${RIVER_GAUGES.join(",")})`,
      });
      const response = await fetch(`${HYDRO_API}?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Hydrographie request failed");
      const json = (await response.json()) as {
        features: Array<{ properties: Record<string, string | number | null> }>;
      };

      const next = json.features.flatMap((feature) => {
        const attrs = feature.properties;
        const flow = Number(attrs.wert);
        const at = attrs.zeitpunkt ? new Date(String(attrs.zeitpunkt)) : null;
        // A gauge without a published reading is dropped, never shown as zero.
        if (!Number.isFinite(flow) || !at || Number.isNaN(at.getTime())) return [];
        return [{
          hzbnr: Number(attrs.hzbnr),
          river: String(attrs.gewaesser ?? ""),
          station: String(attrs.messstelle ?? ""),
          flow,
          unit: String(attrs.einheit ?? "m³/s"),
          at,
        }];
      });

      if (!next.length) throw new Error("No published gauges");
      if (cancelled) return;
      next.sort((a, b) => b.flow - a.flow);
      setRivers(next);
      setRiverState("ready");
    }

    loadRivers().catch(() => {
      if (!cancelled) setRiverState("error");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWaterYear() {
      const now = new Date();
      const targetEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
      const currentStartYear = targetEnd.getUTCMonth() >= 10
        ? targetEnd.getUTCFullYear()
        : targetEnd.getUTCFullYear() - 1;
      const currentStart = new Date(Date.UTC(currentStartYear, 10, 1));
      const climateIds = RAIN_STATIONS.map((station) => station.climateId).filter(Boolean).join(",");
      const referenceEndYear = targetEnd.getUTCMonth() >= 10 ? 2019 : 2020;
      const referenceEnd = new Date(Date.UTC(referenceEndYear, targetEnd.getUTCMonth(), targetEnd.getUTCDate()));

      const currentQuery = new URLSearchParams({
        parameters: "rr",
        station_ids: climateIds,
        start: apiDate(currentStart),
        end: apiDate(targetEnd),
        output_format: "geojson",
      });
      const referenceQuery = new URLSearchParams({
        parameters: "rr",
        station_ids: climateIds,
        start: "1990-11-01",
        end: apiDate(referenceEnd),
        output_format: "geojson",
      });

      const [currentResponse, referenceResponse] = await Promise.all([
        fetch(`${CLIMATE_API}?${currentQuery}`, { cache: "no-store" }),
        fetch(`${CLIMATE_API}?${referenceQuery}`, { cache: "force-cache" }),
      ]);
      if (!currentResponse.ok || !referenceResponse.ok) throw new Error("Climate request failed");

      const [currentJson, referenceJson] = await Promise.all([
        currentResponse.json() as Promise<GeoSphereResponse>,
        referenceResponse.json() as Promise<GeoSphereResponse>,
      ]);
      const currentById = new Map(currentJson.features.map((feature) => [String(feature.properties.station), feature]));
      const referenceById = new Map(referenceJson.features.map((feature) => [String(feature.properties.station), feature]));

      let latestIndex = -1;
      for (let index = currentJson.timestamps.length - 1; index >= 0; index -= 1) {
        const reporting = RAIN_STATIONS.filter((station) => {
          const values = currentById.get(station.climateId ?? "")?.properties.parameters.rr?.data;
          return Number.isFinite(values?.[index]);
        }).length;
        if (reporting >= 7) {
          latestIndex = index;
          break;
        }
      }
      if (latestIndex < 0) throw new Error("No common daily data");

      const latestDate = utcDate(currentJson.timestamps[latestIndex]);
      const currentExpected = daysBetween(currentStart, latestDate);
      const referenceTimestampIndex = new Map(
        referenceJson.timestamps.map((timestamp, index) => [timestamp.slice(0, 10), index]),
      );
      const nextWaterYear = RAIN_STATIONS.flatMap((station) => {
        const currentValues = currentById.get(station.climateId ?? "")?.properties.parameters.rr?.data.slice(0, latestIndex + 1) ?? [];
        const currentPublished = currentValues.filter((value) => Number.isFinite(value)).length;
        if (currentPublished / currentExpected < 0.95) return [];

        const referenceValues = referenceById.get(station.climateId ?? "")?.properties.parameters.rr?.data ?? [];
        const seasonTotals: number[] = [];

        for (let startYear = 1990; startYear <= 2019; startYear += 1) {
          const seasonStart = new Date(Date.UTC(startYear, 10, 1));
          const endYear = latestDate.getUTCMonth() >= 10 ? startYear : startYear + 1;
          const seasonEnd = new Date(Date.UTC(endYear, latestDate.getUTCMonth(), latestDate.getUTCDate()));
          const startIndex = referenceTimestampIndex.get(apiDate(seasonStart));
          const endIndex = referenceTimestampIndex.get(apiDate(seasonEnd));
          if (startIndex == null || endIndex == null) continue;
          const values = referenceValues.slice(startIndex, endIndex + 1);
          const published = values.filter((value) => Number.isFinite(value)).length;
          if (published / daysBetween(seasonStart, seasonEnd) < 0.98) continue;
          seasonTotals.push(precipitationTotal(values));
        }

        if (seasonTotals.length !== 30) return [];
        const current = precipitationTotal(currentValues);
        const referenceMedian = median(seasonTotals);
        return [{
          ...station,
          current,
          median: referenceMedian,
          ratio: referenceMedian > 0 ? (current / referenceMedian) * 100 : 0,
        }];
      });

      if (nextWaterYear.length < 7) throw new Error("No complete water-year comparison");
      if (cancelled) return;
      setWaterYear(nextWaterYear);
      setWaterYearAt(latestDate);
      setYearState("ready");
    }

    loadWaterYear().catch(() => {
      if (!cancelled) setYearState("error");
    });
    return () => { cancelled = true; };
  }, []);

  const number = useMemo(
    () => new Intl.NumberFormat(lang === "de" ? "de-AT" : "en-GB", { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
    [lang],
  );
  const integer = useMemo(
    () => new Intl.NumberFormat(lang === "de" ? "de-AT" : "en-GB", { maximumFractionDigits: 0 }),
    [lang],
  );
  const dateTime = useMemo(
    () => new Intl.DateTimeFormat(lang === "de" ? "de-AT" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Vienna" }),
    [lang],
  );
  const dateOnly = useMemo(
    () => new Intl.DateTimeFormat(lang === "de" ? "de-AT" : "en-GB", { dateStyle: "medium", timeZone: "UTC" }),
    [lang],
  );

  const sortedRain = useMemo(() => [...rain].sort((a, b) => b.total - a.total), [rain]);
  const sortedWaterYear = useMemo(() => [...waterYear].sort((a, b) => b.ratio - a.ratio), [waterYear]);
  const wettest = sortedRain[0];
  const rainyStations = rain.filter((station) => station.total >= 0.1).length;
  const snowWithDepth = snow.filter((station) => station.depth > 0).length;
  const maxRain = Math.max(...rain.map((station) => station.total), 1);
  const maxFlow = Math.max(...rivers.map((river) => river.flow), 1);
  const riverAt = rivers.reduce<Date | null>(
    (newest, river) => (newest && newest >= river.at ? newest : river.at), null);

  function toggleLang() {
    const next = lang === "de" ? "en" : "de";
    setLang(next);
    window.localStorage.setItem("water-lang", next);
  }

  function yearBand(ratio: number) {
    if (ratio < 90) return { key: "below" as const, className: "below" };
    if (ratio > 110) return { key: "above" as const, className: "above" };
    return { key: "near" as const, className: "near" };
  }

  return (
    <main className="wrap">
      <header>
        <div className="topline">
          <div>
            <h1>{copy.title}</h1>
            <p className="sub">{copy.sub}</p>
          </div>
          <div className="controls">
            <button type="button" onClick={toggleLang} aria-label={lang === "de" ? "Switch to English" : "Auf Deutsch wechseln"}>
              {lang === "de" ? "EN" : "DE"}
            </button>
            <button type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={copy.theme} title={copy.theme}>◐</button>
          </div>
        </div>
        <p className="stamp">
          <span className={`dot ${state}`} aria-hidden="true" />
          {state === "loading" ? copy.loading : state === "ready" && dataAt ? `${copy.updated} ${dateTime.format(dataAt)} · ${copy.sourceAge}` : copy.errorTitle}
        </p>
      </header>

      {state === "loading" ? (
        <div className="tiles loading-tiles" aria-label={copy.loading}>
          {[0, 1, 2].map((value) => <div className="tile" key={value}><span /><b /><i /></div>)}
        </div>
      ) : null}

      {state === "error" ? (
        <section className="error-card">
          <h2>{copy.errorTitle}</h2>
          <p>{copy.errorBody}</p>
        </section>
      ) : null}

      {state === "ready" ? (
        <>
          <div className="tiles">
            <div className="tile">
              <div className="k">{copy.tiles.wettest}</div>
              <div className="v">{number.format(wettest.total)} <small>mm</small></div>
              <div className="d">{stationName(wettest, lang)} · {copy.tiles.among.replace("{n}", String(rain.length))}</div>
            </div>
            <div className="tile">
              <div className="k">{copy.tiles.rainStations}</div>
              <div className="v">{rainyStations} <small>/ {rain.length}</small></div>
              <div className="d">{copy.tiles.of.replace("{n}", String(rain.length))}</div>
            </div>
            <div className="tile">
              <div className="k">{copy.tiles.snow}</div>
              <div className="v">{snowWithDepth} <small>/ {snow.length}</small></div>
              <div className="d">{copy.tiles.at.replace("{n}", String(snow.length))}</div>
            </div>
          </div>

          <section>
            <h2>{copy.rainTitle}</h2>
            <div className="rain-list">
              {sortedRain.map((station) => (
                <div className="rain-row" key={station.id}>
                  <div className="rain-name">
                    <strong>{stationName(station, lang)}</strong>
                    <span>{station.state}</span>
                  </div>
                  <div className="rain-track" aria-hidden="true">
                    <i style={{ width: `${(station.total / maxRain) * 100}%` }} />
                  </div>
                  <div className="rain-value">{number.format(station.total)} <small>mm</small></div>
                </div>
              ))}
            </div>
            <p className="note">{copy.rainNote}</p>
            <details>
              <summary>{copy.tableToggle}</summary>
              <table>
                <thead><tr><th>{copy.place}</th><th>{copy.state}</th><th className="numeric">{copy.rain}</th></tr></thead>
                <tbody>
                  {sortedRain.map((station) => (
                    <tr key={station.id}><td>{stationName(station, lang)}</td><td>{station.state}</td><td className="numeric">{number.format(station.total)} mm</td></tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>

          {yearState === "loading" ? (
            <section aria-live="polite">
              <h2>{copy.yearTitle}</h2>
              <div className="year-loading"><span aria-hidden="true" />{copy.yearLoading}</div>
            </section>
          ) : null}

          {yearState === "error" ? (
            <section>
              <h2>{copy.yearTitle}</h2>
              <p className="note year-error">{copy.yearError}</p>
            </section>
          ) : null}

          {yearState === "ready" && waterYearAt ? (
            <section>
              <div className="section-head">
                <h2>{copy.yearTitle}</h2>
                <span>{copy.yearPeriod.replace("{date}", dateOnly.format(waterYearAt))}</span>
              </div>
              <div className="year-legend" aria-hidden="true">
                <span>{copy.yearCurrent}</span>
                <span>{copy.yearReference}</span>
              </div>
              <div className="year-list">
                {sortedWaterYear.map((station) => {
                  const band = yearBand(station.ratio);
                  return (
                    <div className="year-row" key={station.id}>
                      <div className="rain-name">
                        <strong>{stationName(station, lang)}</strong>
                        <span>{station.state}</span>
                      </div>
                      <div className={`year-track ${band.className}`} aria-hidden="true">
                        <i style={{ width: `${Math.min(station.ratio, 150) / 1.5}%` }} />
                        <b />
                      </div>
                      <div className="year-value">
                        <strong>{integer.format(station.ratio)} <small>%</small><span className="visually-hidden"> {copy.yearCompared}</span></strong>
                        <span>{number.format(station.current)} / {number.format(station.median)} mm</span>
                      </div>
                      <div className={`year-band ${band.className}`}>{copy.yearBands[band.key]}</div>
                    </div>
                  );
                })}
              </div>
              <p className="note">{copy.yearNote}</p>
            </section>
          ) : null}

          <section>
            <div className="section-head">
              <h2>{copy.riverTitle}</h2>
              {riverState === "ready" && riverAt ? (
                <span className="panel-stamp">{copy.updated} {dateTime.format(riverAt)}</span>
              ) : null}
            </div>
            {riverState === "loading" ? <p className="year-loading">{copy.riverLoading}</p> : null}
            {riverState === "error" ? <p className="year-error">{copy.riverError}</p> : null}
            {riverState === "ready" ? (
              <>
                <div className="rain-list">
                  {rivers.map((river) => (
                    <div className="rain-row" key={river.hzbnr}>
                      <div className="rain-name">
                        <strong>{river.river}</strong>
                        <span>{river.station}</span>
                      </div>
                      <div className="rain-track" aria-hidden="true">
                        <i style={{ width: `${(river.flow / maxFlow) * 100}%` }} />
                      </div>
                      <div className="rain-value">{number.format(river.flow)} <small>{river.unit}</small></div>
                    </div>
                  ))}
                </div>
                <p className="note">{copy.riverNote}</p>
                <details>
                  <summary>{copy.tableToggle}</summary>
                  <table>
                    <thead><tr><th>{copy.place}</th><th>{copy.gauge}</th><th className="numeric">{copy.river}</th></tr></thead>
                    <tbody>
                      {rivers.map((river) => (
                        <tr key={river.hzbnr}>
                          <td>{river.river}</td><td>{river.station}</td>
                          <td className="numeric">{number.format(river.flow)} {river.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </>
            ) : null}
          </section>

          <section>
            <h2>{copy.snowTitle}</h2>
            <div className="snow-grid">
              {snow.map((station) => (
                <article className="snow-card" key={station.id}>
                  <div className="snow-head"><strong>{stationName(station, lang)}</strong><span>{station.state}</span></div>
                  <div className="snow-value">{number.format(station.depth)} <small>cm</small></div>
                  <div className="snow-meta">
                    <span>{copy.altitude} {integer.format(station.altitude)} m</span>
                    <span>{station.temperature == null ? copy.noTemp : `${copy.air} ${number.format(station.temperature)} °C`}</span>
                  </div>
                </article>
              ))}
            </div>
            <p className="note">{copy.snowNote}</p>
          </section>
        </>
      ) : null}

      <section className="limits">
        <h2>{copy.limitsTitle}</h2>
        <p>{copy.limitsBody}</p>
        <a href="https://ehyd.gv.at/?g_card=pegelaktuell%23" target="_blank" rel="noreferrer">{copy.rivers} ↗</a>
      </section>

      <footer>
        <p>{copy.source.split("ehyd.gv.at")[0]}<a href="https://ehyd.gv.at">ehyd.gv.at</a>{copy.source.split("ehyd.gv.at")[1] ?? ""}</p>
        <p>{copy.sister}: <a href="https://rfuzzo.github.io/woher-kommt-der-strom/">{copy.sisterLink}</a> · {copy.privacy}</p>
      </footer>
    </main>
  );
}
