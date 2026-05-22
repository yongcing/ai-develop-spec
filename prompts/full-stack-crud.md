# Prompt：生成全端 CRUD feature

> 用於從零生成一個 entity 的完整 CRUD。

---

依序執行：

1. **架構檢查**：對照 [/00-architecture/database-selection.md](../00-architecture/database-selection.md) 確認 DB 選型；若需新表，在 [/00-architecture/adr/](../00-architecture/adr/) 建立 ADR。
2. **語言決策**：對照 [/30-backend/tech-decision.md](../30-backend/tech-decision.md)；確認該 component 標 `Language: Java` 或 `Language: Python`，否則停下請架構師決定。
3. **後端**：依語言選擇對應 prompt，生成 List / Get / Create / Update / Delete 五個 endpoint：
   - Java component → [backend-java-endpoint.md](backend-java-endpoint.md)
   - Python component → [backend-python-endpoint.md](backend-python-endpoint.md)
4. **OpenAPI 同步**：產出 OpenAPI spec 給前端消費（兩種 framework 都自動產 OpenAPI 3.1）。
5. **前端**：依 [frontend-feature.md](frontend-feature.md) 生成對應 list / detail / form 頁面（前端與 backend 語言無關，永遠走 OpenAPI codegen）。
6. **DoD**：對照 [/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md) 全項確認。

## 需求

- Entity 名稱：<填寫>
- 欄位定義：<list with type & validation>
- 權限矩陣：<誰可以做哪個操作>
- 特殊業務規則：<如有>
