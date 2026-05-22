# AI Dev Standards

跨角色協作的 AI 開發規格中心。所有 AI 生成程式碼的規則、技術選型、架構決策都集中在此。

## 角色入口

| 角色 | 起點文件 |
|------|---------|
| 架構師 | [00-architecture/](00-architecture/) |
| UX | [10-ux-design/](10-ux-design/) |
| 前端 | [20-frontend/](20-frontend/) |
| 後端（跨語言契約） | [30-backend/](30-backend/) |
| 後端（Java） | [30-backend-java/](30-backend-java/) |
| 後端（Python） | [30-backend-python/](30-backend-python/) |
| 跨領域品質 | [40-quality-gates/](40-quality-gates/) |

## 給 AI 的入口

[CLAUDE.md](CLAUDE.md) 是 AI 在生成程式碼前**必讀**的路標文件。

## 使用方式

1. 各專案 repo 將本 repo 作為 git submodule 引入並釘版本
   - **Mount path 釘定為 `spec/`**：`git submodule add https://github.com/yongcing/ai-develop-spec.git spec`
   - 所有 CI 腳本、`lint:design-spec` 呼叫、文件交叉連結都假設此路徑
2. AI 在生成程式碼前讀取 `spec/CLAUDE.md`（路由表）→ 對應任務的 `prompts/<task>.md` → prompt 列出所有必讀 spec
3. 規格變更走 PR，由 CODEOWNERS 對應領域負責人 review

## 目錄結構

```
00-architecture/   架構決策、DB 選型、API 契約、ADR
10-ux-design/      設計原則、design tokens、prototype workflow
20-frontend/       前端 tech stack 與規範
30-backend/        後端跨語言共享（contract、error、auth、語言決策）
30-backend-java/   Java component 規範（Spring Boot / Modulith）
30-backend-python/ Python component 規範（FastAPI / Pydantic / uv）
40-quality-gates/  DoD、review checklist、PR template
prompts/           AI 生成程式碼用的 prompt 模板
audit/             歷次規格審查報告
```
