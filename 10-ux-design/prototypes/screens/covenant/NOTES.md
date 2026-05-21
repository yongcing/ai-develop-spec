# Covenant Data Platform — Prototype Notes

> Based on screens captured 2026-05-22 from `V0_Covenant Data Platform.html`.

## Domain (corrected)

This is a **data contract platform**, not a legal contracts CRM. The product:

- Data **providers** declare datasets with: schema, domain, format, size estimate, freshness SLA, TTL/retention, sample data
- Platform **owners** review contracts, assign storage solutions (BigQuery, PostgreSQL, Elasticsearch…), monitor capacity
- Data **consumers** browse approved contracts, build query services (saved parameterised queries → HTTPS endpoints), request access tokens

## Three roles (login screen)

After clicking 切換身分 the login screen shows:

1. **資料提供者 Provider** — "登錄資料合約、上傳 sample、自動解析 schema"
2. **平台管理者 Owner** — "審核合約、提供 storage、維護目錄"
3. **資料使用者 Consumer** — "搜尋合約、建立 query service、申請 token"

Initial load lands on Provider role (Mei-Lin Cheng / Commerce Platform).

## Per-role sidebar

### Provider
- 總覽 (Overview)
- 我的合約 (My Contracts) [badge: count]
- 註冊新合約 (Register New Contract)
- 草稿 (Drafts) [badge: count]
- Resources → 文件 (Docs), What's new

### Owner (id: Devon Walker / Data Platform)
- 總覽 (Overview)
- 審核佇列 (Review Queue) [badge]
- 所有合約 (All Contracts)
- Storage 設定
- 合約樣板 (Contract Templates)
- Resources → 文件, What's new

### Consumer (id: Sara Lindgren / Growth)
- 瀏覽合約 (Browse Contracts)
- Query services [badge]
- Access tokens [badge]
- Resources → 文件, What's new

## Visual measurements (1440x900 viewport)

### Global
- Page bg: `#f5f5f7` (neutral-50)
- Surface bg: `#ffffff`
- Text: `#1d1d1f` (neutral-950)
- Muted text: `#666666` (neutral-700)
- Font: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
- Monospace: ui-monospace, "SF Mono", Menlo, Consolas, monospace — used for IDs (`orders.checkout_events`, `qsv-19`)

### Primary action color — IMPORTANT CORRECTION
Primary CTA button is **dark forest green**, not Apple blue:
- `#0f3d2e` background, white text, subtle hover lift
- The Apple blue `#0071e3` is **not** used in the prototype CTAs — it was in the V0 default thumbnail SVG only.
- Brand mark "C" tile: dark green/teal (`#0a3a2a`-ish) gradient

### Sidebar
- Width: `224px`
- Padding: `20px` outer
- Brand block: avatar tile 32×32 rounded-md, "Covenant" 16px semibold + "· Provider" 13px neutral-700 inline below
- Section labels ("目前身分", "RESOURCES"): 11px uppercase tracking-wide neutral-700, mb 12px
- Nav item: height `32px`, padding x `12px`, gap `10px`, font 14px regular
- Nav icon: 16px, neutral-700
- Active state: text underlined `text-decoration: underline`, color neutral-950 (no bg highlight, no fill — just an underline + slight weight bump)
- Badge: 18px circle, dark-green `#0f3d2e` bg, white 11px bold, right-aligned
- Bottom user block: 48px tall, divider above, avatar 32px circle in accent color, name + sub label, "切換身分" small text-button on right

### Topbar
- Height: `56px`
- Border-bottom: 1px neutral-100
- Left: breadcrumb "提供者 / 總覽" — first segment muted, separator " / " muted, current bold neutral-950, 14px
- Right group, gap 12px:
  - Search input: 280px wide, h 36, rounded-md, bg neutral-50, magnifier icon left, "⌘K" kbd hint right inside
  - "Cards" toggle button: 14px text + icon, ghost
  - Locale "中": 14px, globe icon

### Section header (within main)
- Eyebrow label "PROVIDER WORKSPACE" / "PLATFORM WORKSPACE" / "CONSUMER WORKSPACE" / "CATALOGUE": 11px uppercase tracking-wide neutral-700, mb 6px
- Title: **40px / 700 / line-height 1.1** — much larger than typical h1. Tight.
- Subtitle: 15px neutral-700, max-width ~640px, line-height 1.5, mb 24px
- Right-aligned action row: secondary outline + primary filled, gap 8px, same vertical line as title

### Stat card (Provider Overview)
- Container: borderless white card, `padding: 20px 24px`, radius `lg` (~10px), shadow `sm`
- Label: 11px uppercase tracking-wide neutral-700
- Value: 32px / 600
- Delta or sub-text: 13px below — `+1 this month`, `avg 1.4d turnaround`, `last edit 3h ago`. Delta positive: success green.
- Grid: 4 columns desktop, 16px gap

### Owner stat card differs slightly
Same proportions, label different (PENDING REVIEW, ACTIVE CONTRACTS, STORAGE SOLUTIONS, TOKEN REQUESTS).

### Data table
- Container: white, radius `lg`, shadow `sm`, padding 0
- Row height (body): `64px` (taller than typical because of two-line cells)
- Row main text: 15px / 500
- Row sub text (mono ID below): 13px monospace neutral-700, margin-top 2px
- Header: `48px` tall, neutral-50 background NOT used — header is white with a 1px neutral-100 bottom border. Header text: 11px uppercase tracking-wide neutral-700.
- Cell padding: `20px 16px`
- Divider between rows: 1px neutral-100
- Row hover: subtle neutral-50
- Right edge: each row ends with `→` icon button
- Cell variations:
  - Status: pill badge with leading dot (●)
  - Domain/Format: subtle gray pill with leading dot (●)
  - Numeric (CONSUMERS): mono 14px

### Status badges
Always `● <label>`, dot 6px circle, padding `2px 10px`, radius full, 11px font:
- `● 待審核` — orange tint bg `#fef0e0`, text `#bf5600`, dot `#e37400`
- `● 已通過` / `● approved` — green tint bg `#e3f2e8`, text `#1d6b3a`, dot `#248a3d`
- `● 草稿` — neutral bg `#f0f0f0`, text `#666`, dot `#999`
- `● Confidential` — red tint bg `#fde9e9`, text `#a91414`, dot `#e30000`
- `● Internal` — info tint bg `#e3f0f7`, text `#1a5478`, dot `#5cb0e3`

### Tag pills (Domain, Format, free tags)
Same shape as status but always neutral: bg `#f5f5f7`, text `#3a3a3c`, dot in semantic-success-ish green `#248a3d` (for domain) — basically a marker dot, not a status color.

### Tabs (e.g. All / Pending / Approved / Drafts / Rejected on My Contracts)
- Underline tab style, no background
- Tab label: 14px, neutral-700
- Active: neutral-950 + 2px bottom border (brand green `#0f3d2e`)
- Count next to label: 13px neutral-600 with subtle bg pill

### Register form (multi-step)
- Stepper at top: 5 numbered circles with labels (Identity / Properties / Schema from sample / Compliance & SLA / Reference Point)
- Active step: filled dark-green circle + bold label
- Completed: filled dark green with checkmark
- Pending: outline only
- Connecting line between circles: 1px neutral-200
- Form card on left (max-width ~720), live summary panel on right (~320px wide)
- Field row: label 14px medium, asterisk for required, input below
- Required marker: `*` in red on the right side of label, plus a small right-side helper text like "snake_case, dot-namespaced"
- Counter in textarea: bottom-right "65 / 1000"
- Live summary panel: white card, label uppercase tiny, value pairs
- Footer actions: "存成草稿" (ghost link) on left, primary "Continue →" button on right

### Cards used in Owner Overview "Storage capacity"
- Each storage row: square avatar (P / B / E) + name + meta (`24 contracts · 62% used`) + progress bar (1px tall, almost black fill)
- Layout: 2-column grid, 16px gap

### Consumer "Browse contracts" cards
- Each result is a card with title + status badge inline, monospace id below, description, tag pills row, right side owner block (avatar + team name + "N consumers" with arrow)
- Stack vertically, gap 12px

## Components to (re)build for parity

1. RolePicker page (the dark/light split login)
2. AppShell with role-aware Sidebar (24 width, underline-active, badge counts, bottom identity switcher)
3. Topbar (breadcrumb, search ⌘K, Cards toggle, locale)
4. SectionHeader (eyebrow + big title + subtitle + actions row)
5. StatCard (label/value/sub layout, no icon by default)
6. DataTable with leading-dot badges and right-arrow row indicator
7. StatusBadge / TagPill with `● label` shape
8. Tabs (underline, count pill)
9. Stepper (horizontal numbered)
10. LiveSummaryCard (right-rail sticky)
11. ContractCard (Consumer browse) and StorageCard (Owner overview)

## Tokens to correct in [../../design-tokens.json](../../design-tokens.json)

- Replace primary `#0071e3` (Apple blue) with **dark forest green `#0f3d2e`** as the action color
- Keep blue available but not as primary
- Add status palette (warn/success/danger/info tint backgrounds) as separate tokens
- Add monospace font stack token
