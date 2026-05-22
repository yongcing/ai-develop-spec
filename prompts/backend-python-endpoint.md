# Prompt：生成 Python 後端 endpoint

> 複製此 prompt，填入變數後給 AI。
> 僅用於標記 `Language: Python` 的 component。Java component 請用 [backend-java-endpoint.md](backend-java-endpoint.md)。

---

你的任務是在一個 **Python / FastAPI** component 內生成一個後端 endpoint。

## 動工前確認（hard-stop）

- [ ] 目標 component 的 README 明寫 `Language: Python`。沒寫 → 停下，請架構師決定，依 [/30-backend/tech-decision.md](../30-backend/tech-decision.md) 流程
- [ ] 本機 `python --version` 與 `.python-version` 一致；不是的話先 `uv python install <ver>` 與 `uv sync`

## 必讀規範（依序）

1. [/CLAUDE.md](../CLAUDE.md)
2. [/30-backend/tech-decision.md](../30-backend/tech-decision.md)
3. [/30-backend-python/tech-stack.md](../30-backend-python/tech-stack.md)
4. [/30-backend-python/ai-generation-rules.md](../30-backend-python/ai-generation-rules.md)
5. [/30-backend-python/layering-rules.md](../30-backend-python/layering-rules.md)
6. [/30-backend-python/coding-standards.md](../30-backend-python/coding-standards.md)
7. [/30-backend/error-handling.md](../30-backend/error-handling.md)（跨語言原則 + RFC 7807 contract）
8. [/30-backend/security-baseline.md](../30-backend/security-baseline.md)（跨語言原則）
9. [/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md)
10. [/00-architecture/database-selection.md](../00-architecture/database-selection.md)（若涉及 DB schema）

## 需求

- Component 名稱：<填寫>
- HTTP method / path：<填寫>
- 輸入：<Pydantic schema 欄位與驗證規則>
- 輸出：<Pydantic response schema 欄位>
- 業務邏輯：<條列描述>
- 權限要求：<誰可以呼叫>

## 交付物

- Router 放 `api/v1/routers/<resource>.py`（async def，含 `summary`、`response_model`、`responses`）
- Request / Response Pydantic schema 放 `api/v1/schemas/<resource>.py`
- Service 放 `services/<resource>.py`（async；交易邊界在這層）
- Repository 放 `repositories/<resource>.py`（SQLAlchemy async query）
- Domain model / exception 放 `domain/`（如有新類型）
- Alembic migration（若涉及 DB schema）
- Tests：service unit test（mock repo）+ endpoint integration test（200 / 4xx / 5xx 各一）

## 完成前自檢

對照 [/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md) 後端區塊逐項確認，並跑：

```bash
uv run ruff check && uv run ruff format --check
uv run mypy --strict src/
uv run lint-imports
uv run pytest --cov=src --cov-fail-under=70
```
