# Python 編碼規範

> 對應 Java [/30-backend-java/coding-standards.md](../30-backend-java/coding-standards.md)。

## 命名

| 項目 | 規則 | 範例 |
|------|------|------|
| Class | PascalCase | `OrderService` |
| Function / variable | snake_case | `create_order`, `order_id` |
| Module file | snake_case | `order_service.py` |
| Constant | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Private | 前綴底線 `_name`；強私有 `__name`（少用）| `_internal_helper` |
| Package | 全小寫，無底線（短）| `orders`, `users` |
| Pydantic schema | `<Action><Entity>` 命名 | `CreateOrderRequest`, `OrderResponse` |
| Test 檔 | `test_<被測模組>.py` | `test_order_service.py` |
| Test function | `test_<行為>_<情境>` | `test_create_order_with_invalid_email` |

## 型別 (mypy --strict)

- ✅ 所有 public function 標 `-> ReturnType`
- ✅ 所有參數 / class attribute 標型別
- ✅ Generic 用 `TypeVar` / `Protocol`，**不**用 `Any` 規避
- ✅ Optional 寫 `T | None`（PEP 604），不用 `Optional[T]`
- ❌ `Any`（除非標 `# type: ignore[no-any-return] # justify reason`，且須 CODEOWNERS 內 backend tech-lead 簽 review 才允許）
- ❌ `cast(...)` 掩蓋型別錯誤
- ❌ `# type: ignore` 沒理由

## Pydantic v2

- ✅ request / response schema 都 inherit `BaseModel`
- ✅ 用 `model_config = ConfigDict(frozen=True)` 把 response model 設為不可變
- ✅ enum 用 `StrEnum`（PEP 663）方便序列化
- ❌ 共用同一個 model 當 request 和 response（多半 fields 不一樣）
- ❌ 把 SQLAlchemy model 當 Pydantic schema 用（拒絕直接 `Order.model_validate(sql_row)` 的快捷做法 — 用 mapper 函式）

## SQLAlchemy 2.x

- ✅ 用 declarative `class Base(DeclarativeBase): ...`、`Mapped[]` 型別標註
- ✅ async session：`async with session.begin(): ...`
- ✅ query 用 `select(...)`，**不**用 legacy `Query`
- ❌ 在 router / service 直接拼 SQL 字串
- ❌ 共用 sync 與 async session

## Async

- ✅ FastAPI endpoint **預設 `async def`**（除非真的是 CPU-bound 且無 await）
- ✅ I/O 一律 await（DB、HTTP、NATS）
- ❌ 在 async function 內呼叫 blocking I/O（會卡 event loop）— 一定要時用 `asyncio.to_thread(...)` 包

## 錯誤處理

詳見 [/30-backend/error-handling.md](../30-backend/error-handling.md)（語意分類 + RFC 7807 格式）。Python 端：

- domain exception 集中於 `domain/exceptions.py`
- 全域 handler 用 FastAPI `add_exception_handler` 註冊，轉成 RFC 7807 JSON

## Logging

- 用 `structlog` 寫 structured log（JSON）
- 永遠帶 `trace_id`（從 OpenTelemetry context 取）
- ❌ `print(...)`
- ❌ 在 log 出 PII / token

## Imports

- ruff 強制：標準庫 → 第三方 → 本專案，每組空一行
- 禁止 `from x import *`
- 內部 import 一律 absolute（`from app_name.services.orders import ...`），不用 relative `..`

## Test

- ✅ pytest fixtures 共用設置（`conftest.py`）
- ✅ `pytest.mark.asyncio` 標 async test（或 `pytest-asyncio` auto mode）
- ✅ 每個 endpoint 至少一個 200 path + 一個 4xx path + 一個 5xx path（含 mocked failure）
- ❌ 跨 test 共享可變狀態（每個 test 必須獨立）
- ❌ test 內 `time.sleep(...)`、`asyncio.sleep(N)` 等死等

## 對 AI 生成行為的影響

- 不滿足 `ruff check && mypy --strict && pytest` 三項全綠不算完成
- 新增 endpoint 必須加對應 Pydantic schema + 至少三條 test
- 違反命名表 → PR 自動拒
