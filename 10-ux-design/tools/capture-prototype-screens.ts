import { chromium, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTOTYPE = resolve(__dirname, "../prototypes/V0_Covenant Data Platform.html");
const OUT_DIR = resolve(__dirname, "../prototypes/screens/covenant");

async function snap(page: Page, name: string) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: true });
  console.log(`✓ ${name}.png`);
}

async function clickIfExists(page: Page, text: string): Promise<boolean> {
  const loc = page.getByText(text, { exact: true }).first();
  if ((await loc.count()) > 0) {
    try {
      await loc.click({ timeout: 3000 });
      await page.waitForTimeout(500);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function pickRoleByPartial(page: Page, partial: string): Promise<boolean> {
  // Role cards on login screen contain partial text — click the closest card-like container
  const txt = page.getByText(partial, { exact: false }).first();
  if ((await txt.count()) === 0) return false;
  try {
    await txt.click({ timeout: 4000 });
    await page.waitForTimeout(800);
    return true;
  } catch {
    return false;
  }
}

(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`file://${PROTOTYPE}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  // Initial state IS provider workspace (per earlier capture). Snap it.
  await snap(page, "provider-overview");
  if (await clickIfExists(page, "我的合約")) await snap(page, "provider-my-contracts");
  if (await clickIfExists(page, "註冊新合約")) await snap(page, "provider-register");
  if (await clickIfExists(page, "草稿")) await snap(page, "provider-drafts");
  if (await clickIfExists(page, "文件")) await snap(page, "provider-docs");

  // Go to login (role switcher)
  if (await clickIfExists(page, "切換身分")) {
    await snap(page, "_login");

    // Owner: text "平台管理者"
    if (await pickRoleByPartial(page, "平台管理者")) {
      await snap(page, "owner-overview");
      for (const nav of ["待審核", "審核", "範本", "Templates", "儲存", "Storage", "目錄", "Directory", "瀏覽合約"]) {
        if (await clickIfExists(page, nav)) {
          await snap(page, `owner-${nav.toLowerCase().replace(/\s+/g, "-")}`);
        }
      }
    }

    // Back to login → Consumer
    if (await clickIfExists(page, "切換身分")) {
      if (await pickRoleByPartial(page, "資料使用者")) {
        await snap(page, "consumer-overview");
        for (const nav of ["Query services", "Access tokens", "瀏覽合約"]) {
          if (await clickIfExists(page, nav)) {
            await snap(page, `consumer-${nav.toLowerCase().replace(/\s+/g, "-")}`);
          }
        }
      }
    }
  }

  await browser.close();
  console.log(`Done. Screens in ${OUT_DIR}`);
})();
