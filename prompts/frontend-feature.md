# Prompt：生成前端 feature

> 複製此 prompt，填入變數後給 AI。

---

你的任務是生成一個前端 feature。

## 必讀規範（依序）

1. [/CLAUDE.md](../CLAUDE.md)
2. [/20-frontend/tech-stack.md](../20-frontend/tech-stack.md)
3. [/20-frontend/ai-generation-rules.md](../20-frontend/ai-generation-rules.md)
4. [/20-frontend/coding-standards.md](../20-frontend/coding-standards.md)
5. [/10-ux-design/design-principles.md](../10-ux-design/design-principles.md)
6. [/10-ux-design/component-inventory.md](../10-ux-design/component-inventory.md)
7. [/10-ux-design/design-tokens.json](../10-ux-design/design-tokens.json)

## 需求

- Feature 名稱：<填寫>
- Section spec 路徑：<project repo 的 `design/sections/<section-id>/`，含 visual/ + behavior/ + data/>
- 使用情境：<user story>
- API 來源：<OpenAPI endpoint 或 mock 規格>
- 互動細節：<loading / error / empty 行為、optimistic update 等>

## 交付物

- Feature module 結構：`src/features/<name>/{components, hooks, api, types}`
- TanStack Query hooks 處理 server state
- Loading / error / empty 三狀態
- 元件優先用 component-inventory 既有元件
- Unit test（核心邏輯）+ component test（互動）

## 完成前自檢

對照 [/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md) 前端區塊逐項確認。
