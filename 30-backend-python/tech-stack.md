# Python Tech Stack

> 採用情境見 [/30-backend/tech-decision.md](../30-backend/tech-decision.md)。
> 任何替換主要依賴必須走 ADR。

## 釘定版本

| 類別 | 套件 / 版本 | 用途 |
|------|------------|------|
| Runtime | **Python 3.12+** | 釘最新穩定 minor（同 Node LTS 邏輯）|
| Package manager | **uv** (latest) | 取代 pip / poetry / pip-tools；`uv sync` 安裝、`uv run` 執行 |
| Lockfile | `uv.lock` | 必入 repo |
| Web framework | **FastAPI** (latest stable, ≥ 0.115) | async-first、自帶 OpenAPI 3.1 |
| Validation / serialization | **Pydantic v2** | FastAPI 預設，request / response model |
| ASGI server | **Uvicorn** (prod) / `fastapi dev` (local) | |
| ORM（如需 DB） | **SQLAlchemy 2.x** (async) + **Alembic** | Mongo 場景另議走 ADR |
| HTTP client | **httpx** (async) | 取代 requests；同時支援 sync / async |
| 測試 | **pytest** + **pytest-asyncio** + **httpx** (TestClient) | |
| Lint / format | **ruff**（取代 black / isort / flake8） | |
| Type check | **mypy --strict** | CI 必過 |
| Tracing / logging | OpenTelemetry SDK + structlog | trace context 與 Java 共用 |
| Auth | python-jose + cryptography（JWT 驗證）| 自簽 service token 用 `jose.jwt.encode` |
| Background tasks（如需）| **Arq**（Redis-based）或 Celery（傳統需求）| 走 ADR |

## 工具鏈

詳見 [/00-architecture/local-toolchain.md](../00-architecture/local-toolchain.md)。Python 段：

```bash
# Windows: winget install --id=astral-sh.uv -e
# mac/linux: curl -LsSf https://astral.sh/uv/install.sh | sh

uv python install 3.12         # 安裝指定版
uv sync                        # 依 uv.lock 安裝依賴
uv run pytest                  # 跑測試
uv run fastapi dev app/main.py # 本機開發
```

每個 Python project repo 必須提供：
1. **`.python-version`** — 內容例如 `3.12`
2. **`pyproject.toml`** — `[project] requires-python = ">=3.12,<3.13"`
3. **`uv.lock`** — 已 commit
4. **`Makefile` 或 `taskfile`** — 標準化 lint / test / serve 入口

## 框架選擇硬規則

- ✅ Web framework = **FastAPI**
- ❌ Django（過於 monolithic，與 Spring 重疊；async 支援次於 FastAPI）
- ❌ Flask（async / OpenAPI 支援差，2026 已不推薦新專案）
- ✅ ORM = **SQLAlchemy 2.x async** + Alembic
- ❌ Tortoise ORM、Peewee、Django ORM（生態系窄、async 成熟度不一）
- ✅ HTTP client = **httpx**
- ❌ requests（不支援 async；對外都改 httpx）
- ✅ Package manager = **uv**
- ❌ poetry（仍可，但本系統釘 uv；既有 poetry repo 須走 ADR 規畫遷移）
- ❌ raw pip + requirements.txt（無 lock、不可重現）

## 對齊跨語言契約

| 契約 | 規格來源 | Python 套件 |
|------|---------|------------|
| REST | [/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md) | FastAPI（自動 OpenAPI） |
| Error format | [/30-backend/error-handling.md](../30-backend/error-handling.md) | 自建 Problem Details middleware |
| JWT auth | [/30-backend/security-baseline.md](../30-backend/security-baseline.md) | `python-jose` + FastAPI dependency |
| Events | [/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md) | `nats-py` + `cloudevents` SDK |

## 對 AI 生成行為的影響

- 動工前先讀本檔 + [ai-generation-rules.md](ai-generation-rules.md)
- 不得引入上面禁用名單套件；要替換現有依賴 → ADR
- Python 版本以 `.python-version` 為準；本機若不符先用 `uv python install` 切版
