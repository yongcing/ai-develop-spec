# Java：錯誤處理實作細節

> 語意分類、Problem Details 格式、通用規則：[/30-backend/error-handling.md](../30-backend/error-handling.md)。
> 本檔僅補 Java / Spring 層級實作。

## Exception 對應

| 語意 | Java exception |
|------|---------------|
| Validation | `MethodArgumentNotValidException`（Spring 自動）、自訂 `ValidationException` |
| NotFound | 自訂 `NotFoundException` extends `RuntimeException` |
| Conflict | 自訂 `ConflictException`（如 optimistic lock 觸發） |
| BusinessRule | 自訂 `BusinessException`（依模組命名 `<Module>BusinessException`） |
| Unauthenticated | `AuthenticationException`（Spring Security 自動） |
| Forbidden | `AccessDeniedException`（Spring Security 自動） |
| RateLimited | 自訂 `RateLimitExceededException` |
| InternalError | 兜底 `Exception` handler |

## 全域處理：`@RestControllerAdvice`

```java
@RestControllerAdvice
public class ProblemDetailsAdvice {

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail handleNotFound(NotFoundException ex, HttpServletRequest req) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setType(URI.create("https://api.example.com/problems/not-found"));
        pd.setTitle("Not Found");
        pd.setInstance(URI.create(req.getRequestURI()));
        pd.setProperty("traceId", Span.current().getSpanContext().getTraceId());
        return pd;
    }

    // … 其餘 handler 同樣 pattern
}
```

Spring 6 內建 `ProblemDetail` (RFC 7807) 直接用，**不要**自己包 DTO。

## 規則（Java 特有）

- ✅ Service 拋 domain exception，由 `@RestControllerAdvice` 統一轉成 HTTP response
- ❌ Controller 內 try-catch domain exception（特殊情境例外，須在 PR 註記理由）
- ❌ 用 `throw new RuntimeException("...")` 取代有意義的 domain exception
- ❌ 自製錯誤 JSON 結構取代 `ProblemDetail`
