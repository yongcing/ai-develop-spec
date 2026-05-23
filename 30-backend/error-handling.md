# 後端錯誤處理規範（語言無關）

> 適用於本系統所有後端服務（Java、Python …）。
> 語言層級的實作細節：[30-backend-java/error-handling.md](../30-backend-java/error-handling.md)、[30-backend-python/error-handling.md](../30-backend-python/error-handling.md)。

## 異常分類（語意，不是類別名稱）

每個語言實作對應的 exception / error 型別，**語意要對齊**：

| 語意 | 用途 | HTTP Status |
|------|------|-------------|
| Validation | 輸入驗證失敗（語法、必填、格式） | 400 |
| NotFound | 資源不存在 | 404 |
| Conflict | 資源衝突（duplicate、optimistic lock） | 409 |
| BusinessRule | 業務規則違反（語意通過、邏輯違反） | 422 |
| Unauthenticated | 未認證 | 401 |
| Forbidden | 已認證但無權限 | 403 |
| RateLimited | 超過 rate limit | 429 |
| InternalError | 未預期錯誤（兜底） | 500（不洩漏細節） |

## 對外格式：RFC 7807 Problem Details

**全系統強制**，跨語言一致：

```json
{
  "type": "https://api.example.com/problems/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "field 'email' is required",
  "instance": "/api/v1/users",
  "traceId": "abc123",
  "errors": [
    { "field": "email", "code": "NotBlank", "message": "must not be blank" }
  ]
}
```

- `type` 必填，**URI 模式釘定**為 `https://api.example.com/problems/<kebab-semantic>`（不必真能解析，但 stem 必須對齊）
- Media type：`application/problem+json`
- `title` 必填，人類可讀短句
- `status` 必填，整數 HTTP status
- `detail`、`instance` 建議填
- `traceId` 必填，取自 OpenTelemetry current span 或同等 tracing context
- 欄位級錯誤放 `errors[]`（自訂擴充，符合 RFC 7807 允許）

## 400 vs 422 split（語意分流，跨語言一致）

`Validation`（400）與 `BusinessRule`（422）很容易混淆，**規則固定如下**：

| 條件 | 400 Validation | 422 BusinessRule |
|------|---------------|------------------|
| 失敗發生在哪一層 | 反序列化 / Bean Validation / Pydantic 欄位驗證 | 通過 schema 後的領域邏輯 / 不變式 |
| 看到的工具 | `@NotBlank` / `@Email` / `@Size` / `model_validator` 欄位錯誤 | service 拋出的領域 exception |
| 是否需要查 DB / 跨資源 | 否 | 通常是（要讀現有 state 才判得出來） |
| Problem `type` slug | `validation` | `business-rule-violation` |

### 400 範例（schema / 欄位驗證）

1. `POST /api/v1/users` body 缺 `username`：Bean Validation `@NotBlank` 失敗 → `errors[]` 列出 `{field:"username", code:"NotBlank"}`。
2. `PATCH /api/v1/me/profile` body `email` 為 `not-an-email`：Pydantic / Bean Validation `@Email` 失敗 → `errors[]` 列出 `{field:"email", code:"Email"}`。

### 422 範例（業務規則 / 不變式）

1. `POST /api/v1/alarms/{id}/reopen` 距離 `closedAt` 已超過 7 天：schema 合法、欄位齊全，但領域規則禁止 → `type=…/business-rule-violation`、`detail="cannot reopen alarm closed more than 7 days ago"`。
2. `POST /api/v1/skills/{slug}/versions/{vid}/promote` 嘗試 promote 一個 `draft` 但尚未通過 lint 的 version：schema 合法，業務規則違反（必須先 lint pass） → `type=…/business-rule-violation`。

> 經驗法則：「光看 request body / path / query 就能判定錯誤」= 400；「要結合 DB / 既有資源狀態才能判定」= 422。

## Problem `type` URI base

- 通用建議：`https://api.example.com/problems/<slug>`（spec 範例）。
- **內部專用平台例外**：若服務不公開、`type` 無對外瀏覽需求，**可以**使用非可路由的內部 domain 佔位（例如 `https://aiops.example.com/errors/<slug>`），前提是：
  - 在該產品的 ADR 中明文記錄此選擇；
  - 全產品內所有 service 對齊同一個 base（不可混用）；
  - slug 仍須使用 kebab-case 且與本檔語意分類對齊（`validation` / `not-found` / `conflict` / `business-rule-violation` / `forbidden` / `quota-exceeded` …）。
- 不論選哪個 base，URI **不必真能解析**，但 stem 必須對齊。

## 通用規則（跨語言）

- ✅ 業務邏輯層拋語意明確的 exception；HTTP 層集中轉成 Problem Details，**不在每個 endpoint try-catch**
- ✅ 500 路徑必須 log 完整 stack trace（含 traceId），但回應只給通用訊息
- ✅ 4xx 路徑不打 ERROR log（避免 noise），用 WARN 或 INFO
- ❌ 把 stack trace / 內部訊息直接回 client
- ❌ catch 後 swallow
- ❌ 自製錯誤 JSON 結構（一律 RFC 7807）
- ❌ 把 user input 拼進 error message 不做 escaping（XSS / log injection 風險）
