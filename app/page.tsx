"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "de" | "en";
type Theme = "light" | "dark";
type LoadState = "loading" | "live" | "unavailable";

type EhydPayload = {
  data?: Array<string | number | null>;
  einheit?: string;
  internet?: string;
  messstelle?: string;
  mittelwasser?: string | number;
  niedrigwasser?: string | number;
  wert?: string | number;
  zp?: string;
};

type River = {
  river: string;
  en: string;
  hzbnr: number;
  gauge: string;
  unit: string;
  now: number;
  at: Date | null;
  nw: number | null;
  mw: number | null;
  series: number[];
};

const EHYD = "https://ehyd.gv.at/services/Diagram/pegelBgis?hzbnr=";
const RIVERS = [
  { river: "Donau", en: "Danube", hzbnr: 207373 },
  { river: "Inn", en: "Inn", hzbnr: 201889 },
  { river: "Salzach", en: "Salzach", hzbnr: 203539 },
  { river: "Enns", en: "Enns", hzbnr: 205922 },
  { river: "Drau", en: "Drava", hzbnr: 213595 },
  { river: "Mur", en: "Mur", hzbnr: 211490 },
] as const;

const MONTHS = {
  de: ["Nov", "Dez", "Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt"],
  en: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
};

// A deliberately schematic annual cycle: it explains the product's model,
// but is never presented as current or measured data.
const SNOW_CYCLE = [14, 28, 48, 68, 84, 76, 52, 27, 10, 3, 2, 5];
const FLOW_CYCLE = [28, 25, 22, 24, 34, 53, 78, 89, 71, 48, 36, 31];

const COPY = {
  de: {
    kicker: "Österreich · Wasserjahr",
    title: "Wie viel Wasser hat Österreich?",
    intro:
      "Österreichs Wasser ist kein einzelner Pegel. Es liegt als Schnee in den Bergen, bewegt sich in Flüssen und bleibt im Grundwasser gespeichert.",
    thesis: "Das Wasserjahr ist ein Speicherkreislauf.",
    thesisBody:
      "Im Winter wächst der Schneespeicher. Im Frühling und Sommer wird er zu Abfluss — und ein Teil davon später zu Strom. Diese Seite macht den Kreislauf sichtbar, ohne aus einzelnen Stationen eine falsche nationale Zahl zu bauen.",
    liveTitle: "Flüsse · live",
    liveLoading: "Aktuelle Messwerte werden direkt bei eHYD geladen …",
    liveReady: "Direkt von eHYD geladen",
    liveUnavailable: "Die Live-Schnittstelle von eHYD antwortet gerade nicht mit Messdaten.",
    liveUnavailableBody:
      "Die Seite zeigt deshalb keine alten Werte als aktuell an. Beim nächsten Besuch wird automatisch neu verbunden.",
    openEhyd: "Offizielle Pegel bei eHYD öffnen",
    liveNote:
      "Abfluss an je einer Messstelle pro Fluss. NW und MW sind die Referenzwerte für Nieder- und Mittelwasser dieser Station — Rohwerte verschiedener Flüsse sind nicht direkt vergleichbar. Echtzeitwerte sind vorläufig und können später korrigiert werden.",
    ofMean: "des Mittelwassers",
    belowLow: "unter Niederwasser",
    nearLow: "nahe Niederwasser",
    belowMean: "unter Mittelwasser",
    aboveMean: "über Mittelwasser",
    cycleTitle: "So liest sich ein Wasserjahr",
    cycleIntro:
      "Der entscheidende Zusammenhang liegt zwischen zwei Kurven: Schnee wird zuerst gespeichert und zeitversetzt als Abfluss freigegeben.",
    snow: "Schneespeicher",
    flow: "typischer Abfluss",
    schematic: "Schematischer Leseschlüssel — keine aktuellen Messwerte",
    storesTitle: "Drei Speicher, eine Geschichte",
    snowTitle: "Schnee",
    snowBody:
      "Schneehöhe ist nicht Wasserinhalt. Der Ausbau verwendet deshalb nur modelliertes Schnee-Wasser-Äquivalent oder klar benannte Stationswerte samt Höhenlage.",
    riversTitle: "Flüsse",
    riversBody:
      "Pegel zeigen den betriebenen Abfluss: Österreichs große Flüsse sind reguliert. Tagesmuster können Kraftwerksbetrieb sein und nicht Wetter.",
    groundTitle: "Grundwasser",
    groundBody:
      "Es reagiert langsam und erzählt mehr über anhaltende Trockenheit als ein einzelner Regentag. Als Nächstes kommt der Vergleich mit 1991–2020.",
    nextLabel: "Als Nächstes",
    nextTitle: "Normal für diesen Tag",
    nextBody:
      "Der nächste Datenbaustein ordnet Abfluss, Schnee und Grundwasser in die Klimanormalperiode 1991–2020 ein. Erst dann gibt es eine belastbare Antwort auf „viel oder wenig für heute?“",
    safetyTitle: "Keine Hochwasserwarnung",
    safetyBody:
      "Diese Seite erklärt Österreichs Wasserspeicher. Für Warnungen und lokale Gefahrenlagen gelten ausschließlich die offiziellen Dienste.",
    officialWarnings: "Zu den offiziellen Diensten",
    sister: "Schwesterprojekt",
    sisterLink: "Woher kommt der Strom?",
    source:
      "Daten: Hydrographie Österreich (eHYD) und GeoSphere Austria, jeweils CC BY 4.0. Keine Cookies, kein Tracking.",
    theme: "Hell / dunkel",
    unavailableShort: "Verbindung pausiert",
  },
  en: {
    kicker: "Austria · water year",
    title: "How much water does Austria have?",
    intro:
      "Austria's water is not one gauge. It is stored as snow in the mountains, moves through rivers and remains underground as groundwater.",
    thesis: "The water year is a storage cycle.",
    thesisBody:
      "The snow store grows in winter. In spring and summer it becomes river flow — and some of it later becomes electricity. This page makes that cycle visible without turning a handful of stations into a false national total.",
    liveTitle: "Rivers · live",
    liveLoading: "Loading current measurements directly from eHYD …",
    liveReady: "Loaded directly from eHYD",
    liveUnavailable: "The eHYD live interface is not returning measurements right now.",
    liveUnavailableBody:
      "The page will not label old values as current. It reconnects automatically on your next visit.",
    openEhyd: "Open official gauges at eHYD",
    liveNote:
      "Discharge at one gauge per river. NW and MW are that station's low- and mean-water references — raw values from different rivers are not directly comparable. Real-time readings are provisional and may be corrected later.",
    ofMean: "of mean water",
    belowLow: "below low water",
    nearLow: "near low water",
    belowMean: "below mean water",
    aboveMean: "above mean water",
    cycleTitle: "How to read a water year",
    cycleIntro:
      "The important relationship sits between two curves: snow is stored first and released later as river flow.",
    snow: "snow storage",
    flow: "typical river flow",
    schematic: "Schematic reading guide — not current measurements",
    storesTitle: "Three stores, one story",
    snowTitle: "Snow",
    snowBody:
      "Snow depth is not water content. The next release will therefore use modelled snow-water equivalent or clearly labelled stations with their elevation.",
    riversTitle: "Rivers",
    riversBody:
      "Gauges show operated flow: Austria's large rivers are regulated. Daily patterns can come from power stations, not weather.",
    groundTitle: "Groundwater",
    groundBody:
      "It responds slowly and says more about persistent drought than one rainy day. Next comes comparison with the 1991–2020 normal.",
    nextLabel: "Coming next",
    nextTitle: "Normal for this date",
    nextBody:
      "The next data layer will place river flow, snow and groundwater inside the 1991–2020 climate normal. Only then can the site answer “high or low for today?” with evidence.",
    safetyTitle: "Not a flood-warning service",
    safetyBody:
      "This page explains Austria's water stores. For warnings and local hazards, rely exclusively on the official services.",
    officialWarnings: "Open official services",
    sister: "Sister project",
    sisterLink: "Where does the electricity come from?",
    source:
      "Data: Hydrographie Österreich (eHYD) and GeoSphere Austria, both CC BY 4.0. No cookies, no tracking.",
    theme: "Light / dark",
    unavailableShort: "Connection paused",
  },
} as const;

function number(value: unknown): number | null {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function ehydTime(value: unknown): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2})/.exec(String(value ?? ""));
  if (!match) return null;
  return new Date(2000 + Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]));
}

function riverStatus(river: River, lang: Lang) {
  const copy = COPY[lang];
  if (river.nw == null || river.mw == null) return "";
  if (river.now < river.nw * 0.95) return copy.belowLow;
  if (river.now < river.nw * 1.1) return copy.nearLow;
  if (river.now < river.mw) return copy.belowMean;
  return copy.aboveMean;
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 3) return null;
  const width = 240;
  const height = 42;
  const high = Math.max(...values);
  const low = Math.min(...values);
  const span = high - low || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 4 - ((value - low) / span) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function RiverCard({ river, lang }: { river: River; lang: Lang }) {
  const copy = COPY[lang];
  const formatter = useMemo(
    () => new Intl.NumberFormat(lang === "de" ? "de-AT" : "en-GB", { maximumFractionDigits: river.now < 100 ? 1 : 0 }),
    [lang, river.now],
  );
  const ratio = river.mw ? Math.round((river.now / river.mw) * 100) : null;
  const scale = Math.max(river.mw ?? river.now, river.now * 1.08);

  return (
    <article className="river-card">
      <div className="river-head">
        <strong>{lang === "de" ? river.river : river.en}</strong>
        <span>{river.gauge}</span>
      </div>
      <div className="river-value">
        {formatter.format(river.now)} <small>{river.unit}</small>
      </div>
      <p className="river-context">
        {ratio != null ? `${ratio}% ${copy.ofMean} · ${riverStatus(river, lang)}` : "\u00a0"}
      </p>
      <div className="river-track" aria-hidden="true">
        <span className="river-fill" style={{ width: `${Math.max(1, (river.now / scale) * 100)}%` }} />
        {river.nw != null && river.nw <= scale ? <i className="river-tick" style={{ left: `${(river.nw / scale) * 100}%` }}><b>NW</b></i> : null}
        {river.mw != null && river.mw <= scale ? <i className="river-tick" style={{ left: `${(river.mw / scale) * 100}%` }}><b>MW</b></i> : null}
      </div>
      <Sparkline values={river.series} label={`${river.gauge}, 7 days`} />
    </article>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("de");
  const [theme, setTheme] = useState<Theme>("light");
  const [state, setState] = useState<LoadState>("loading");
  const [rivers, setRivers] = useState<River[]>([]);

  useEffect(() => {
    const savedLang = window.localStorage.getItem("water-lang");
    if (savedLang === "en" || savedLang === "de") setLang(savedLang);
    else if (navigator.language.toLowerCase().startsWith("en")) setLang("en");

    const savedTheme = window.localStorage.getItem("water-theme");
    const nextTheme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("water-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function loadRivers() {
      const results = await Promise.allSettled(
        RIVERS.map(async (definition) => {
          const response = await fetch(`${EHYD}${definition.hzbnr}`, { cache: "no-store" });
          if (!response.ok) throw new Error(String(response.status));
          const contentType = response.headers.get("content-type") ?? "";
          if (!contentType.includes("json")) throw new Error("eHYD did not return JSON");
          const data = await response.json() as EhydPayload;
          const now = number(data.wert);
          if (now == null) throw new Error("Missing current value");
          return {
            ...definition,
            gauge: data.messstelle ?? String(definition.hzbnr),
            unit: data.einheit ?? "m³/s",
            now,
            at: ehydTime(data.zp),
            nw: number(data.niedrigwasser),
            mw: number(data.mittelwasser),
            series: (data.data ?? []).map(number).filter((value): value is number => value != null),
          } satisfies River;
        }),
      );

      if (cancelled) return;
      const available = results
        .filter((result): result is PromiseFulfilledResult<River> => result.status === "fulfilled")
        .map((result) => result.value);
      setRivers(available);
      setState(available.length ? "live" : "unavailable");
    }

    loadRivers().catch(() => {
      if (!cancelled) setState("unavailable");
    });
    return () => { cancelled = true; };
  }, []);

  const copy = COPY[lang];
  const latest = rivers
    .map((river) => river.at)
    .filter((value): value is Date => value != null)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const latestText = latest
    ? new Intl.DateTimeFormat(lang === "de" ? "de-AT" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(latest)
    : null;

  function toggleLang() {
    const next = lang === "de" ? "en" : "de";
    setLang(next);
    window.localStorage.setItem("water-lang", next);
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label={copy.title}>Wasser / AT</a>
        <div className="controls">
          <button type="button" onClick={toggleLang} aria-label={lang === "de" ? "Switch to English" : "Auf Deutsch wechseln"}>{lang === "de" ? "EN" : "DE"}</button>
          <button type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={copy.theme} title={copy.theme}>◐</button>
        </div>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.intro}</p>
        <div className="hero-rule" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-thesis">
          <h2>{copy.thesis}</h2>
          <p>{copy.thesisBody}</p>
        </div>
      </section>

      <section className="panel live-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01</p>
            <h2>{copy.liveTitle}</h2>
          </div>
          <div className={`live-status ${state}`} role="status">
            <i aria-hidden="true" />
            <span>{state === "loading" ? copy.liveLoading : state === "live" ? `${copy.liveReady}${latestText ? ` · ${latestText}` : ""}` : copy.unavailableShort}</span>
          </div>
        </div>

        {state === "loading" ? (
          <div className="river-grid" aria-hidden="true">
            {RIVERS.map((river) => <div className="river-placeholder" key={river.hzbnr}><span /><b /><i /></div>)}
          </div>
        ) : null}

        {state === "live" ? (
          <div className="river-grid">
            {rivers.map((river) => <RiverCard river={river} lang={lang} key={river.hzbnr} />)}
          </div>
        ) : null}

        {state === "unavailable" ? (
          <div className="service-message">
            <div>
              <h3>{copy.liveUnavailable}</h3>
              <p>{copy.liveUnavailableBody}</p>
            </div>
            <a href="https://ehyd.gv.at/?g_card=pegelaktuell%23" target="_blank" rel="noreferrer">{copy.openEhyd} <span aria-hidden="true">↗</span></a>
          </div>
        ) : null}

        <p className="note">{copy.liveNote}</p>
      </section>

      <section className="panel cycle-panel">
        <div className="section-heading cycle-heading">
          <div>
            <p className="eyebrow">02</p>
            <h2>{copy.cycleTitle}</h2>
          </div>
          <p>{copy.cycleIntro}</p>
        </div>
        <div className="cycle-key">
          <span><i className="snow-key" />{copy.snow}</span>
          <span><i className="flow-key" />{copy.flow}</span>
        </div>
        <div className="cycle-chart" role="img" aria-label={copy.schematic}>
          {MONTHS[lang].map((month, index) => (
            <div className="cycle-month" key={month}>
              <div className="cycle-bars">
                <i className="snow-bar" style={{ height: `${SNOW_CYCLE[index]}%` }} />
                <i className="flow-bar" style={{ height: `${FLOW_CYCLE[index]}%` }} />
              </div>
              <span>{month}</span>
            </div>
          ))}
        </div>
        <p className="chart-caption">{copy.schematic}</p>
      </section>

      <section className="panel stores-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">03</p>
            <h2>{copy.storesTitle}</h2>
          </div>
        </div>
        <div className="store-grid">
          <article>
            <span className="store-number">01</span>
            <h3>{copy.snowTitle}</h3>
            <p>{copy.snowBody}</p>
          </article>
          <article>
            <span className="store-number">02</span>
            <h3>{copy.riversTitle}</h3>
            <p>{copy.riversBody}</p>
          </article>
          <article>
            <span className="store-number">03</span>
            <h3>{copy.groundTitle}</h3>
            <p>{copy.groundBody}</p>
          </article>
        </div>
      </section>

      <section className="next-panel">
        <p className="eyebrow">{copy.nextLabel}</p>
        <div>
          <h2>{copy.nextTitle}</h2>
          <p>{copy.nextBody}</p>
        </div>
        <span className="baseline">1991<br />—<br />2020</span>
      </section>

      <aside className="safety-note">
        <div className="safety-mark" aria-hidden="true">!</div>
        <div>
          <h2>{copy.safetyTitle}</h2>
          <p>{copy.safetyBody}</p>
        </div>
        <a href="https://ehyd.gv.at/?g_card=pegelaktuell%23" target="_blank" rel="noreferrer">{copy.officialWarnings} <span aria-hidden="true">↗</span></a>
      </aside>

      <footer>
        <p>{copy.source}</p>
        <p>{copy.sister}: <a href="https://rfuzzo.github.io/woher-kommt-der-strom/">{copy.sisterLink}</a> ↗</p>
      </footer>
    </main>
  );
}
