import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist-pages/", import.meta.url);

test("builds a self-contained GitHub Pages entry point", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /<title>Wie viel Wasser hat Österreich\?<\/title>/i);
  assert.match(html, /Aktuelle Niederschlags-, Abfluss-, Schnee- und Grundwassermessungen/);
  assert.match(html, /(?:src|href)="\.\/assets\//);
  assert.doesNotMatch(html, /\/_next\/|localhost|codex-preview/i);
});

test("emits JavaScript and CSS assets", async () => {
  const assetsRoot = new URL("assets/", outputRoot);
  const files = await readdir(assetsRoot);

  assert.ok(files.some((file) => file.endsWith(".js")));
  assert.ok(files.some((file) => file.endsWith(".css")));
  await access(new URL("index.html", outputRoot));
});

test("includes the official groundwater summary", async () => {
  const snapshot = JSON.parse(await readFile(new URL("data/groundwater.json", outputRoot), "utf8"));
  const total = Object.values(snapshot.counts).reduce((sum, count) => sum + count, 0);

  assert.equal(total, 229);
  assert.match(snapshot.latest, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(snapshot.stale >= 0);
});
