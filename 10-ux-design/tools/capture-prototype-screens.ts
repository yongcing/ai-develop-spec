// Generic prototype-screens capture script.
//
// Usage:
//   npx tsx capture-prototype-screens.ts --config <config.json>
//
// Config schema (see capture.example.json next to this file):
// {
//   "prototypeUrl": "file:///abs/path/to/prototype.html"  // or any http(s) URL
//   "outDir": "abs/path/to/output/screens",
//   "viewport": { "width": 1440, "height": 900 },
//   "navigation": [                                       // ordered steps
//     { "name": "default" },                              // first snap, no click
//     { "name": "after-foo", "clickText": "Foo" },
//     { "name": "after-bar", "clickText": "Bar", "exact": false }
//   ]
// }
//
// Each step: optionally click an element by visible text, wait, screenshot.
// Failures on a single step are reported and the script continues.

import { chromium, type Page } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface Step {
  name: string;
  clickText?: string;
  exact?: boolean;
  waitMs?: number;
}

interface Config {
  prototypeUrl: string;
  outDir: string;
  viewport?: { width: number; height: number };
  navigation: Step[];
}

async function snap(page: Page, outDir: string, name: string) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  console.log(`✓ ${name}.png`);
}

async function tryClick(page: Page, text: string, exact = true) {
  const loc = page.getByText(text, { exact }).first();
  if ((await loc.count()) === 0) return false;
  try {
    await loc.click({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const i = process.argv.indexOf("--config");
  if (i < 0 || !process.argv[i + 1]) {
    console.error("Usage: capture-prototype-screens.ts --config <config.json>");
    process.exit(2);
  }
  const cfgPath = resolve(process.argv[i + 1]!);
  const cfg: Config = JSON.parse(await readFile(cfgPath, "utf8"));

  await mkdir(cfg.outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: cfg.viewport ?? { width: 1440, height: 900 } });
  await page.goto(cfg.prototypeUrl);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  for (const step of cfg.navigation) {
    if (step.clickText) {
      const ok = await tryClick(page, step.clickText, step.exact ?? true);
      if (!ok) console.warn(`  ! click text "${step.clickText}" not found — snapping current state`);
    }
    await page.waitForTimeout(step.waitMs ?? 500);
    await snap(page, cfg.outDir, step.name);
  }

  await browser.close();
  console.log(`Done. Screens in ${cfg.outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
