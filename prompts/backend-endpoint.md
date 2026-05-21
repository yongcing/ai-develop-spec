# Prompt：生成後端 endpoint

> 複製此 prompt，填入變數後給 AI。

---

你的任務是生成一個後端 endpoint。

## 必讀規範（依序）

1. [/CLAUDE.md](../CLAUDE.md)
2. [/30-backend/tech-stack.md](../30-backend/tech-stack.md)
3. [/30-backend/ai-generation-rules.md](../30-backend/ai-generation-rules.md)
4. [/30-backend/layering-rules.md](../30-backend/layering-rules.md)
5. [/30-backend/error-handling.md](../30-backend/error-handling.md)
6. [/00-architecture/api-contract-rules.md](../00-architecture/api-contract-rules.md)

## 需求

- Feature 名稱：<填寫>
- HTTP method / path：<填寫>
- 輸入：<DTO 欄位與驗證規則>
- 輸出：<DTO 欄位>
- 業務邏輯：<以條列描述>
- 權限要求：<誰可以呼叫>

## 交付物

- Controller + DTO（含 Bean Validation + OpenAPI 註解）
- Service（含 `@Transactional`）
- Repository（若需要）
- Entity + Flyway migration（若涉及 DB 變更）
- Unit test（Service）+ Integration test（Controller）
- 更新 ArchUnit 測試（若引入新 package）

## 完成前自檢

對照 [/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md) 後端區塊逐項確認。
