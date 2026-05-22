# Python 後端 AI 生成規則

> 對應 Java [/30-backend-java/ai-generation-rules.md](../30-backend-java/ai-generation-rules.md)。
> AI 生成 Python backend code 前**必先**讀本檔 + [tech-stack.md](tech-stack.md) + [layering-rules.md](layering-rules.md) + [coding-standards.md](coding-standards.md)。

## 必須 (MUST)

### 結構

- ✅ 採三層 + domain：`api/` → `services/` → `repositories/` + `infrastructure/`，加獨立 `domain/`
- ✅ Package root：`src/<app_name>/`，PEP 621 layout（`pyproject.toml` + `src/` layout）
- ✅ 每個 endpoint 必須在 `api/v1/routers/<resource>.py` 內，使用 `APIRouter`；不能放在 `main.py`
- ✅ 所有 list endpoint 必須分頁（query `page`, `size` 預設 50、最大 100），對齊 [/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md)

### 型別與 schema

- ✅ Pydantic v2 BaseModel 標 request / response；request 不接 partial（用 `Field(...)` 標必填）
- ✅ Response model 用 `frozen=True` 設不可變
- ✅ `mypy --strict` 全綠
- ✅ 公開函式必有 `-> ReturnType` annotation

### Auth / Security

- ✅ Endpoint 預設要 auth（FastAPI dependency `Depends(require_auth)`）；公開 endpoint 在 `api/v1/public_routers.py` 明確列舉
- ✅ Service 層做 owner check：`if order.owner_id != current_user.id: raise ForbiddenError(...)`
- ✅ Service-to-service JWT 走獨立 auth chain（不同 FastAPI app instance 或 router-level dependency）

### Error handling

- ✅ Domain exception 集中於 `domain/exceptions.py`；service 層 raise
- ✅ FastAPI `add_exception_handler` 轉 RFC 7807 Problem Details
- ✅ 全域 fallback handler 處理 `Exception`，回 500 + 通用訊息（不洩漏 stack）

### OpenAPI

- ✅ FastAPI 內建 `/openapi.json`；build 時 export 到 `docs/openapi.json` 入 repo
- ✅ 每個 endpoint 必填 `summary`、`description`、`response_model`、`responses={...}`
- ✅ DTO 欄位用 `Field(..., description="...", examples=[...])`

### 測試

- ✅ Service unit test：mock repository
- ✅ Endpoint integration test：用 `httpx.AsyncClient(transport=ASGITransport(app=app))` 或 `TestClient`
- ✅ 每個 endpoint 至少：200 path + 一個 4xx path + 一個 5xx path（模擬下游失敗）
- ✅ DB 整合：用 testcontainers-python 起 Postgres，**不**用 SQLite 替代

### Async

- ✅ 所有 I/O endpoint 為 `async def`
- ✅ DB 用 SQLAlchemy async session（`AsyncSession`）
- ✅ HTTP client 用 `httpx.AsyncClient`

### Observability

- ✅ OpenTelemetry SDK 啟動 + FastAPI / SQLAlchemy / httpx instrumentation
- ✅ 所有 log 經 `structlog`，附 `trace_id`

## 禁止 (MUST NOT)

### 結構

- ❌ 在 `main.py` 直接寫 endpoint（必須走 router）
- ❌ 在 `api/` 內寫 business logic
- ❌ 在 service 內 import 任何 FastAPI / Pydantic schema 型別
- ❌ 在 service / repository 內讀 `request` 物件
- ❌ 跨 layer 反向 import（import-linter 會擋）

### 型別

- ❌ `Any`（除非標 `# ai-allow: any <理由>` 且 reviewer 簽）
- ❌ `cast(...)` 掩蓋型別錯誤
- ❌ `# type: ignore` 沒理由

### Async

- ❌ `def` endpoint 內呼叫 await（會出 TypeError）
- ❌ async function 內呼叫 blocking I/O（用 `asyncio.to_thread` 包）
- ❌ 在 async 環境用 `requests` library（一律 `httpx`）

### 套件 / 工具

- ❌ Django / Flask（web framework 必為 FastAPI；要換走 ADR）
- ❌ Tortoise ORM / Django ORM / Peewee（ORM 必為 SQLAlchemy）
- ❌ `requests` / `urllib3` 直呼（HTTP client 必為 httpx）
- ❌ `pip install ...` 取代 `uv add ...`
- ❌ commit 沒過 `uv lock`
- ❌ commit `__pycache__/` / `.venv/`（.gitignore 必須擋）

### 安全

- ❌ Token / 密碼 / secret 寫死於 code 或 `config.py`（必須環境變數 / Secret manager）
- ❌ SQL 字串拼接（一律 SQLAlchemy parameterized）
- ❌ Endpoint 預設 public（必須 `Depends(require_auth)`，公開要明確列舉）

### Log

- ❌ `print(...)` 取代 logger
- ❌ 在 log 出現密碼、JWT、PII

## 自動化檢查（CI 必過）

```bash
uv sync
uv run ruff check
uv run ruff format --check
uv run mypy --strict src/
uv run lint-imports
uv run pytest --cov=src --cov-fail-under=70
```

任一紅 → PR block。

## 對齊跨語言 / 跨服務

- REST 契約：[/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md)
- 錯誤格式：[/30-backend/error-handling.md](../30-backend/error-handling.md)
- 認證：[/30-backend/security-baseline.md](../30-backend/security-baseline.md)
- 語言選型：[/30-backend/tech-decision.md](../30-backend/tech-decision.md)

語言不同，**契約一致**。

## 對 AI 生成行為的影響

- 動工前 hard-stop 確認 component README 標 `Language: Python`，否則停下回報
- 違反上面任一條 MUST / MUST NOT → AI 應拒寫並回報，不要為了「通過任務」而妥協
- 新增第三方依賴前先看 tech-stack.md 禁用名單；不在白名單需 ADR
