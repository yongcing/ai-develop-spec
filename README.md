# AI Dev Standards

跨角色協作的 AI 開發規格中心。所有 AI 生成程式碼的規則、技術選型、架構決策都集中在此。

## 角色入口

| 角色 | 起點文件 |
|------|---------|
| 架構師 | [00-architecture/](00-architecture/) |
| UX | [10-ux-design/](10-ux-design/) |
| 前端 | [20-frontend/](20-frontend/) |
| 後端 | [30-backend/](30-backend/) |
| 跨領域品質 | [40-quality-gates/](40-quality-gates/) |

## 給 AI 的入口

[CLAUDE.md](CLAUDE.md) 是 AI 在生成程式碼前**必讀**的路標文件。

## 使用方式

1. 各專案 repo 將本 repo 作為 git submodule 引入並釘版本
2. AI 在生成程式碼前讀取對應領域的 `tech-stack.md` 與 `ai-generation-rules.md`
3. 規格變更走 PR，由 CODEOWNERS 對應領域負責人 review

## 目錄結構

```
00-architecture/   架構決策、DB 選型、API 契約、ADR
10-ux-design/      設計原則、design tokens、prototype
20-frontend/       前端 tech stack 與規範
30-backend/        後端 tech stack 與規範
40-quality-gates/  DoD、review checklist、PR template
prompts/           AI 生成程式碼用的 prompt 模板
```
