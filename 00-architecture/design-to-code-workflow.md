# Design → Code Workflow

> 通用的「設計輸入 → AI 生成程式碼」開發流程。
> 適用任何前端 UI 工作，不限本專案的 prototype 格式。
> 取代過去「只看 prototype 就動工」的鬆散流程。

## 核心觀念

**AI 不能填空白。**
規格沒寫的東西，AI 一定會自己編，且編得很合理但跟設計意圖無關。
本工作流的目的不是教 AI 怎麼寫，而是**逼設計輸入足夠完整、缺料就停下**。

## 五階段

```
0. Intake  →  1. Decompose  →  2. Specify  →  3. Generate  →  4. Verify
   設計輸入     拆 section       補規格           AI 寫           自動驗
```

每階段都有 **gate**：未過 gate 不准進下一階段。

---

## Stage 0 — Intake

### 輸入
任意格式：Figma、screenshot、prototype HTML、白板照、PRD、語音轉錄。

### 動作
1. 將所有來源原檔收進 `design/raw/<source>/`
2. 統一抽出靜態 PNG（每個畫面 1440×900，full-page）
3. 補一份 `design/raw/README.md` 紀錄來源、版本、時間戳

### Gate
`design/raw/` 至少有一張 PNG + README。

---

## Stage 1 — Decompose

切到「最小可獨立實作的畫面」級別。

### 切割原則
- **單位是 section（頁面層）**，不是 component、不是 feature
- 判定：能在 PR 描述放一張截圖就講清楚 → 是一個 section
- Section 之間禁止重疊；shared chrome（sidebar / topbar）獨立一個 section

### 動作
為每個 section 建立資料夾：

```
design/sections/<section-id>/
```

例：
```
design/sections/
├─ _shell/                 # sidebar + topbar 共用 chrome
├─ provider-overview/
├─ provider-my-contracts/
├─ provider-register/
├─ login/
└─ ...
```

### Gate
所有從 raw 看得到的畫面都對應到一個 section 資料夾；無孤兒、無重疊。

---

## Stage 2 — Specify

對每個 section 產出**三份規格**。三份缺一不可。

```
design/sections/<section>/
├─ visual/
│  ├─ default.png                # 預設狀態
│  ├─ states/
│  │  ├─ hover-<el>.png          # 重要 hover
│  │  ├─ dropdown-open.png
│  │  ├─ modal-<name>.png
│  │  ├─ form-step-<n>.png
│  │  ├─ loading.png
│  │  ├─ empty.png
│  │  └─ error.png
│  └─ measurements.md            # 量測值（見下）
├─ behavior/
│  ├─ interactions.md            # 互動清單（見下）
│  └─ flow.md                    # state machine / 跨 section 跳轉
└─ data/
   └─ contract.md                # 顯示哪些 fields / 來源 / shape / edge cases
```

### `visual/measurements.md`

```markdown
## Layout
- Content max-width / padding / grid gap
## Typography
- Page title / card title / body / meta — 字級、字重、line-height
## Specific components
- StatCard: padding 20px 24px, label 11px uppercase #6e6e73, value 32px 600
- DataTable: row height 64px, header text-xxs uppercase, divider 1px neutral-100
## Color usage
- 全部從 design-tokens.json 引用；不准 hardcode
```

實測值，不要憑感覺。用瀏覽器 DevTools 量。

### `behavior/interactions.md`

```markdown
## Interactive elements
| Selector / 位置 | Action | Result | State screenshot |
|--|--|--|--|
| "新增合約" btn (top-right) | click | nav to /register | (next section) |
| Row in table | hover | bg neutral-50 | states/row-hover.png |
| Row in table | click | nav to /contracts/{id} | (next section) |
| Sort header | click | toggle sort asc/desc | states/sorted-desc.png |
| 切換身分 (sidebar bottom) | click | nav to / | (login section) |

## Keyboard
- `?` opens shortcut help
- `/` focuses search
- Esc closes modal

## Empty / Loading / Error
- 直接指向對應 state 截圖
```

每條 row 將直接 codegen 一條 Cypress E2E。

### `behavior/flow.md`

```markdown
default
  └─[click 新增合約]→ register-step1
                        └─[Continue]→ register-step2
                                        └─[…]→ register-step5
                                                 └─[Submit]→ my-contracts (with new pending row)

default
  └─[click row]→ contract-detail
                   └─[Back]→ default
```

跨 section 的 state machine。

### `data/contract.md`

```markdown
## Source
- GET /api/v1/contracts?owner=me
- Page<Contract>
## Fields used in this section
- id, fqName, title, status, domain, format, submittedAgo, consumers
## Edge cases
- 空 list → 對應 states/empty.png
- > 100 筆 → 顯示前 50 + pagination
- title 過長 → truncate + tooltip（見 states/truncate.png）
## Mutations triggered from this section
- (none) — read-only
```

讓 AI 知道頁面該抓什麼、不抓什麼。

### Gate（**最關鍵**）

進入 Stage 3 前必須通過：

- [ ] `visual/default.png` + `measurements.md` 存在
- [ ] `behavior/interactions.md` 列出**所有可見的互動元素**
- [ ] `interactions.md` 提到的 state（hover、modal-open、step-2…）都有對應截圖
- [ ] `behavior/flow.md` 含進入本 section 與離開本 section 的所有路徑
- [ ] `data/contract.md` 標明資料來源與顯示欄位
- [ ] 規格內**沒有「TBD」「待補」「???」「TODO:」**token（無例外；要保留待辦請移到 issue tracker，不要寫在 spec 內）

CI lint 跑這份 checklist。AI 在 Stage 3 動工前 hard-stop 確認，缺料即拒。

> **規格用 AI 草擬 + 人工把關**：多模態 LLM 看一張截圖可以草擬 80% 的 measurements 與 interactions；設計師/PM 花 10 分鐘補完。比從零寫快 10 倍。

---

## Stage 3 — Generate

### 規則

1. AI 動工前**必須**逐字 cat 三份規格
2. 對每個未在規格內定義的細節 → 列在 PR 描述「Assumed defaults」清單，**不准默默假設**
3. 一次只實作一個 section
4. 共用元件抽取**必須**在 ≥2 sections 完成後才能做（避免提前抽象）
5. 用到 design tokens 必須引用 token name，不准 hardcode 顏色 / 字級

### 動作

```
src/app/<route>/page.tsx           # section 落點
src/features/<section>/...         # section 專用元件
src/components/ui/...              # 抽取的共用元件（≥2 sections 才能放）
```

### Gate

- `npm run typecheck && npm run lint && npm run build` 全綠
- Section route 可以實際打開

---

## Stage 4 — Verify

**雙軌（或三軌）自動化驗證**。AI 不能自己改驗證程式繞過。

### 視覺軌（pixel parity）

> **狀態：計劃中**。`tools/visual-diff.ts` 尚未實作；以下是 contract 描述，project repo 可先依此自建。

```
tools/visual-diff.ts (planned)
  ├─ Playwright（純截圖用途，與 E2E 框架無關）跑成品 section → 1440×900 截圖
  ├─ 對應 design/sections/<section>/visual/default.png 做 pixel diff
  └─ 差異 < 2% pass
```

### 行為軌（interaction parity）

> **狀態：計劃中**。`tools/codegen-e2e.mjs` 尚未實作。

```
tools/codegen-e2e.mjs (planned)
  └─ 從 behavior/interactions.md 每條 row 產生一個 Cypress E2E test
     - 找 selector
     - 觸發 action
     - 斷言 result（URL change / DOM state / 對應 state 截圖）
```

> E2E 框架本身：**Cypress**（見 [/20-frontend/tech-stack.md](../20-frontend/tech-stack.md)）。`capture-prototype-screens.ts` 與 `capture-mvp-screens.ts` 用 Playwright 是因為單純截圖，與 E2E 框架選型無關。

### 資料軌（contract test，後端到位時）

```
- OpenAPI / RTK Query generated types 對齊 data/contract.md
- MSW handler 覆蓋 edge cases
```

### Gate

三軌全綠才能進 PR。任一紅 → 回 Stage 2 或 3 修。

---

## 跨階段硬規則

1. **Refuse-to-proceed > prompt engineering**
   寧可讓 AI 在規格缺料時直接停下回報，也不要靠 prompt 教它「請參考設計」。後者一定漏。

2. **同一個 AI 既當作者也當驗證者，但用不同 context**
   寫 code 的 AI 只讀「規格 + 既有元件」，不讀競品 / 原 prototype 程式；驗證的 AI 只讀「成品 vs 規格」差異。分開降低自圓其說。

3. **規格本身用 AI 草擬，人工把關**
   多模態 LLM 看截圖草擬規格 → 設計師/PM 補完。最危險的是「沒人把關 = AI 把它想得到的補進規格」。

4. **共用元件抽取要看實際 ≥2 處重複**
   提早抽 = 抽錯介面，要重做。

---

## 為什麼這個流程比常見作法 robust

| 常見作法 | 失效模式 | 本流程怎麼防 |
|---|---|---|
| 「給 AI Figma 連結讓它自己看」 | AI 抽到的視覺 token 跟它看到的不一致 | tokens 從 measurements.md 來，AI 不自己抽 |
| 「Storybook 驅動」 | Story 在元件層，丟失頁面 context 與 flow | section 是頁面層；flow.md 補跨頁 transition |
| 「PRD + 設計圖」 | 兩份各自完整、彼此沒對齊 | 三份 spec 同位 section 資料夾，gate 強制存在 |
| 「先做 design system」 | 抽象比實際需求早，做完用不上 | ≥2 sections 才允許抽 |
| 「prototype 就是規格」 | prototype 互動藏在 JS bundle 看不到 | interactions.md 明文列出，與來源解耦 |

---

## 落地建議

對本 spec repo / 既有 project repo：

1. [/10-ux-design/visual-parity-workflow.md](../10-ux-design/visual-parity-workflow.md) — 「視覺軌」具體實作
2. [/10-ux-design/interaction-spec-workflow.md](../10-ux-design/interaction-spec-workflow.md) — 「行為軌」與「資料軌」具體實作
3. 在 project repo 加 CI job：
   - `lint:design-spec` — 確認每個 section 三份 spec 都存在且不含 TBD（已實作於 spec repo：[10-ux-design/tools/lint-design-spec.mjs](../10-ux-design/tools/lint-design-spec.mjs)）
   - `e2e:codegen` — 從 interactions.md 自動產 Cypress tests（**計劃中**：`tools/codegen-e2e.mjs` 尚未實作）
   - `visual-diff` — pixel parity gate（**計劃中**：`tools/visual-diff.ts` 尚未實作）
4. PR template 加三個 checkbox：「視覺軌通過 / 行為軌通過 / 資料軌通過」

---

## 對 AI 生成行為的影響

任何 UI 任務：

- 動工前**必先**讀對應 section 的 `visual/`、`behavior/`、`data/` 三份規格
- 找不到 = 停下並回報，列出缺哪幾份檔；**不准擅自實作**
- PR 描述必含「Assumed defaults」清單（規格沒寫但實作時做出的決定）
- 互動清單裡每條 row 都應該至少一個 E2E 測試對應
