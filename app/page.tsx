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
    station: string;
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

type Station = {
  id: string;
  de: string;
  en: string;
  state: string;
  altitude: number;
};

const API = "https://dataset.api.hub.geosphere.at/v1/station/historical/tawes-v1-10min";

const RAIN_STATIONS: Station[] = [
  { id: "11101", de: "Bregenz", en: "Bregenz", state: "Vorarlberg", altitude: 424 },
  { id: "11320", de: "Innsbruck", en: "Innsbruck", state: "Tirol", altitude: 578 },
  { id: "11350", de: "Salzburg", en: "Salzburg", state: "Salzburg", altitude: 419 },
  { id: "11060", de: "Linz", en: "Linz", state: "Oberösterreich", altitude: 262 },
  { id: "11389", de: "St. Pölten", en: "St. Pölten", state: "Niederösterreich", altitude: 274 },
  { id: "11035", de: "Wien", en: "Vienna", state: "Wien", altitude: 198 },
  { id: "11190", de: "Eisenstadt", en: "Eisenstadt", state: "Burgenland", altitude: 184 },
  { id: "11240", de: "Graz", en: "Graz", state: "Steiermark", altitude: 340 },
  { id: "11331", de: "Klagenfurt", en: "Klagenfurt", state: "Kärnten", altitude: 450 },
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
    snowTitle: "Schnee · aktuell",
    snowNote:
      "Gemessene Schneehöhe an den drei hoch gelegenen TAWES-Stationen, die derzeit einen Wert veröffentlichen. Schneehöhe ist nicht Schnee-Wasser-Äquivalent und wird hier nicht in Wasservolumen umgerechnet.",
    altitude: "Seehöhe",
    air: "Luft",
    noTemp: "Temperatur fehlt",
    limitsTitle: "Was noch fehlt",
    limitsBody:
      "Eine einzige belastbare Zahl für Österreichs verfügbares Wasser gibt es nicht. Abfluss und Grundwasser gehören dazu, aber eHYD liefert über die bisherige Schnittstelle derzeit keine maschinenlesbaren Messwerte. Diese Seite zeigt sie erst wieder, wenn die Quelle verifiziert ist.",
    rivers: "Flüsse bei eHYD ansehen",
    tableToggle: "Werte als Tabelle",
    place: "Messstelle",
    rain: "Niederschlag",
    state: "Bundesland",
    errorTitle: "Die Messwerte konnten gerade nicht geladen werden.",
    errorBody: "Die Seite zeigt keine gespeicherten Werte als aktuell an. Bitte später noch einmal versuchen.",
    source: "Daten: GeoSphere Austria Dataset API (TAWES), CC BY 4.0.",
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
    snowTitle: "Snow · current",
    snowNote:
      "Measured snow depth at the three high-elevation TAWES stations currently publishing a value. Snow depth is not snow-water equivalent and is not converted into water volume here.",
    altitude: "Elevation",
    air: "Air",
    noTemp: "Temperature missing",
    limitsTitle: "What is still missing",
    limitsBody:
      "There is no single defensible number for Austria's available water. River flow and groundwater belong in the picture, but eHYD's former interface is not currently returning machine-readable measurements. This page will only show them again after the source is verified.",
    rivers: "View rivers at eHYD",
    tableToggle: "View values as a table",
    place: "Station",
    rain: "Precipitation",
    state: "State",
    errorTitle: "The measurements could not be loaded.",
    errorBody: "The page will not present stored values as current. Please try again later.",
    source: "Data: GeoSphere Austria Dataset API (TAWES), CC BY 4.0.",
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
  const copy = COPY[lang];

  useEffect(() => {
    const savedLang = window.localStorage.getItem("water-lang");
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

  const sortedRain = useMemo(() => [...rain].sort((a, b) => b.total - a.total), [rain]);
  const wettest = sortedRain[0];
  const rainyStations = rain.filter((station) => station.total >= 0.1).length;
  const snowWithDepth = snow.filter((station) => station.depth > 0).length;
  const maxRain = Math.max(...rain.map((station) => station.total), 1);

  function toggleLang() {
    const next = lang === "de" ? "en" : "de";
    setLang(next);
    window.localStorage.setItem("water-lang", next);
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
        <p>{copy.source}</p>
        <p>{copy.sister}: <a href="https://rfuzzo.github.io/woher-kommt-der-strom/">{copy.sisterLink}</a> · {copy.privacy}</p>
      </footer>
    </main>
  );
}
