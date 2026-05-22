# Definition of Done

任何 PR 合併前必須全部通過。

## 通用

- [ ] 通過所有 CI checks（lint、type、test、build）
- [ ] 程式碼遵守對應領域的 `ai-generation-rules.md`
- [ ] 沒有引入未經 ADR 核可的新依賴
- [ ] 沒有 commented-out code
- [ ] 沒有 TODO 未連結到 issue

## 前端

- [ ] `npm run lint && npm run typecheck && npm test` 全綠
- [ ] Loading / error / empty 三狀態都有處理
- [ ] a11y 基本檢查（鍵盤可達、語意化 HTML）
- [ ] Responsive 在主要斷點檢查過
- [ ] **若實作對應 prototype 的 section**：PR 描述附「prototype vs 實作」並排截圖；視覺差異符合 [10-ux-design/visual-parity-workflow.md](../10-ux-design/visual-parity-workflow.md) 規範（顏色全部從 tokens、間距與 measurements.md 差 < 8px、無缺失視覺元素）
- [ ] **若新建 UI section**：對應 `design/sections/<section>/visual/default.png` 與 `measurements.md`、`behavior/interactions.md`、`data/contract.md` 必須存在（`lint:design-spec` 通過）；Playwright pixel diff < 2%

## 後端

- [ ] `./mvnw verify` 全綠（含 ArchUnit）
- [ ] 新 endpoint 有 OpenAPI 註解
- [ ] 新 endpoint 有 integration test
- [ ] DB 變更有 Flyway migration
- [ ] 錯誤回應符合 Problem Details 格式

## 架構/規格變更

- [ ] 已建立或更新 ADR
- [ ] 已說明對 AI 生成行為的影響
- [ ] 已通知受影響團隊
