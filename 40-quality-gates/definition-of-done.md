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

## 後端（共通）

- [ ] 新 endpoint 有 OpenAPI 註解（Java: `@Operation` / `@ApiResponse`；Python: `summary` / `response_model` / `responses`）
- [ ] 新 endpoint 有 integration test
- [ ] 錯誤回應符合 Problem Details (RFC 7807) 格式
- [ ] Auth 預設 deny，公開 endpoint 明確列舉
- [ ] DB schema 變更有對應 migration（JPA → Flyway；Mongo → Mongock；SQLAlchemy → Alembic）

### Java component 額外

- [ ] `./mvnw verify` 全綠（含 ArchUnit）
- [ ] 新 package 加入 ArchUnit 規則
- [ ] Spring Modulith `ApplicationModules.of(...).verify()` 過

### Python component 額外

- [ ] `uv run ruff check && uv run ruff format --check` 過
- [ ] `uv run mypy --strict src/` 過
- [ ] `uv run lint-imports` 過（依賴方向）
- [ ] `uv run pytest --cov=src --cov-fail-under=70` 過
- [ ] 跨服務呼叫（同步 / 非同步）走 [/30-backend/security-baseline.md](../30-backend/security-baseline.md) 規定的認證

## 架構/規格變更

- [ ] 已建立或更新 ADR
- [ ] 已說明對 AI 生成行為的影響
- [ ] 已通知受影響團隊
