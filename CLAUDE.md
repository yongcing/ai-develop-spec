# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本 repo 是「規格中心」，不存放任何可執行程式碼。實際的程式碼存在於各專案 repo，這些 repo 透過 git submodule 引用本 repo 作為其 AI 開發規範來源。

**Submodule mount path 釘定為 `spec/`**。所有 CI 腳本與 lint 工具呼叫路徑都假設此位置。Project repo 加 submodule 時：`git submodule add <url> spec`。

## AI 任務路由

在生成任何程式碼前，依任務類型讀取對應規格：

**Routing 規則**：每個 prompt 檔（`prompts/*.md`）已彙整該類型任務所有必讀規格。AI 接到任務應**直接讀對應 prompt**，prompt 會把你帶到所有必讀文件。

| 任務類型 | 起點 prompt | 重要前置 |
|---------|------------|---------|
| **任何指令執行前** | — | [00-architecture/local-toolchain.md](00-architecture/local-toolchain.md)（先確認本機 Node / JDK / Python 版本對齊規格）|
| **任何 UI 任務（畫面、互動、表單、列表…）** | [prompts/frontend-feature.md](prompts/frontend-feature.md) | 動工前 hard-stop：依 [00-architecture/design-to-code-workflow.md](00-architecture/design-to-code-workflow.md) 確認 `design/sections/<section>/{visual,behavior,data}/` 三份 spec 存在 |
| 前端元件 / 頁面 | [prompts/frontend-feature.md](prompts/frontend-feature.md) | |
| 後端 API / 服務（**Java component**） | [prompts/backend-java-endpoint.md](prompts/backend-java-endpoint.md) | 確認 component README 標 `Language: Java` |
| 後端 API / 服務（**Python component**） | [prompts/backend-python-endpoint.md](prompts/backend-python-endpoint.md) | 確認 component README 標 `Language: Python` |
| Component 語言未標 / 不知該選哪個 | — | [30-backend/tech-decision.md](30-backend/tech-decision.md)；hard-stop 由架構師決定 |
| 全端 CRUD | [prompts/full-stack-crud.md](prompts/full-stack-crud.md) | |
| 新增資料表 / DB schema | 對應語言 backend prompt + [00-architecture/database-selection.md](00-architecture/database-selection.md) | 建立新 ADR |
| 跨服務的架構變更 | — | [00-architecture/system-architecture.md](00-architecture/system-architecture.md) + 建立新 ADR |

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
