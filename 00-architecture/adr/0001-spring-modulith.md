# ADR-0001: 採用 Spring Modulith 作為後端模組化策略

- 狀態：Accepted
- 日期：2026-05-21
- 決策者：架構師團隊

## 背景

後端應用屬於傳統 Web/Mobile API（CRUD + 業務邏輯），預期規模為 Modular Monolith：
- 單一部署簡化運維（K8s 上一個 Deployment）
- 模組邊界要清楚以便未來可拆服務
- AI 生成程式碼會大量發生，**模組邊界必須機械化可驗證**，否則 AI 容易跨模組亂 import 造成耦合腐化

候選方案需要同時滿足：
1. 單一 Spring Boot app 內表達模組
2. 模組間依賴可被靜態驗證
3. 支援事件解耦
4. 不引入大量 boilerplate

## 考慮過的選項

### 選項 A：純 package convention + ArchUnit
單純用 package 結構約定 + ArchUnit 規則驗證。

- ✅ 零額外依賴
- ❌ 模組對外介面靠約定，AI 容易繞過
- ❌ 事件解耦要自己造輪子
- ❌ 模組文件需手寫

### 選項 B：Spring Modulith
官方套件，提供 `@ApplicationModule` 標註、模組驗證、事件機制、自動產生 C4 圖。

- ✅ Spring 官方支援、與 Boot 3.x 無縫整合
- ✅ `ApplicationModules.verify()` 自動檢查模組邊界
- ✅ 內建 ApplicationEvents 跨模組通訊
- ✅ 自動產生模組關係圖與文件
- ⚠️ 1.x 版本（生態仍在演進）
- ⚠️ 對團隊是新概念，需要學習

### 選項 C：拆成多個 Maven module
用 Maven multi-module 強制依賴方向。

- ✅ 物理隔離最強
- ❌ build 複雜度大幅上升
- ❌ 開發迭代慢（每次 module 變更要重新 install）
- ❌ 對「未來可能拆服務」這個目標來說過早

## 決定

採用 **選項 B：Spring Modulith**。

理由：
- 在「邊界清楚」與「迭代速度」之間取得最佳平衡
- 官方背書，與既有技術棧無摩擦
- 提供 AI 生成程式碼最需要的「機械化邊界檢查」（`ApplicationModules.verify()` 進 CI）
- 未來真要拆服務時，每個 module 已經有清楚的 api 邊界，遷移成本低

## 後果

### 正面影響
- 模組邊界由 CI 強制執行，AI 違規無法合併
- 跨模組 ApplicationEvents 提供解耦預設路徑
- 自動產生模組文件降低維護成本

### 負面影響 / 取捨
- 團隊需要學習 Spring Modulith 概念與最佳實踐
- 1.x 版本未來可能有 API 變動，升級需評估

### 對 AI 生成行為的影響
- AI 必須將新功能放入特定 module（`com.company.app.<module>.{api,domain,infrastructure}`）
- AI 跨模組溝通必須使用 ApplicationEvents 或目標模組 `api` package 中的介面
- AI 不得直接 import 其他模組的 `domain` / `infrastructure` 內容
- 規則寫於 [/30-backend/ai-generation-rules.md](../../30-backend/ai-generation-rules.md) 與 [/30-backend/layering-rules.md](../../30-backend/layering-rules.md)

## 相關文件

- [/30-backend/tech-stack.md](../../30-backend/tech-stack.md)
- [/30-backend/layering-rules.md](../../30-backend/layering-rules.md)
- [Spring Modulith Reference](https://docs.spring.io/spring-modulith/reference/)
