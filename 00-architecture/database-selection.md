# 資料庫選型規範

> **重要：本系統不設「預設主 DB」。** 每個 Modulith 模組的儲存方案由架構師依下方矩陣決定。AI 在設計新功能時，若儲存方案未指定，**必須停下並請架構師決策**，禁止自行挑選。

## 可選池

| DB | 角色定位 | Migration 工具 |
|----|---------|---------------|
| PostgreSQL 17 | 關聯型主力。需要 JSONB、全文檢索、進階索引、CTE、複雜查詢時優先 | Flyway |
| MariaDB | 關聯型替代。現有系統相容、營運熟悉度高時使用 | Flyway |
| MongoDB | 文件型。彈性 schema、append-only 記錄、深度巢狀文件 | Mongock |
| Redis 7 | **非主要儲存**。快取、session、rate limit、分散式鎖（Shedlock） | 不適用 |

## 選型決策矩陣

| 情境 | 建議 |
|------|------|
| 強一致、需要 ACID transaction、表間 join 多 | PG 或 MariaDB |
| 需要 JSONB、全文檢索、地理查詢 | PG |
| 與既有 MariaDB 系統整合 | MariaDB |
| Schema 經常變動、欄位差異大、文件型資料 | MongoDB |
| 寫多讀少的事件 / audit log | MongoDB（搭配 TTL index） |
| 熱點查詢、計數器、Session、Rate limit | Redis（作為快取層，不取代主儲存） |

## 不可違反的規則

1. **新增 DB 種類**（例如要引入 ClickHouse、Elasticsearch）必須先提 ADR
2. **同一模組原則上只用一個主要 DB**，避免分散式 transaction
3. **跨模組不直接共用 schema**，必須透過 module api 或 events
4. **Schema 變更必須產生 migration**（Flyway 或 Mongock），禁止直接改線上 DB
5. **Repository 不可跨模組**：模組 A 不能注入模組 B 的 Repository

## Migration 策略

### Flyway（PG / MariaDB）
- 命名：`V<yyyyMMddHHmm>__<feature>_<desc>.sql`，例如 `V202605211430__orders_add_status_index.sql`
- Repeatable migration（views、procedures）：`R__<desc>.sql`
- 線上變更：避免長時間鎖表，大表加 index 用 `CONCURRENTLY`（PG）

### Mongock
- 以 Java changeunit 表達變更
- 命名：`<seqXXX>_<desc>`，例如 `seq001_create_event_log_index`
- 同樣禁止手動改線上 DB

## ADR 觸發點

下列情境必須建立 ADR：
- 引入可選池外的新 DB
- 改變既有模組的主要 DB
- 跨模組共享儲存的特殊需求
- 引入跨 DB 的分散式 transaction
