# Prompt：生成全端 CRUD feature

> 用於從零生成一個 entity 的完整 CRUD。

---

依序執行：

1. **架構檢查**：對照 [/00-architecture/database-selection.md](../00-architecture/database-selection.md) 確認 DB 選型；若需新表，在 [/00-architecture/adr/](../00-architecture/adr/) 建立 ADR。
2. **後端**：依 [backend-endpoint.md](backend-endpoint.md) 生成 List / Get / Create / Update / Delete 五個 endpoint。
3. **OpenAPI 同步**：產出 OpenAPI spec 給前端消費。
4. **前端**：依 [frontend-feature.md](frontend-feature.md) 生成對應 list / detail / form 頁面。
5. **DoD**：對照 [/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md) 全項確認。

## 需求

- Entity 名稱：<填寫>
- 欄位定義：<list with type & validation>
- 權限矩陣：<誰可以做哪個操作>
- 特殊業務規則：<如有>
