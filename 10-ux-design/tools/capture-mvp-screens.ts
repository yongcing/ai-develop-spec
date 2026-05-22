// Generic MVP-screens capture script.
//
// Usage:
//   MVP_BASE_URL=http://localhost:3000 npx tsx capture-mvp-screens.ts --config routes.json
//
// routes.json:
// {
//   "outDir": "abs/path/to/output/screens",
//   "viewport": { "width": 1440, "height": 900 },
//   "routes": [
//     { "url": "/", "name": "_login" },
//     { "url": "/dashboard", "name": "dashboard" }
//   ]
// }
//
// Pair with `capture-prototype-screens.ts` output for pixel-diff parity.

import { chromium, type Page } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface Route {
  url: string;
  name: string;
}

interface Config {
  outDir: string;
  viewport?: { width: number; height: number };
  routes: Route[];
}

const BASE = process.env.MVP_BASE_URL ?? "http://localhost:3000";

async function snap(page: Page, outDir: string, name: string) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  console.log(`✓ ${name}.png`);
}

async function main() {
  const i = process.argv.indexOf("--config");
  if (i < 0 || !process.argv[i + 1]) {
    console.error("Usage: capture-mvp-screens.ts --config <routes.json>");
    process.exit(2);
  }
  const cfg: Config = JSON.parse(await readFile(resolve(process.argv[i + 1]!), "utf8"));
  await mkdir(cfg.outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: cfg.viewport ?? { width: 1440, height: 900 } });

  for (const r of cfg.routes) {
    await page.goto(`${BASE}${r.url}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await snap(page, cfg.outDir, r.name);
  }

  await browser.close();
  console.log(`Done. Screens in ${cfg.outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
