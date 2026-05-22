# Python 後端分層規範

> 對應 Java 的 [/30-backend-java/layering-rules.md](../30-backend-java/layering-rules.md)。
> 結構不同，但**依賴方向**、**交易邊界**、**DTO/Entity 分離**三原則一致。

## Package 結構

FastAPI 沒有 Modulith 那種強制邊界，採社群慣例 + 自設 import 檢查：

```
src/<app_name>/
├── __init__.py
├── main.py                     # FastAPI app 入口
├── config.py                   # pydantic-settings 設定
├── api/                        # HTTP 層
│   ├── __init__.py
│   ├── v1/
│   │   ├── routers/
│   │   │   ├── orders.py       # APIRouter，含 endpoints
│   │   │   └── users.py
│   │   └── schemas/            # request / response Pydantic models
│   │       ├── orders.py
│   │       └── users.py
│   └── deps.py                 # FastAPI dependencies (auth, db session…)
├── services/                   # 業務邏輯
│   ├── orders.py
│   └── users.py
├── domain/                     # 純 domain model（dataclass / Pydantic）+ exceptions
│   ├── models.py
│   └── exceptions.py
├── repositories/               # 資料存取
│   ├── orders.py
│   └── base.py
├── infrastructure/             # 外部整合（HTTP client、NATS、S3…）
│   ├── nats.py
│   └── s3.py
└── observability/              # tracing、logging、metrics setup
```

對應到 Java 的三層：

| 概念 | Python 路徑 | Java 路徑 |
|------|------------|----------|
| HTTP 層 | `api/v1/routers/` + `api/v1/schemas/` | `controller/` |
| 業務邏輯 | `services/` | `domain/` (service) |
| 領域模型 / 規則 | `domain/` | `domain/` (model + exceptions) |
| 持久化 | `repositories/` + `infrastructure/` | `infrastructure/` |

## 三層原則

```
api/  (Router + Pydantic schema)
   ↓ 只能呼叫
services/  (用 case orchestration + tx 邊界)
   ↓ 只能呼叫
repositories/ / infrastructure/  (SQLAlchemy / 外部 client)

domain/  ← 純粹型別 + exception；不依賴任何上層
```

### API 層 (`api/`)
- FastAPI Router、Pydantic request / response schema、auth dependencies、OpenAPI 註解
- **禁止**：業務邏輯、直接呼叫 SQLAlchemy session、try-except domain exception

### Service 層 (`services/`)
- 業務邏輯、交易邊界
- **交易邊界**：在 service 函式內 `async with db.begin():` 包覆，不在 router 開
- 跨服務 / 跨 domain 呼叫透過注入（FastAPI `Depends`）的 interface
- **禁止**：依賴 FastAPI / Pydantic schema（要用 domain model 或自訂 dataclass）、直接觸碰 HTTP request 物件

### Repository 層 (`repositories/`)
- SQLAlchemy query、Mongo query、外部 API client
- 回傳 domain model（不是 ORM Entity）
- **禁止**：業務邏輯

### Domain 層 (`domain/`)
- 純資料 + 規則 + exception
- **不依賴** FastAPI、SQLAlchemy、httpx — 任何 framework / library
- 可以被任何上層 import

## DTO / Entity 邊界

- API 層用 **Pydantic v2 `BaseModel`**（request / response）
- DB 層用 **SQLAlchemy `DeclarativeBase`** 或 **Mongo document class**
- Domain 層用 **frozen dataclass** 或獨立 Pydantic model（不繼承 ORM base）
- **禁止** SQLAlchemy model 直接作為 API response / request schema

## 跨服務溝通

Python 服務 = 獨立部署。對其他 backend service 一律走：

- **同步**：`httpx.AsyncClient` + Bearer JWT；service-to-service token 自簽
- **非同步**：`nats-py` + `cloudevents` SDK；consumer 必須冪等

## 自動驗證

### import linter（強制依賴方向）

`pyproject.toml`：

```toml
[tool.importlinter]
root_package = "<app_name>"

[[tool.importlinter.contracts]]
name = "Layers"
type = "layers"
layers = ["api", "services", "repositories | infrastructure", "domain"]
```

CI 跑 `lint-imports`，反向違規即紅。

### ruff + mypy

- `ruff check` 強制 import 順序、未使用 import、style
- `mypy --strict` 對所有 public function 要求型別

### pytest

- `pytest`：service layer unit test（mock repository）
- `pytest` + `httpx.AsyncClient(app=…)`：API layer integration test

## 對 AI 生成行為的影響

- 動工前先讀本檔
- 任何新 endpoint 必須照三層分開（router → service → repository）
- DTO 三類不可混（Pydantic / SQLAlchemy / domain）
- 反向 import 由 import-linter 擋，AI 不可繞過
