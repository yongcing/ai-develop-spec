# Interaction & Data Spec Workflow

> Complements [visual-parity-workflow.md](visual-parity-workflow.md).
> 視覺軌規範「長相」；本檔規範「行為」與「內容」。
> 三軌合起來實作 [/00-architecture/design-to-code-workflow.md](../00-architecture/design-to-code-workflow.md) 的 Stage 2。

## 每個 section 必備三份檔

```
design/sections/<section>/
├─ visual/        (見 visual-parity-workflow.md)
├─ behavior/
│  ├─ interactions.md
│  └─ flow.md
└─ data/
   └─ contract.md
```

## `behavior/interactions.md`

### 目的
列出**每個可見的互動元素**及其 action / result。
每條 row 將自動轉成一條 Playwright E2E。

### 模板

```markdown
# <Section> — Interactions

## Interactive elements

| # | Selector | Action | Result | State |
|---|----------|--------|--------|-------|
| 1 | header button "新增合約" | click | navigate to `/provider/register` | (→ provider-register section) |
| 2 | sidebar item "我的合約" | click | navigate to `/provider/my-contracts` | (→ provider-my-contracts section) |
| 3 | table row | hover | bg → neutral-50 | `visual/states/row-hover.png` |
| 4 | table row | click | navigate to `/provider/contracts/{id}` | (→ contract-detail section) |
| 5 | column header "Status" | click | toggle sort asc/desc | `visual/states/sorted-desc.png` |
| 6 | activity item "View" | click | inline expand (no nav) | `visual/states/activity-expanded.png` |
| 7 | sidebar bottom "切換身分" | click | navigate to `/` | (→ login section) |

## Keyboard

| Key | Context | Action |
|-----|---------|--------|
| `?` | global | open shortcut help dialog |
| `/` | global | focus search input |
| `Esc` | dialog open | close dialog |
| `Enter` | row focused | activate row click |

## Empty / Loading / Error

- empty: `visual/states/empty.png` — CTA = "Register your first contract"
- loading: `visual/states/loading.png` — skeleton, no spinner < 200ms
- error: `visual/states/error.png` — cause + retry button + "Show details"

## Optimistic / async

- Marking a draft as submitted: optimistic UI, rollback on 5xx with toast (`states/error-toast.png`)
```

### 規則

- **Selector 欄**：寫使用者看到的文字或位置描述，不寫 CSS selector（避免過早綁實作）
- **Action**：限定詞彙 `click | hover | focus | type | keydown:<key> | submit`
- **Result**：精準描述外部可觀察的變化（URL 改變、DOM 改變、toast 出現…），**不寫實作機制**
- **State**：必須指向 `visual/states/*.png` 或標註 `(→ <section> section)` 或 `(no visual change)`
- 列在這裡但無對應 state 截圖 = lint 紅
- 沒列在這裡的互動元素 = AI 不需要實作（PR 描述標示）

### Selector 命名建議
`<element> "<visible-text>"` 或 `<area> <element>`：
- ✅ `header button "新增合約"`
- ✅ `table row in "Your contracts"`
- ✅ `sidebar item "我的合約"`
- ❌ `.btn-primary` ←過早綁實作

## `behavior/flow.md`

### 目的
描述跨 section 的 state machine。讓 AI 與 reviewer 看得到「這頁能去哪、從哪能來」。

### 模板

```markdown
# <Section> — Flow

## Entry points
- `/provider` (default route after Provider login)
- `/` → 點 "資料提供者 Provider" → here

## Exit points
- 新增合約 → `provider-register` (step 1)
- table row click → `contract-detail/{id}`
- View all → `provider-my-contracts`
- 切換身分 → `login`

## Internal state machine (within section)

```
default
  ├─ [click 新增合約] → leave to provider-register
  ├─ [click row]      → leave to contract-detail
  └─ [click View all] → leave to provider-my-contracts
```

## Cross-section flows this section participates in

### "Register a new contract" flow
provider-overview
  → [click 新增合約]
provider-register-step1
  → [Continue] step2 → step3 → step4 → step5
  → [Submit]
provider-my-contracts (with new pending row)
```

### 規則

- 用 ASCII tree 或 mermaid，**不限格式**
- 涵蓋所有 Entry / Exit / 內部 state transition
- 描述失敗 / cancel / back navigation 也算

## `data/contract.md`

### 目的
列出本 section 顯示什麼資料、來自哪裡、edge case 行為。
讓 AI 知道**抓什麼、不抓什麼**；讓後端知道要開哪些 endpoint。

### 模板

```markdown
# <Section> — Data Contract

## Source endpoints

| # | Method | Path | Purpose | DTO |
|---|--------|------|---------|-----|
| 1 | GET | `/api/v1/contracts?owner=me&size=50` | List my contracts | `Page<Contract>` |
| 2 | GET | `/api/v1/contracts/stats?owner=me` | Stat-card values | `MyContractsStats` |
| 3 | GET | `/api/v1/activity?owner=me&limit=4` | Activity timeline | `Page<ActivityEvent>` |

## Fields used in this section

### `Contract`
- `id`, `fqName`, `title` (顯示 title 為主，fqName 在第二行 mono)
- `status` (mapped: pending/approved/draft/rejected → status badge)
- `domain`, `format` (pill)
- `updatedAt` (humanised "2 days ago")
- `consumerCount`

未使用的欄位（從 endpoint 拿但不顯示）：`description`, `schema`, `ownerId`, `tags` — 文件化以避免 AI 誤刪。

## Mutations triggered from this section
- (none) — read-only listing

## Edge cases

| Condition | Expected behaviour | Screenshot |
|-----------|--------------------|------------|
| empty list | show empty state with CTA | `visual/states/empty.png` |
| > 50 items | paginate, default page size 50 | `visual/states/paginated.png` |
| `title` > 60 chars | truncate with `...`, tooltip on hover | `visual/states/truncate.png` |
| 401 | redirect to login | (→ login section) |
| 500 / network error | show error state with retry | `visual/states/error.png` |
| slow > 200ms < 1s | show skeleton | `visual/states/loading.png` |

## i18n keys used

- `provider.overview.greeting` — "Good morning, {name}."
- `provider.overview.subtitle.pending` — "You have {n} contracts pending review and {m} drafts."
- (etc.)

## Permissions

- Visible to: `role:provider` only
- Filter: `ownerId = current_user.id` enforced server-side via Specification
```

### 規則

- 每個顯示欄位必須有對應 source endpoint
- 每個 edge case 必須有對應 state 截圖（或標註理由）
- mutations 列在這裡 = 該 section 允許做的副作用；不列就不准做
- permissions 段落必填（為了下游後端授權對齊）

## Validation（lint）

### 自動檢查

`npm run lint:design-spec` 跑 [tools/lint-design-spec.mjs](tools/lint-design-spec.mjs)，檢查每個 `design/sections/<id>/`：

- [ ] `visual/default.png` 存在
- [ ] `visual/measurements.md` 存在且非空
- [ ] `behavior/interactions.md` 存在；為合法 markdown table；每條 row 引用的 `visual/states/*.png` 都存在；無 `TBD` / `待補` / `???`
- [ ] `behavior/flow.md` 存在且非空
- [ ] `data/contract.md` 存在且非空；含 `Source endpoints` / `Edge cases` / `Permissions` 三個 section
- [ ] `visual/states/*.png` 都被 interactions.md 或 contract.md 引用（孤兒截圖警告）

### CI

```yaml
# .github/workflows/design-spec-lint.yml
name: Design Spec Lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: node spec/10-ux-design/tools/lint-design-spec.mjs design/sections
```

PR 紅 = 規格不全，無法進 Stage 3。

## E2E codegen

`npm run codegen:e2e` 跑 [tools/codegen-e2e.mjs](tools/codegen-e2e.mjs)，每個 section 的 `interactions.md` 自動產一份 Playwright spec。產出的 test 落到 `tests/e2e/<section>.spec.ts`。

Codegen 規則：
- 一條 row → 一個 `test()`
- Selector 翻譯：`header button "X"` → `page.locator("header").getByRole("button", { name: "X" })`
- Action 翻譯：見 row "Action" 欄詞彙
- Result 斷言：
  - `navigate to /x` → `await expect(page).toHaveURL("/x")`
  - `bg → neutral-50` → 對應 state 截圖 pixel diff
  - `toast appears` → `await expect(page.getByRole("status")).toBeVisible()`

人工可後續微調，但**第一版自動產生**。

## 對 AI 生成行為的影響

任何 UI 任務：

- 動工前 hard-stop 確認三份 spec 都存在；缺一即拒，回報缺哪幾份
- 互動清單外的行為不准實作（避免 AI 自由發揮）
- data/contract.md 列為 "(none)" 的 mutation **不准做**
- PR 描述列「Assumed defaults」清單（spec 沒寫但實作時做出的判斷）
