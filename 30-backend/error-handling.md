# 後端錯誤處理規範

## 異常分類

| Domain Exception | 用途 | HTTP Status |
|------|------|-------------|
| `ValidationException`（Bean Validation 自動） | 輸入驗證失敗 | 400 |
| `NotFoundException` | 資源不存在 | 404 |
| `ConflictException` | 資源衝突（duplicate、optimistic lock） | 409 |
| `BusinessException` | 業務規則違反 | 422 |
| `AuthenticationException`（Spring Security） | 未認證 | 401 |
| `AccessDeniedException`（Spring Security） | 無權限 | 403 |
| `RateLimitExceededException` | 超過 rate limit | 429 |
| （兜底）`Exception` | 未預期錯誤 | 500（不洩漏細節） |

## 全域處理

`@RestControllerAdvice` 統一處理，回應 RFC 7807 Problem Details：

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

`traceId` 取自 OpenTelemetry current span，方便對應 log。

## 規則

- ✅ Service 拋出 domain exception，由 `@RestControllerAdvice` 統一轉成 HTTP response
- ✅ 500 路徑必須 log 完整 stack trace（含 traceId）但只回傳通用訊息
- ✅ 4xx 路徑不需要 ERROR level log（避免 noise），用 WARN 或 INFO
- ❌ Controller 內 try-catch 處理 domain exception（特殊情境例外，須在 PR 註記理由）
- ❌ Catch 後 swallow
- ❌ 把 stack trace 或內部錯誤訊息直接回傳給 client
- ❌ 用 `throw new RuntimeException("...")` 取代有意義的 domain exception
