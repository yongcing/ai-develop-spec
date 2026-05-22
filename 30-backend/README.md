# 30-backend/

> 後端規格區。本目錄為**跨語言共享**內容；語言特定規則在子目錄。

## 結構

```
30-backend/                ← 跨語言共享（本目錄）
├── README.md              ← 本檔（索引）
├── tech-decision.md       ← Java vs Python 選型決策
├── error-handling.md      ← RFC 7807 / Problem Details 語意分類
└── security-baseline.md   ← 認證模型（end-user OIDC + s2s Basic Auth）

30-backend-java/           ← Java component 必讀
├── tech-stack.md
├── ai-generation-rules.md
├── layering-rules.md
├── coding-standards.md
├── error-handling.md      ← Java 實作細節（@RestControllerAdvice…）
└── security-baseline.md   ← Java 實作細節（SecurityFilterChain…）

30-backend-python/         ← Python component 必讀
├── tech-stack.md
├── ai-generation-rules.md
├── layering-rules.md
├── coding-standards.md
├── error-handling.md      ← Python 實作細節（add_exception_handler…）
└── security-baseline.md   ← Python 實作細節（HTTPBasic / PyJWT…）
```

## AI 入口

依任務領取：

| 你要做 | 讀哪份 prompt | 隱含必讀路徑 |
|--------|--------------|--------------|
| Java backend endpoint | [/prompts/backend-java-endpoint.md](../prompts/backend-java-endpoint.md) | 本目錄全部 + `30-backend-java/` 全部 |
| Python backend endpoint | [/prompts/backend-python-endpoint.md](../prompts/backend-python-endpoint.md) | 本目錄全部 + `30-backend-python/` 全部 |
| 不確定語言 | — | [tech-decision.md](tech-decision.md)，hard-stop 等架構師決定 |

## 跨語言契約速覽

- **REST format**：[/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md)
- **錯誤格式**：[error-handling.md](error-handling.md) — `application/problem+json`，URI 模式 `https://api.example.com/problems/<kebab>`
- **認證**：[security-baseline.md](security-baseline.md) — end-user OIDC + JWT；s2s Basic Auth 於 `/api/v1/internal/**`
- **Wire JSON casing**：一律 camelCase（[api-contract-rules.md](../00-architecture/api-contract-rules.md)）
- **Pagination envelope**：`{content, totalElements, totalPages, number, size}`
- **Tracing**：OpenTelemetry SDK；context propagator 釘定 **W3C `traceparent`**（HTTP header）— Java OTel SDK 預設、Python OTel SDK 預設皆相容。B3 / Jaeger format 不採用。
- **NATS / CloudEvents**：[/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md) 的非同步契約段；consumer 必須冪等

切換語言**不應改變對外契約**。
