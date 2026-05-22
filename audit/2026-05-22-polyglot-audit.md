# Spec Audit (Polyglot pass) — yongcing/ai-develop-spec @ cd00e94

> Second audit, post polyglot restructure. Auto-generated 2026-05-22.

## CRITICAL

- **Two Python spec files referenced but missing from disk** — `30-backend/error-handling.md:4`, `30-backend/security-baseline.md:4`
  - Both shared docs link to `30-backend-python/error-handling.md` and `30-backend-python/security-baseline.md`. Java versions exist; Python versions do **not**.
  - AI clicking the link hits 404 → invents rules or skips error/security layer on Python side.
  - Fix: create both Python files with FastAPI `add_exception_handler` + dual-dependency JWT split.

- **Problem Details `type` URI stem disagrees** — `api-contract-rules.md:13` (`/errors/`) vs `30-backend/error-handling.md:27` (`/problems/`) vs `30-backend-java/error-handling.md:28` (`/problems/`)
  - Cross-language byte-compat contract drifts on day one.
  - Fix: pick `/problems/<kebab-semantic>`, propagate.

## HIGH

- **CLAUDE.md routing too thin** — `CLAUDE.md:15-26`
  - Removed direct entries for error-handling / security-baseline / coding-standards / layering-rules. Relies on prompts to forward, but reader looking for the error format spec has no row.
  - Fix: add rows for shared contracts.

- **No Python equivalent of ArchUnit in system-architecture** — `system-architecture.md:54` says "ArchUnit 強制驗證"
  - Python uses `import-linter`; not surfaced in the cross-cutting doc.
  - Fix: parenthetical mentioning import-linter.

- **`full-stack-crud.md` assumes single OpenAPI spec** — `prompts/full-stack-crud.md:14`
  - If a project has both Java + Python backends, codegen path / merging strategy not specified.
  - Fix: "one OpenAPI spec per backend service; no merging; frontend codegen per service to `src/api/generated/<service>/`".

- **Asymmetric s2s-JWT path enforcement** — Java mandates `/api/v1/internal/**` prefix, Python only says "獨立 auth chain".
  - Ingress rules can't be uniform.
  - Fix: lift `/api/v1/internal/**` to shared `security-baseline.md`.

- **JWT/Problem Details field naming undefined for Python** — wire JSON is `traceId` camelCase; Python idiom is `trace_id`. Naive Pydantic model breaks contract.
  - Fix: Python spec must mandate `Field(..., alias="traceId")` + `populate_by_name=True`; declare "wire JSON = camelCase" globally in `api-contract-rules.md`.

## MEDIUM

- **`30-backend/tech-decision.md` "必讀 30-backend/ 全部" but no index** — add one-liner pointer or `README.md` in 30-backend/.
- **Pagination envelope undefined for Python** — `Page<T>` shape (Spring Data) never restated for FastAPI; AI will return `{items, total, page, size}` or similar drift.
  - Fix: define `PageResponse<T>` JSON shape once in `api-contract-rules.md`; Python rules reference it.
- **DoD migration line lists SQLAlchemy → Alembic only** — Python + Mongo has no defined migration tool.
  - Fix: forbid Mongo in Python services until ADR adds tool.
- **`python-jose` may be unmaintained** — 2024-2025 status; recommend `PyJWT` or `authlib`.
- **`prompts/backend-python-endpoint.md` final command block diverges from `ai-generation-rules.md`**
  - Fix: unify lists or have prompt reference the rules.
- **`30-backend-python/ai-generation-rules.md:45`** only names Postgres for testcontainers; Java list is Postgres / Mongo / Redis / NATS / MinIO.
  - Fix: align to full container list, forbid fakeredis / mongomock / SQLite.

## LOW / NITS

- `local-toolchain.md:78` heading "僅在 Python component 才需要" — soften to "Java-only project 可略" (polyglot framing).
- `system-architecture.md:35-37` "主幹" word implies Java precedence; restructure says both first-class.
- `python-jose` OTel propagator: W3C `traceparent` vs B3 not pinned (Java side same).
- `README.md:33` directory tree missing `30-backend-java/` and `30-backend-python/`.
- Python prompt lists fewer required docs than Java (only because two Python files missing — same root cause as CRITICAL #1).
- Python `--cov-fail-under=70` has no Java counterpart — intentional or accident?
- `30-backend-python/coding-standards.md:25` "PR review 過才允許" — specify CODEOWNERS reviewer.

## Polyglot-specific observations

1. **Structurally clean but contract-incomplete.** Wire-format (JSON shapes for pagination, Problem Details, CloudEvents, JWT claims) should be one **language-agnostic JSON reference** with per-language docs pointing at it, never restating fields.

2. **Python spec uniformly shorter and softer than Java.** Java has worked code snippets per doc; Python has structure descriptions without concrete code. Higher hallucination risk on Python side.

3. **Hard-stop on missing `Language:` label is well-codified.** Good.

4. **Routing gap for non-endpoint tasks** — no prompt for "add NATS consumer" or "scheduled job" in Python; Java has `@Scheduled + Shedlock`.

5. **Field-naming convention (camelCase wire vs Python snake_case)** = single largest drift vector. Define once in `api-contract-rules.md`, covers all shared DTOs.
