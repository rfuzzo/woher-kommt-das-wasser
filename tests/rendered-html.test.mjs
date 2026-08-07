import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Austrian water dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Wie viel Wasser hat Österreich\?<\/title>/i);
  assert.match(html, /Wie viel Wasser hat Österreich\?/);
  assert.match(html, /Messwerte werden geladen/);
  assert.match(html, /Grenzen der Darstellung/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("uses verified live and climate data sources", async () => {
  const [page, layout, packageJson, groundwaterScript] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../scripts/fetch-groundwater.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(page, /tawes-v1-10min/);
  assert.match(page, /klima-v2-1d/);
  assert.match(groundwaterScript, /grundwasser_aktuell/);
  assert.match(groundwaterScript, /farbcode/);
  assert.match(page, /groundwaterStale/);
  assert.match(page, /Niederschlag · Wasserjahr/);
  assert.match(page, /Wasserjahr-Vergleich wird berechnet/);
  assert.match(page, /1990-11-01/);
  assert.match(page, /seasonTotals\.length !== 30/);
  assert.match(layout, /Wie viel Wasser hat Österreich\?/);
  assert.doesNotMatch(page, /mock|sample data|Math\.random/i);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
