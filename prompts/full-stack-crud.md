# Prompt：生成全端 CRUD feature

> 用於從零生成一個 entity 的完整 CRUD。

---

依序執行：

1. **架構檢查**：對照 [/00-architecture/database-selection.md](../00-architecture/database-selection.md) 確認 DB 選型；若需新表，在 [/00-architecture/adr/](../00-architecture/adr/) 建立 ADR。
2. **語言決策**：對照 [/30-backend/tech-decision.md](../30-backend/tech-decision.md)；確認該 component 標 `Language: Java` 或 `Language: Python`，否則停下請架構師決定。
3. **後端**：依語言選擇對應 prompt，生成 List / Get / Create / Update / Delete 五個 endpoint：
   - Java component → [backend-java-endpoint.md](backend-java-endpoint.md)
   - Python component → [backend-python-endpoint.md](backend-python-endpoint.md)
4. **OpenAPI 同步（per-service）**：每個 backend service 各自匯出**一份** OpenAPI 3.1 spec 到 `docs/openapi.json`（Java: springdoc maven 階段；Python: `python -c "from app.main import app; import json; print(json.dumps(app.openapi()))"`）。**禁止 merge spec**：多 service 場景，每個 service 一份。
5. **前端**：依 [frontend-feature.md](frontend-feature.md) 生成對應 list / detail / form 頁面。RTK Query codegen 依 service 拆 namespace：
   - `src/api/generated/<service-name>/` — 一個 service 一個資料夾
   - Frontend 對多 service 寫多個 `createApi` slice，**不**手動合併
   - 跨 service 的關聯資料：在 component 端 compose；不在 codegen 層合並 schema
6. **DoD**：對照 [/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md) 全項確認。

## 需求

- Entity 名稱：<填寫>
- 欄位定義：<list with type & validation>
- 權限矩陣：<誰可以做哪個操作>
- 特殊業務規則：<如有>
