# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本 repo 是「規格中心」，不存放任何可執行程式碼。實際的程式碼存在於各專案 repo，這些 repo 透過 git submodule 引用本 repo 作為其 AI 開發規範來源。

## AI 任務路由

在生成任何程式碼前，依任務類型讀取對應規格：

| 任務類型 | 必讀文件 |
|---------|---------|
| **任何指令執行前** | [00-architecture/local-toolchain.md](00-architecture/local-toolchain.md)（先確認本機 Node / JDK 版本對齊規格）|
| **任何 UI 任務（畫面、互動、表單、列表…）** | [00-architecture/design-to-code-workflow.md](00-architecture/design-to-code-workflow.md)（5 階段、三份 spec、雙軌驗證；缺料 hard-stop 不准擅自實作）|
| 前端元件/頁面 | [20-frontend/tech-stack.md](20-frontend/tech-stack.md) + [20-frontend/ai-generation-rules.md](20-frontend/ai-generation-rules.md) |
| 後端 API/服務 | [30-backend/tech-stack.md](30-backend/tech-stack.md) + [30-backend/ai-generation-rules.md](30-backend/ai-generation-rules.md) + [00-architecture/api-contract-rules.md](00-architecture/api-contract-rules.md) |
| 新增資料表/DB schema | [00-architecture/database-selection.md](00-architecture/database-selection.md) + 建立新 ADR |
| 跨服務的架構變更 | [00-architecture/system-architecture.md](00-architecture/system-architecture.md) + 建立新 ADR |
| UI prototype 落地 | [10-ux-design/design-principles.md](10-ux-design/design-principles.md) + [10-ux-design/design-tokens.json](10-ux-design/design-tokens.json) + [10-ux-design/component-inventory.md](10-ux-design/component-inventory.md) + [10-ux-design/visual-parity-workflow.md](10-ux-design/visual-parity-workflow.md)（**強制**：每個 UI section 動工前先確認對應 `prototypes/screens/<section>.png` + `.measurements.md` 存在）|
| 查詢／搜尋／篩選列表 | [00-architecture/adr/0002-query-builder.md](00-architecture/adr/0002-query-builder.md) |

## 硬規則（不可違反）

1. **技術選型已釘死**：不得自行替換 tech-stack.md 列出的框架或主要套件版本。若有充分理由，必須先提 ADR PR。
2. **規格優先**：規格與既有程式碼衝突時，以規格為準，回報程式碼需要調整。
3. **不確定就停下**：若任務涉及規格未涵蓋的決策（新 DB、新框架、新架構模式），必須先請使用者確認或補規格，禁止自行決定。
4. **完成定義**：任何 PR 必須通過 [40-quality-gates/definition-of-done.md](40-quality-gates/definition-of-done.md) 所有檢查項。

## 規格本身的修改規則

修改本 repo 內任何規格時：
- 必須說明對 AI 生成行為的影響
- 必須標示是否需要 regenerate 既有專案的程式碼
- 由對應領域 CODEOWNERS review
