# 後端語言選型決策（Java vs Python）

> 本系統後端為多語言：Java（主幹）+ Python（特殊用途）。
> 「這個 component 用哪個語言」**由架構師決定**，並寫進該 component 的 README / ADR。
> AI 拿到任務時，先看「component 已被標註為哪個語言」→ 讀取對應子目錄規範。

## 規則速覽

| 規則 | 內容 |
|------|------|
| 預設 | **由架構師決定**，無自動預設 |
| Java component 必讀 | [/30-backend/](.) + [/30-backend-java/](../30-backend-java/) |
| Python component 必讀 | [/30-backend/](.) + [/30-backend-python/](../30-backend-python/) |
| Python 部署模式 | **僅獨立服務**（不可嵌入 Java 主幹 JVM）|
| 跨語言互動 | REST + JWT（同步）/ NATS + CloudEvents（非同步）|

## 架構師決策參考

不是硬性規則，是給架構師選型時的判斷材料。

### 適合採用 Python 的情境

- **ML / AI inference**：PyTorch、TensorFlow、Transformers、scikit-learn 為核心
- **資料科學 / 數值運算**：pandas、NumPy、SciPy、Polars 是主要工具
- **Python-only 第三方依賴**：LangChain、特定 vendor SDK 僅有 Python 版
- **腳本 / batch / ETL**：以 Airflow / Prefect / Dagster 編排的批次工作
- **快速 PoC / 實驗工具**：明確標記為非長期維運的試驗性 component

### 適合採用 Java 的情境（本系統主幹）

- **核心交易邏輯**：強型別 + 大型 modular monolith + Spring 生態系
- **JPA / Hibernate 交易保證**：複雜交易邊界
- **Spring Modulith 模組邊界**：用 ArchUnit 強制驗證的場景
- **與既有 Java module 高度耦合**：避免無謂的跨語言介面

### 不算理由

- ❌「我比較熟 Python」
- ❌「FastAPI 比 Spring Boot 啟動快」
- ❌「Python code 比較簡潔」
- ❌「未來可能要做 ML」（要做才換，不要先換）

## 部署 / 互動

### Python = 獨立服務

Python component **不可**塞進 Java 主幹的 JVM（runtime 不相容）。
採用 Python 即觸發 [/00-architecture/system-architecture.md](../00-architecture/system-architecture.md) 的「拆服務」決策 — Python 服務獨立部署、獨立 K8s Deployment。

### 跨語言互動

| 模式 | 通訊 | 契約 |
|------|------|------|
| 同步請求 | REST over HTTPS | OpenAPI 3.1（Java springdoc / Python FastAPI 都自動產） |
| 非同步事件 | NATS JetStream | CloudEvents v1.0 envelope + JSON Schema payload |
| 認證 | Bearer JWT | 同 [/30-backend/security-baseline.md](security-baseline.md)，雙語言共用 |
| 錯誤格式 | RFC 7807 Problem Details | 同 [/30-backend/error-handling.md](error-handling.md)，雙語言共用 |

語言切換不應改變對外契約。

## Component 標註

每個 backend component 的 README（或 module-level doc）開頭要明寫：

```markdown
**Language**: Java | Python
**Spec**: [/30-backend-<language>/](../../spec/30-backend-<language>/)
```

AI 接到任務時讀這行 → 決定載入哪份 ai-generation-rules.md。

## 對 AI 生成行為的影響

- 開始 backend 任務前先確認 component README 標註 `Language`，否則停下回報
- **Java component**：必讀 [/30-backend/](.) 全部 + [/30-backend-java/ai-generation-rules.md](../30-backend-java/ai-generation-rules.md)
- **Python component**：必讀 [/30-backend/](.) 全部 + [/30-backend-python/ai-generation-rules.md](../30-backend-python/ai-generation-rules.md)
- **不准跨語言實作同一個 component**（例：不能在 Java 主幹裡呼叫 Python script subprocess）— 要 Python 邏輯就拆服務
- **不准自行決定語言**：規格未指定時，視為缺料 hard stop
