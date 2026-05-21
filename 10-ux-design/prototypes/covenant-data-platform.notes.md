# Covenant Data Platform — Prototype Notes

> 從 `V0_Covenant Data Platform.html`（v0 / Claude Design 匯出的 SPA bundle）抽出的結構摘要，供 AI 在實作專案 repo 時對齊。

## 應用概述

合約／契約資料平台：管理合約、模板、簽署流程、對手方、文件與資料查詢。
登入後使用，使用者依角色檢視自身相關合約與全系統合約。

## 導覽結構（左側 Sidebar，12 區段）

| 區段 | 路由建議 | 說明 |
|------|---------|------|
| Overview | `/` | 儀表板，統計卡片 + 近期活動 |
| My Contracts | `/contracts/mine` | 當前使用者擁有的合約 |
| All Contracts | `/contracts` | 全系統合約清單（需權限） |
| Register | `/contracts/register` | 合約註冊／新增流程（多步表單） |
| Drafts | `/contracts/drafts` | 草稿中合約 |
| Review Queue | `/contracts/review` | 等待審核／簽署的合約 |
| Templates | `/templates` | 合約模板庫 |
| Storage | `/storage` | 文件儲存／檔案瀏覽 |
| Directory | `/directory` | 對手方／聯絡人目錄 |
| Queries | `/queries` | 已存查詢清單 |
| New Query | `/queries/new` | 新建查詢（Query Builder） |
| Tokens | `/settings/tokens` | API token 管理 |

## 領域實體（initial schema 草稿）

> 屬規格初版，正式入庫前須走 [/00-architecture/database-selection.md](../../00-architecture/database-selection.md) 並建 ADR。

- **Contract**：id, name, ownerId, counterpartyIds[], templateId, status (`draft|review|signed|expired|terminated`), createdAt, updatedAt, effectiveDate, expiryDate
- **Template**：id, name, version, body (含變數佔位), variables[], ownerId
- **Party / Counterparty**：id, name, type (`individual|organization`), email, address, contacts[]
- **Document**：id, contractId, filename, mimeType, size, storageKey, uploadedBy, uploadedAt
- **Query**：id, name, ownerId, definition (DSL or saved params), lastRunAt
- **User**：id, email, displayName, roles[]
- **ApiToken**：id, userId, name, prefix, hashedSecret, scopes[], createdAt, lastUsedAt, expiresAt

## 關鍵互動 / 非平凡功能

1. **Multi-step 合約建立**：Register 是多步表單（選模板 → 填變數 → 指定對手方 → 上傳文件 → 送出）
2. **Template engine**：模板含變數，建立合約時要做變數替換預覽
3. **Review / Signature workflow**：Review Queue 隱含簽署或核可流程，需權限 + 狀態機
4. **Query Builder**：自訂查詢 UI（非平凡，建議獨立 ADR 處理 DSL 與後端實作）
5. **Document upload**：Storage 區塊需檔案上傳，後端用 S3-compatible（見 [/30-backend/tech-stack.md](../../30-backend/tech-stack.md)）

## 視覺風格

- macOS / Apple HIG 風：白底淺灰背景（`#f5f5f7`）、System font、藍色主色（`#0071e3`）、低飽和語意色
- 圓角偏大（8–14px）、陰影輕、留白多
- Light mode only（prototype 未提供 dark mode）

## 與規範對應

- 設計 tokens：[../design-tokens.json](../design-tokens.json) 已更新為上述配色
- 元件清單：[../component-inventory.md](../component-inventory.md) 已列出對應 Radix 元件
- 前端實作流程：照 [/prompts/frontend-feature.md](../../prompts/frontend-feature.md) 一個 feature 一個 feature 做
- 全端 CRUD：照 [/prompts/full-stack-crud.md](../../prompts/full-stack-crud.md)

## 待 UX / PM 確認

- 角色與權限矩陣（誰能看 All Contracts、誰能進 Review Queue）
- 合約狀態機完整轉換規則
- Query Builder 的 DSL 設計（自訂 vs. 既有方案如 GraphQL/Cube）
- 通知機制（Review Queue 變化時推播給誰、何種管道）
