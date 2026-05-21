import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTOTYPE = resolve(__dirname, "../prototypes/V0_Covenant Data Platform.html");
const OUT = resolve(__dirname, "../prototypes/rendered-dom.html");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`file://${PROTOTYPE}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  const html = await page.content();
  await writeFile(OUT, html, "utf8");
  console.log(`Wrote ${OUT} (${html.length} chars)`);

  // Extract sidebar text content
  const sidebarTexts = await page.locator("aside, [class*='sidebar'], nav").allTextContents();
  console.log("Sidebar candidates:", sidebarTexts.slice(0, 5));

  await browser.close();
})();
