import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist-pages/", import.meta.url);

test("builds a self-contained GitHub Pages entry point", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /<title>Wie viel Wasser hat Österreich\?<\/title>/i);
  assert.match(html, /Aktuelle Niederschlags-, Wasserjahr- und Schneemessungen/);
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
