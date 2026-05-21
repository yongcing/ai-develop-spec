# ADR-0002: Query Builder 技術選型

- 狀態：Accepted
- 日期：2026-05-21
- 決策者：yongcing

## 背景

`Covenant Data Platform` prototype 含 `Queries` / `New Query` 兩個區段，給非工程使用者（分析師、法務、營運）自助查詢合約／對手方／模板／文件資料。

### 真實需求剖析（非 BI）

- 資料量：合約是「業務交易資料」，量級為千–百萬筆，**不是 fact table 億筆級別**。
- 主要操作：**filter + sort + 欄位選擇 + pagination**，偶爾 group-by count。不需要 OLAP cube、不需要時序、不需要 join 任意維度。
- 權限：**owner-scoped + role-based 行級權限**。同一個 query 不同人跑出不同結果集，且查不到的資料連 schema 都不能露。
- UX：prototype 是 Apple HIG 風格的應用，不是 BI dashboard。Query 結果以表格呈現，不需要圖表。
- 整合：必須走 REST + RTK Query（[20-frontend/tech-stack.md](../../20-frontend/tech-stack.md)）+ JWT/OIDC（[30-backend/tech-stack.md](../../30-backend/tech-stack.md)）。

### 約束

- 技術棧釘死（Spring Boot 3.3 / Next.js 16 / REST / RTK Query / Radix + Tailwind 自建）
- K8s 自架，盡量不新增 service
- 業務邏輯與權限規則必須留在 Spring 模組裡（Modulith 邊界）

## 考慮過的選項

| # | 方案 | Fit | Setup | 維運成本 | 權限模型 |
|---|------|-----|-------|---------|---------|
| 1 | **react-querybuilder + RSQL → JPA Specifications** | 5/5 | 低（1–2 週） | 無新增 service | 完全在 Spring，原生 `@PreAuthorize` + Specification |
| 2 | Cube.dev（OSS, Apache 2.0） | 2/5 | 中（2–3 週） | +1 service +1 connection pool +schema 同步 | 需配 JWT claims，行級權限需 Cube 端再寫一份 |
| 3 | Hasura GraphQL Engine CE | 1/5 | 中 | +1 service，且必須與 REST 並存 | 行級權限規則寫在 Hasura metadata，與 Spring 業務規則雙寫 |
| 4 | Metabase / Superset 嵌入 | 1/5 | 中 | +1 service，UI 風格與 prototype 衝突 | iframe SSO，行級權限弱 |
| 5 | Spring for GraphQL + persisted queries | 2/5 | 中 | 無新增 service | 同 Spring，但前端要雙協定（REST + GraphQL）違反 stack |
| 6 | PostgREST | 1/5 | 低 | +1 service，業務邏輯被掏空 | DB row-level security，與 Spring 重複 |

### 各方案 killer pros / cons

**1. react-querybuilder + RSQL → JPA Specifications**
- ✅ 不新增任何 service / 連線
- ✅ 權限規則只寫一次（Specification 加上 owner / role filter）
- ✅ React 元件成熟，社群活躍，可主題化貼合 Tailwind
- ✅ RSQL 已有 [perplexhub/rsql-jpa-specification](https://github.com/perplexhub/rsql-jpa-specification) 可直接用
- ⚠️ 欄位必須白名單化避免亂查（必須實作 field whitelist + 型別校驗）
- ⚠️ 群組聚合（group-by）需要額外開放 endpoint，不是 builder 自動生

**2. Cube.dev**
- ✅ 真正需要 cube/aggregation 時很強
- ❌ 我們用不到它最大價值；徒增一份 schema（cube 定義）要同步
- ❌ 權限要在 Cube `security_context` 重寫一份 → 業務規則雙寫

**3. Hasura**
- ✅ 開發體驗極快
- ❌ 要前端走 GraphQL，違反 tech-stack 的 REST + RTK Query
- ❌ 權限規則離開 Spring → Modulith 邊界瓦解

**4. Metabase / Superset**
- ❌ 視覺風格無法配 Apple HIG prototype
- ❌ 行級權限與 SSO 整合脆弱

**5/6**：詳見上表，皆破壞「Spring 擁有業務邏輯」原則。

## 決定

採用 **方案 1：react-querybuilder（前端） + RSQL → JPA Specifications（後端）**。

### 實作架構

```
┌─────────────────────────────────────────┐
│ Next.js (features/queries)              │
│  ├─ react-querybuilder UI（自製主題）   │
│  └─ Serialize → RSQL string             │
└──────────────┬──────────────────────────┘
               │ POST /api/v1/queries/run
               │ { entity, filter (RSQL), fields[], sort, page }
               ▼
┌─────────────────────────────────────────┐
│ Spring Boot (queries module)            │
│  ├─ FieldWhitelistRegistry              │
│  │    （per-entity 開放欄位 + 型別）    │
│  ├─ RSQL → JPA Specification            │
│  │    （perplexhub/rsql-jpa-spec）      │
│  ├─ + owner/role Specification          │
│  │    （AND 進來，行級權限）            │
│  └─ Pageable + 動態 select projection   │
└──────────────┬──────────────────────────┘
               ▼
        PostgreSQL（既有資料）
```

### 已存查詢（Saved Query）

- Entity：`SavedQuery { id, ownerId, name, entity, rsqlFilter, fields[], sort, createdAt }`
- 不是動態 DSL，**只存使用者已經組好的 builder 狀態 + 序列化結果**
- 跑時與一次性 query 走同一個 endpoint

### 安全護欄（hard rules）

1. 每個可查的 entity 都要實作 `QueryableEntityConfig`：白名單欄位 + 允許的 operator + 是否可排序 / 投影
2. RSQL parser 在進入 Specification 前必須先過 whitelist 驗證，否則一律 400
3. 行級權限 Specification 由各模組提供，`queries` 模組不知道規則內容，只負責 `and()` 進去
4. 永遠走 `Pageable`，禁止無 limit 查詢
5. 預設 page size 50，最大 200

## 後果

### 正面

- 完全留在規範內：REST、RTK Query、Spring Modulith、JWT、單一 service
- 權限規則單一來源
- 工時估算：**8–14h**（原評估表 Query Builder 自建 30–50h），因為 RSQL parser 與 react-querybuilder 都是現成的；節省最大來源是「不做 DSL 設計」
- 未來若真的需要分析能力，再加 Cube.dev 旁路，不影響既有 API

### 負面 / 取捨

- 跨 entity join 採「白名單巢狀路徑」實作（見下方「跨 entity join 規則」），不支援使用者自由 join 任意維度；真 BI 維度組合須走 ADR 升級
- group-by 聚合不是 builder 內建，需開另一條 `/aggregate` endpoint（後續再做，MVP 不含）
- 白名單必須隨 schema 演進維護；schema 漂移會讓 query 壞掉 → ArchUnit 加測試確保 entity 改欄位時 whitelist 同步

### 對 AI 生成行為的影響

當任務涉及「查詢／搜尋／篩選列表」時：

1. 後端：必須走 RSQL → Specification pattern；禁止接受任意 JPQL/SQL 字串
2. 後端：必須註冊 `QueryableEntityConfig` 白名單，不可接受未註冊欄位
3. 後端：行級權限 Specification 強制 AND，AI 生成的 endpoint 必須包含此步驟
4. 前端：列表頁的 filter UI 一律用 react-querybuilder 包裝（不要每個 feature 各自做 filter 元件）
5. 前端：透過 RTK Query mutation 呼叫 `/queries/run`，response 走標準 Page 結構

## 跨 entity join 規則（已決議）

支援「合約 join 對手方 join 模板」這類查詢，**但**僅限白名單明示的關聯路徑，不允許使用者自由 join。

### 實作

- RSQL 與 react-querybuilder 都支援以 dot 語法表達巢狀關聯：
  - 範例：在 `Contract` entity 上查 `counterparty.name=='Acme';template.version=='v2'`
  - `rsql-jpa-specification` 會自動產生對應的 JPA `Join`
- 每個 `QueryableEntityConfig` 需聲明：
  - `allowedNestedPaths`：哪些巢狀路徑被允許（e.g. `counterparty.name`、`template.version`），未列入 = 400
  - `joinType`：預設 `INNER`；某些路徑可指定 `LEFT`（如選填關聯）
  - 巢狀路徑的權限：被 join 進來的 entity 仍要套自己的行級權限 Specification（**多模組 Specification 由 `queries` 模組組合**）
- 深度限制：**最多 2 層**（`a.b.c` 為上限），避免使用者組出爆炸查詢
- N+1 防護：用到的巢狀路徑必須產生 `JOIN FETCH`（or `@EntityGraph`），ArchUnit 測試掃 SQL count

### 前端

react-querybuilder 的 fields 清單要支援 grouped fields（用 `optgroup` 分組），UX 上呈現為「Contract 欄位 / Counterparty 欄位 / Template 欄位」。

## Overview dashboard 規則（已決議）

Dashboard 的 stat card / 統計數字**不走 query builder**：

- 每個 module 自行提供 `/api/v1/<module>/stats` endpoint
- 回傳 DTO 為固定 schema（非動態），方便 cache 與 OpenAPI codegen
- 後端可加 `@Cacheable`（Redis）降低 DB 壓力，TTL 由 module owner 決定
- AI 在生成 dashboard 時：直接呼叫各 module stats endpoint，**禁止**呼叫 `/queries/run` 來算統計

## 仍待釐清（不阻塞 MVP）

3. **匯出**：Query 結果需要 CSV / Excel 匯出嗎？若需要，建議後端開 `/queries/export` 串流回 CSV（避免前端組大檔）
4. **Saved Query 分享**：使用者可以分享自己的 saved query 給別人嗎？影響權限模型（owner-scoped → shared-with-roles）
5. **是否要支援 full-text search？** Postgres 有 tsvector，要不要在白名單裡多一個 `_search` 偽欄位串接 tsquery？

---

## 參考

- [perplexhub/rsql-jpa-specification](https://github.com/perplexhub/rsql-jpa-specification)
- [Baeldung - REST Query Language with Spring Data JPA Specifications](https://www.baeldung.com/rest-api-search-language-spring-data-specifications)
- [react-querybuilder](https://react-querybuilder.js.org/)
- [Cube.dev licensing](https://cube.dev/docs/product/administration/distribution)（保留作未來升級時參考）
