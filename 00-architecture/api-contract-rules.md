# API 契約規範

## REST 設計

- **版本策略**：URL path `/api/v1/...`；新主版本與舊並行至少一個 release cycle
- **命名**：複數名詞 + kebab-case（`/api/v1/contract-templates/{id}`）
- **HTTP 動詞**：GET（讀）/ POST（新增 or 自訂動作）/ PUT（整體取代）/ PATCH（部分更新）/ DELETE（刪除）
- **冪等**：GET、PUT、DELETE 必須冪等；POST 不保證
- **狀態碼**：200 / 201 / 204 / 400 / 401 / 403 / 404 / 409（衝突）/ 422（語意錯誤）/ 429（rate limit）/ 5xx
- **錯誤格式**：[RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807)
  - `type` URI 模式釘定：`https://api.example.com/problems/<kebab-semantic>`（例：`/problems/not-found`、`/problems/validation`）
  - Media type：`application/problem+json`
  ```json
  {
    "type": "https://api.example.com/problems/not-found",
    "title": "Contract not found",
    "status": 404,
    "detail": "Contract id=abc123 does not exist",
    "instance": "/api/v1/contracts/abc123",
    "traceId": "..."
  }
  ```
- **分頁**：
  - Query：`page`（0-based）、`size`（預設 50、最大 100）
  - Response envelope（**跨語言一致**）：
    ```json
    {
      "content": [ /* items */ ],
      "totalElements": 137,
      "totalPages": 3,
      "number": 0,
      "size": 50
    }
    ```
  - Java 用 Spring Data `Page<T>` 自動產這個 shape；**Python** 需自寫 Pydantic `PageResponse[T]` 對齊（不可改欄位名）
- **排序**：query `sort=field,asc`，可重複（白名單欄位才允許）
- **時間**：一律 ISO-8601 UTC（`2026-05-21T10:30:00Z`），絕不傳本地時區字串
- **金額**：字串 + 幣別碼（避免 float 精度），`{"amount": "1234.56", "currency": "TWD"}`
- **欄位命名**（**跨語言契約**）：所有 wire JSON 欄位一律 **camelCase**（`traceId` / `totalElements` / `createdAt` …）。
  - Java：record / DTO 直接命名 camelCase，Jackson 預設
  - Python：Pydantic model 內部用 snake_case，**必須**透過 `Field(..., alias="<camelCase>")` + `model_config = ConfigDict(populate_by_name=True)`，序列化用 `model_dump(by_alias=True)`

## 認證 / 授權

### End-user 認證

- **協定**：OAuth2 / OIDC，IdP 由部署決定（Keycloak / Auth0 / Azure AD…）
- **Token**：JWT（簽章演算法 RS256 或 ES256；對稱 HS256 僅限本機開發）
- **傳送**：`Authorization: Bearer <jwt>`，禁止把 token 放 query string
- **過期**：access token ≤ 1h；refresh 由前端透過 IdP 自處
- **驗證**：後端依語言實作（Java: Spring Security Resource Server / Python: FastAPI dependency + `python-jose`），自動驗 signature + `iss` + `aud` + `exp`
- **Claims**：必含 `sub`（user id）、`email`、`roles`（或 `realm_access.roles`）；其餘自訂 claims 文件化

### Service-to-service 認證

- **協定**：自簽 JWT（HMAC 或 RSA）+ `aud` 指明目標服務
- **生命週期**：≤ 15 分鐘（與 [/30-backend/security-baseline.md](../30-backend/security-baseline.md) 一致）
- **儲存**：密鑰放 K8s Secret，禁止寫入 repo

### 授權

- **位置**：在 service 層方法上做授權（Java: `@PreAuthorize`；Python: FastAPI `Depends(require_role(...))` 寫在 service 函式 entry）。禁止只靠 controller / router 層的 filter
- **行級**：透過 Specification 或 query filter（owner / role），不能只靠 controller 過濾後讀全表
- **拒絕策略**：未授權 → 403；未認證 → 401

## OpenAPI

- **產生**：後端自動產 OpenAPI 3.1 spec（Java: springdoc-openapi；Python: FastAPI 內建 `/openapi.json`）
- **位置**：runtime exposes `/v3/api-docs`；build 時匯出為 `docs/openapi.json` 入 repo
- **校驗**：CI 驗 spec lint（spectral）
- **前端**：用 `@rtk-query/codegen-openapi` 從匯出的 spec 自動產生 RTK Query API；生成檔放 `src/api/generated/<service-name>/`（**一個 backend service 一個子資料夾**，多 service 場景禁止合併 spec），禁止手改
- **註解**：每個 endpoint 必須有完整 metadata：
  - Java: `@Operation(summary=…)`、`@ApiResponse(...)` 完整、DTO 有 `@Schema`
  - Python: FastAPI decorator 帶 `summary`、`response_model`、`responses={...}`；Pydantic `Field(..., description="...", examples=[...])`

## Rate limiting / Throttling

- 邊界閘道（Nginx ingress / API gateway）做粗粒度限流
- 後端 module 可加 [Resilience4j RateLimiter](https://resilience4j.readme.io/) 做細粒度
- 超出回 `429` + `Retry-After` header

## 事件（非同步契約）

- **傳輸**：NATS JetStream
- **信封**：[CloudEvents v1.0](https://cloudevents.io/) JSON
  ```json
  {
    "specversion": "1.0",
    "type": "com.example.contract.signed.v1",
    "source": "/contracts",
    "id": "uuid",
    "time": "2026-05-21T10:30:00Z",
    "datacontenttype": "application/json",
    "data": { /* domain payload */ }
  }
  ```
- **type 命名**：`com.<org>.<module>.<event>.v<n>`；版本升級就新增 type，不在舊 type 改 schema
- **payload schema**：JSON Schema 入 `docs/events/`，CI lint
- **保證**：at-least-once；consumer 必須冪等（建議用 `id` 去重）
- **訂閱命名**：`<consumer-module>.<event-type>`

## gRPC

**預設不使用。** 採用時機僅限：

1. 服務間高頻通訊且需要強型別 streaming（罕見）
2. 對接既有 gRPC-only 第三方系統

採用須走 ADR；REST 仍為對外契約。

## 對 AI 生成行為的影響

- 任何新 endpoint 必須符合上方 REST 約定；違反 lint 規則 / 命名規則由 spectral + ArchUnit 擋
- 錯誤一律拋 RFC 7807，禁止自製錯誤 JSON 結構
- 認證統一走 Bearer JWT；禁止 cookie session、API key in header（除非 ADR 同意）
- 事件 publish/consume 必須走 CloudEvents 信封 + JSON Schema 驗證
- 生成 endpoint 時自動加 OpenAPI metadata（Java: `@Operation` / `@ApiResponse`；Python: FastAPI decorator 含 `summary` / `response_model` / `responses`）
