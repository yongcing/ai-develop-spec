// Capture MVP screens for visual parity diff
import { chromium, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../prototypes/screens/mvp");
const BASE = process.env.MVP_BASE_URL || "http://localhost:3000";

async function snap(page: Page, name: string) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: true });
  console.log(`✓ ${name}.png`);
}

(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const routes: { url: string; name: string }[] = [
    { url: "/", name: "_login" },
    { url: "/provider", name: "provider-overview" },
    { url: "/provider/my-contracts", name: "provider-my-contracts" },
    { url: "/provider/register", name: "provider-register" },
    { url: "/provider/drafts", name: "provider-drafts" },
    { url: "/owner", name: "owner-overview" },
    { url: "/consumer", name: "consumer-overview" },
  ];

  for (const r of routes) {
    await page.goto(`${BASE}${r.url}`);
    await page.waitForLoadState("networkidle");
    await snap(page, r.name);
  }

  await browser.close();
  console.log(`Done. MVP screens in ${OUT_DIR}`);
})();
