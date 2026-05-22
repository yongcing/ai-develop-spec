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

- `type` 必填，URI 字串，每個 problem 一個唯一值（不必能解析）
- `title` 必填，人類可讀短句
- `status` 必填，整數 HTTP status
- `detail`、`instance` 建議填
- `traceId` 必填，取自 OpenTelemetry current span 或同等 tracing context
- 欄位級錯誤放 `errors[]`（自訂擴充，符合 RFC 7807 允許）

## 通用規則（跨語言）

- ✅ 業務邏輯層拋語意明確的 exception；HTTP 層集中轉成 Problem Details，**不在每個 endpoint try-catch**
- ✅ 500 路徑必須 log 完整 stack trace（含 traceId），但回應只給通用訊息
- ✅ 4xx 路徑不打 ERROR log（避免 noise），用 WARN 或 INFO
- ❌ 把 stack trace / 內部訊息直接回 client
- ❌ catch 後 swallow
- ❌ 自製錯誤 JSON 結構（一律 RFC 7807）
- ❌ 把 user input 拼進 error message 不做 escaping（XSS / log injection 風險）
