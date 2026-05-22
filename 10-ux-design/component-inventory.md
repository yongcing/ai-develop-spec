# 元件清單

> AI 在生成 UI 前必須先查此清單，優先使用既有元件；缺項才新建並回填本表。
>
> 來源：各專案的 prototype（存於 project repo 的 `design/raw/`）+ 後續實作補完。
> 實作位置：對應專案 repo 的 `src/components/ui/`（基於 Radix primitives + Tailwind 自建）。

## 基礎元件

| 元件 | Radix primitive | 變體 / 狀態 | 備註 |
|------|-----------------|------------|------|
| Button | — | primary / secondary / ghost / danger；default / hover / active / disabled / loading | 對齊 token `color.brand.primary` |
| Input | — | default / focus / error / disabled | 含 label + helper + error message |
| Checkbox | `@radix-ui/react-checkbox` | default / checked / indeterminate / disabled | |
| Select | `@radix-ui/react-select` | default / open / disabled | |
| Badge | — | success / warning / error / info / neutral | 顯示狀態（合約狀態、審核中…） |
| Avatar | `@radix-ui/react-avatar` | with image / initials fallback | |
| Spinner | — | sm / md | loading 用 |
| Skeleton | — | text / card / table-row | >200ms loading 顯示 |

## 版面 / 容器

| 元件 | Radix primitive | 用途 |
|------|-----------------|------|
| Card | — | 統計卡、清單項目容器，`shadow.sm` + `radius.lg` |
| Sidebar | — | 左側固定導覽列（12 個區段） |
| Topbar | — | 頂部工具列：搜尋、使用者選單 |
| Tabs | `@radix-ui/react-tabs` | 詳情頁分頁（合約詳情、查詢結果…） |
| Dialog (Modal) | `@radix-ui/react-dialog` | 編輯、確認、刪除 |
| DropdownMenu | `@radix-ui/react-dropdown-menu` | row actions、使用者選單 |
| Toast | `@radix-ui/react-toast` | 操作結果通知 |

## 資料展示

| 元件 | 變體 / 狀態 | 備註 |
|------|------------|------|
| DataTable | empty / loading / error / paginated | 欄位可組態，支援 sort / filter |
| StatCard | numeric / delta | Overview 用 |
| EmptyState | with CTA | 規範要求必有引導 CTA |
| ErrorState | with retry | 規範要求必有重試機制 |

## 表單複合

| 元件 | 備註 |
|------|------|
| FormField | label + control + helper + error，由 RHF + Zod 驅動 |
| FormSection | 多區塊表單分組（合約建立流程） |

## 領域特化（domain components）

> 屬於 feature 層，不放在 `components/ui/`，而在各 feature module 內。列在這裡只是讓 AI 知道存在。

| 元件 | 所屬 feature | 備註 |
|------|-------------|------|
| ContractStatusBadge | contracts | 包裝 Badge，對應合約狀態列舉 |
| TemplatePicker | templates | 模板選擇 dialog |
| PartySelector | directory | counterparty 多選 |
| QueryBuilder | queries | 非平凡，需單獨設計 |

## 禁止自製清單

下列需求**必須**使用既有元件，不得自行 reinvent：

- 任何 a11y 互動元件（dialog / dropdown / popover / tooltip / tabs / select / checkbox / radio）→ 必用對應 Radix primitive
- 表格 → 必用 DataTable
- 表單欄位 → 必用 FormField（背後 RHF + Zod）

## 待補（標記實作優先順序）

實作專案 repo 時依下列順序補齊：

1. **P0**（首版必備）：Button、Input、Card、Sidebar、Topbar、Badge、DataTable、Skeleton、EmptyState、ErrorState、Dialog、FormField
2. **P1**（功能完整）：Tabs、DropdownMenu、Select、Checkbox、Toast、StatCard
3. **P2**（進階）：QueryBuilder、TemplatePicker、PartySelector
