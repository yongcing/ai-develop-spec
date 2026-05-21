# Definition of Done

任何 PR 合併前必須全部通過。

## 通用

- [ ] 通過所有 CI checks（lint、type、test、build）
- [ ] 程式碼遵守對應領域的 `ai-generation-rules.md`
- [ ] 沒有引入未經 ADR 核可的新依賴
- [ ] 沒有 commented-out code
- [ ] 沒有 TODO 未連結到 issue

## 前端

- [ ] `pnpm lint && pnpm typecheck && pnpm test` 全綠
- [ ] Loading / error / empty 三狀態都有處理
- [ ] a11y 基本檢查（鍵盤可達、語意化 HTML）
- [ ] Responsive 在主要斷點檢查過

## 後端

- [ ] `./gradlew check` 全綠（含 ArchUnit）
- [ ] 新 endpoint 有 OpenAPI 註解
- [ ] 新 endpoint 有 integration test
- [ ] DB 變更有 Flyway migration
- [ ] 錯誤回應符合 Problem Details 格式

## 架構/規格變更

- [ ] 已建立或更新 ADR
- [ ] 已說明對 AI 生成行為的影響
- [ ] 已通知受影響團隊
