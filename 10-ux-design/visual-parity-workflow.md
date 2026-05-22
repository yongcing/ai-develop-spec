# Prototype → MVP 視覺一致性工作流

> 這份文件補上 [design-principles.md](design-principles.md) 「Prototype 流程」一節的缺口。
> 之前的流程只抽 tokens 就動工，結果 MVP 跟 prototype 長相落差過大。本文件規範**每個 UI 區段必須執行的視覺對齊步驟**。

## 核心原則

「不直接複製 prototype 的 HTML」**不等於**「不參考 prototype 視覺」。
要重新基於規範元件實作 — **但成品 layout、密度、間距、配色都要肉眼難以分辨**。

## 必要產出（每個區段一份）

對 prototype 內每個區段，**project repo** 必須有（路徑依 [/00-architecture/design-to-code-workflow.md](../00-architecture/design-to-code-workflow.md)）：

```
design/sections/<section>/
└─ visual/
   ├─ default.png                # 1440×900 全頁截圖
   ├─ measurements.md            # 量出來的數字（見下）
   └─ states/
      ├─ hover-<el>.png
      ├─ empty.png
      ├─ loading.png
      └─ error.png
```

原始 prototype 檔案放在 `design/raw/`，不放 spec repo。

### 截圖規格

- viewport：**1440×900**（桌面主要斷點）
- 全頁（含 scroll），不是 above-the-fold
- 抓乾淨狀態（有資料），另抓 empty / error / loading 各一張到 `<section>.states/`
- 用 Playwright 自動化：[tools/capture-prototype-screens.ts](tools/capture-prototype-screens.ts) 是 config-driven 版本：

```bash
npx tsx 10-ux-design/tools/capture-prototype-screens.ts --config my-prototype.json
```

config 格式見 [tools/capture.example.json](tools/capture.example.json)。CI 每週重跑一次以偵測 prototype 漂移。

### measurements.md 格式

每個 section 一份，**用實測值不用估值**。**以下為格式示意，具體數值依各 project 量測為準**：

```markdown
# Overview measurements

## Layout
- Page content max-width: <px>
- Page padding (horizontal): <px>
- Page padding (vertical): <px>
- Grid gap: <px>

## Sidebar
- Width: <px>
- Item height: <px>
- Item horizontal padding: <px>
- Active state: <token-based 描述，例如 brand-primary/10 bg + brand-primary text>

## Stat card
- Min height: <px>
- Padding: <px>
- Label: text-xxs uppercase color.neutral.700
- Value: text-3xl font-semibold
- Delta: text-xs, color.status.success-text for positive

## Data table
- Row height: <px>
- Header height: <px>, color.surface, text-xxs uppercase font-medium
- Cell padding: <px>
- Divider: 1px color.border.subtle
- Hover: color.neutral.50 bg

## Typography
- Page title (h1): text-2xl semibold
- Card title: text-lg semibold
- Body: text-sm
- Meta: text-xs color.neutral.700
```

**顏色一律 token name，不准 hex / rgb / hsl**。

量法：開 prototype → DevTools → 用 ruler / computed styles 抓真實數字，不要用 inspector estimate。

## 開發流程（強制順序）

對每個 section：

1. **截圖 + 量** — 完成 `design/sections/<section>/visual/default.png` + `design/sections/<section>/visual/measurements.md`
2. **元件盤點** — 對照 [component-inventory.md](component-inventory.md)，列出該 section 需要哪些 UI 元件；缺的先補（不要 inline 寫）
3. **單頁實作** — 只實作這一個 section，**禁止**先抽 PageShell / DataTable 等共用層；除非 measurements 證明跨 section 結構一致
4. **並排比對** — 開實作 dev server + prototype 同瀏覽器，1440x900 視窗左右各一，肉眼掃描差異；不合規的差異（見下）必須修
5. **自動 diff** — 用 Playwright 對相同 URL 截圖，跟 `design/sections/<section>/visual/default.png` 做 pixel diff；容忍門檻：總 diff pixels < 2% （字體 anti-aliasing 噪音）
6. **抽共用**：兩個以上 section 重複的結構才能抽到 `components/ui/`，否則留在 feature 內

> 違反順序會被 PR review 退回。AI 在做 UI section 時必須在 PR 描述貼 `design/sections/<section>/visual/default.png` 並列當下實作截圖。

## 「不合規差異」清單

掃描比對時，下列**必修**：

- 顏色不在 [design-tokens.json](design-tokens.json) 內
- 間距與 measurements.md 差 ≥ 8px
- 字級 / 字重與 measurements 不符
- 缺重要視覺元素（icon、divider、badge）或多了 prototype 沒有的元素
- 卡片 padding / radius / shadow 等容器規格不符
- Layout 結構錯（grid 欄數、sidebar 位置、卡片排序）

下列**可以不一致**（理由要寫 PR）：

- 微互動（hover transition timing、focus ring 樣式 — 以 design-principles a11y 為準）
- 圖示具體選用（prototype 可能用付費圖示，實作用 lucide）
- Mock 文字與資料內容
- 不影響視覺密度的微小 spacing 差 (<8px)

## 共用元件抽取準則

`components/ui/` 的元件**必須**在 ≥2 個 section 已實作後才能存在，且：

- 命名與 [component-inventory.md](component-inventory.md) 對齊
- 參數 / variant 來自實際 section 用法歸納，不臆造
- 同名元件第三次重複時必抽，不可繼續 copy-paste

## 對 AI 生成行為的影響

- 生成 UI section 前**必先讀**對應 `design/sections/<section>/visual/measurements.md`；找不到 → 停下，先做截圖 + 量值
- 不准先建 PageShell / DataTable 等抽象；最多兩個 section 完成後再抽
- PR 描述未附 prototype vs 實作並排截圖 → 該 UI PR 視為未完成（DoD 退回）
- 每次 UI commit 必須 reference 對應的 measurements.md 路徑
