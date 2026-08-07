import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SOURCE = "https://gis.lfrz.gv.at/api/geodata/i000501/ogc/features/v1/collections/i000501:grundwasser_aktuell/items?f=json&limit=1000";
const LEVELS = ["veryHigh", "high", "middle", "low", "veryLow", "unavailable"];

function levelFromColour(colour) {
  const match = typeof colour === "string" ? /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(colour) : null;
  if (!match) return "unavailable";
  const red = Number.parseInt(match[1], 16);
  const green = Number.parseInt(match[2], 16);
  const blue = Number.parseInt(match[3], 16);

  if (red > 220 && green > 220 && blue > 220) return "unavailable";
  if (red > 70 && blue > 100 && green < Math.min(red, blue) * 0.75) return "veryHigh";
  if (blue > red * 1.15 && blue > green * 1.15) return "high";
  if (green > red * 1.2 && green > blue * 1.2) return "middle";
  if (red > 200 && green > 70 && green < 200 && blue < 120) return "low";
  if (red > 150 && green < 110 && blue < 110) return "veryLow";
  return "unavailable";
}

const response = await fetch(SOURCE, { headers: { accept: "application/json" } });
if (!response.ok) throw new Error(`Groundwater download failed: ${response.status}`);
const collection = await response.json();
if (!Array.isArray(collection.features) || collection.features.length === 0) {
  throw new Error("Groundwater download contained no stations");
}

const counts = Object.fromEntries(LEVELS.map((level) => [level, 0]));
let stale = 0;
let latest = null;
for (const feature of collection.features) {
  const properties = feature?.properties ?? {};
  counts[levelFromColour(properties.farbcode)] += 1;
  if (properties.transp === true) stale += 1;
  if (typeof properties.zeitpunkt === "string" && (!latest || properties.zeitpunkt > latest)) {
    latest = properties.zeitpunkt;
  }
}

const snapshot = `${JSON.stringify({ generatedAt: new Date().toISOString(), latest, stale, counts }, null, 2)}\n`;
const destinations = process.argv.slice(2);
const outputs = destinations.length
  ? destinations
  : ["public/data/groundwater.json", "static-site/public/data/groundwater.json"];

for (const output of outputs) {
  const path = resolve(output);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, snapshot);
  console.log(`Wrote ${collection.features.length} stations to ${output}`);
}
