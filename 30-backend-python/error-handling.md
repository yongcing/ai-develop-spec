# Python：錯誤處理實作細節

> 語意分類、Problem Details 格式、通用規則：[/30-backend/error-handling.md](../30-backend/error-handling.md)。
> 本檔僅補 Python / FastAPI 層級實作。

## Exception 對應

| 語意 | Python exception |
|------|------------------|
| Validation | `pydantic.ValidationError`（FastAPI 自動）、自訂 `ValidationError` for business validation |
| NotFound | 自訂 `NotFoundError(DomainError)` |
| Conflict | 自訂 `ConflictError(DomainError)` |
| BusinessRule | 自訂 `BusinessRuleError(DomainError)` |
| Unauthenticated | `AuthenticationError(DomainError)`；JWT 解析失敗 / Basic Auth 無效都 raise 這個 |
| Forbidden | `ForbiddenError(DomainError)` |
| RateLimited | 自訂 `RateLimitExceededError(DomainError)` |
| InternalError | 兜底 `Exception` handler |

集中放於 `src/<app>/domain/exceptions.py`：

```python
# domain/exceptions.py
class DomainError(Exception):
    """Base class for all domain-layer errors."""

class NotFoundError(DomainError): ...
class ConflictError(DomainError): ...
class BusinessRuleError(DomainError): ...
class AuthenticationError(DomainError): ...
class ForbiddenError(DomainError): ...
class RateLimitExceededError(DomainError): ...
```

## Problem Details model

```python
# api/v1/schemas/problem.py
from pydantic import BaseModel, ConfigDict, Field

class ProblemDetail(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,   # 接受 snake_case 或 alias 兩種輸入
        frozen=True,
    )
    type: str
    title: str
    status: int
    detail: str | None = None
    instance: str | None = None
    trace_id: str = Field(..., alias="traceId")           # 注意 alias
    errors: list[dict] | None = None
```

`Field(..., alias="traceId")` + `populate_by_name=True` 確保**回應 JSON 為 camelCase** 而 Python 內部用 snake_case（對齊 [/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md)「wire JSON = camelCase」規則）。

## 全域 handler

```python
# main.py 或獨立 error_handlers.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from opentelemetry import trace

from .domain.exceptions import (
    NotFoundError, ConflictError, BusinessRuleError,
    ForbiddenError, AuthenticationError, RateLimitExceededError,
)
from .api.v1.schemas.problem import ProblemDetail

PROBLEM_BASE = "https://api.example.com/problems"

def _trace_id() -> str:
    span = trace.get_current_span()
    ctx = span.get_span_context()
    return format(ctx.trace_id, "032x") if ctx.is_valid else ""

def _problem(status: int, slug: str, title: str, detail: str, req: Request) -> JSONResponse:
    pd = ProblemDetail(
        type=f"{PROBLEM_BASE}/{slug}",
        title=title,
        status=status,
        detail=detail,
        instance=str(req.url.path),
        trace_id=_trace_id(),
    )
    return JSONResponse(
        status_code=status,
        content=pd.model_dump(by_alias=True, exclude_none=True),  # by_alias 必開
        media_type="application/problem+json",
    )

def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def _404(req: Request, exc: NotFoundError):
        return _problem(404, "not-found", "Not Found", str(exc), req)

    @app.exception_handler(ConflictError)
    async def _409(req: Request, exc: ConflictError):
        return _problem(409, "conflict", "Conflict", str(exc), req)

    @app.exception_handler(BusinessRuleError)
    async def _422(req: Request, exc: BusinessRuleError):
        return _problem(422, "business-rule", "Business Rule Violation", str(exc), req)

    @app.exception_handler(AuthenticationError)
    async def _401(req: Request, exc: AuthenticationError):
        return _problem(401, "unauthenticated", "Unauthenticated", str(exc), req)

    @app.exception_handler(ForbiddenError)
    async def _403(req: Request, exc: ForbiddenError):
        return _problem(403, "forbidden", "Forbidden", str(exc), req)

    @app.exception_handler(RateLimitExceededError)
    async def _429(req: Request, exc: RateLimitExceededError):
        return _problem(429, "rate-limited", "Too Many Requests", str(exc), req)

    @app.exception_handler(Exception)
    async def _500(req: Request, exc: Exception):
        # 寫完整 stack 進 log，回應只給通用訊息
        import structlog
        structlog.get_logger().exception("unhandled_error", trace_id=_trace_id())
        return _problem(500, "internal", "Internal Server Error", "Unexpected error.", req)
```

### Pydantic ValidationError

FastAPI 預設把 422 回成自訂格式；要改成 Problem Details：

```python
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def _422_validation(req: Request, exc: RequestValidationError):
    errors = [
        {"field": ".".join(str(p) for p in e["loc"][1:]), "code": e["type"], "message": e["msg"]}
        for e in exc.errors()
    ]
    pd = ProblemDetail(
        type=f"{PROBLEM_BASE}/validation",
        title="Validation Failed",
        status=400,
        detail="One or more fields failed validation.",
        instance=str(req.url.path),
        trace_id=_trace_id(),
        errors=errors,
    )
    return JSONResponse(status_code=400, content=pd.model_dump(by_alias=True, exclude_none=True),
                       media_type="application/problem+json")
```

注意：FastAPI 預設 422 改為 **400**（符合語意分類；422 留給 BusinessRule）。

## 規則（Python 特有）

- ✅ Service 層 raise domain exception，**禁止** raise `HTTPException`（後者是 FastAPI 抽象，污染 service 層）
- ✅ `Field(..., alias="traceId")` + `populate_by_name=True` + `model_dump(by_alias=True)` 三件套
- ✅ 5xx 必 `structlog.exception(...)` 寫完整 stack；4xx 用 `warning`
- ✅ Response media type 為 `application/problem+json`
- ❌ Router 內 try-except domain exception（特殊情境例外，須在 PR 註記理由）
- ❌ 自製錯誤 JSON 結構取代 `ProblemDetail`
- ❌ 在 error response 內回 stack trace、Python repr、ORM exception 原文
