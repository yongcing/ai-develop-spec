# Prompt：生成 Java 後端 endpoint

> 複製此 prompt，填入變數後給 AI。
> 僅用於標記 `Language: Java` 的 component。Python component 請用 [backend-python-endpoint.md](backend-python-endpoint.md)。

---

你的任務是在一個 **Java / Spring Modulith** component 內生成一個後端 endpoint。

## 動工前確認（hard-stop）

- [ ] 目標 component 的 README / module doc 明寫 `Language: Java`。沒寫 → 停下，請架構師決定，依 [/30-backend/tech-decision.md](../30-backend/tech-decision.md) 流程
- [ ] 本機 `java --version` 為 17.x，依 [/00-architecture/local-toolchain.md](../00-architecture/local-toolchain.md)；不是的話先切

## 必讀規範（依序）

1. [/CLAUDE.md](../CLAUDE.md)
2. [/30-backend/tech-decision.md](../30-backend/tech-decision.md)
3. [/30-backend-java/tech-stack.md](../30-backend-java/tech-stack.md)
4. [/30-backend-java/ai-generation-rules.md](../30-backend-java/ai-generation-rules.md)
5. [/30-backend-java/layering-rules.md](../30-backend-java/layering-rules.md)
6. [/30-backend-java/coding-standards.md](../30-backend-java/coding-standards.md)
7. [/30-backend-java/error-handling.md](../30-backend-java/error-handling.md)
8. [/30-backend-java/security-baseline.md](../30-backend-java/security-baseline.md)
9. [/30-backend/error-handling.md](../30-backend/error-handling.md)（跨語言原則）
10. [/30-backend/security-baseline.md](../30-backend/security-baseline.md)（跨語言原則）
11. [/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md)
12. [/00-architecture/database-selection.md](../00-architecture/database-selection.md)（若涉及 DB schema）

## 需求

- Component / module 名稱：<填寫>
- HTTP method / path：<填寫>
- 輸入：<DTO 欄位與驗證規則>
- 輸出：<DTO 欄位>
- 業務邏輯：<條列描述>
- 權限要求：<誰可以呼叫>

## 交付物

- Controller + Request / Response DTO（record，含 Bean Validation + `@Operation` / `@ApiResponse`）放 `controller/`
- Service（含 `@Transactional`）放 `domain/`
- Repository（若需要）放 `infrastructure/`
- Entity + 對應 migration：JPA module 用 Flyway，Mongo module 用 Mongock（若涉及 DB 變更）
- Unit test（Service）+ Integration test（Controller，Testcontainers）
- 更新 ArchUnit 測試（若引入新 package）

## 完成前自檢

對照 [/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md) 後端區塊逐項確認。
