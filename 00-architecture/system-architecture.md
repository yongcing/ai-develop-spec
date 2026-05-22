# 系統架構規範

> 由架構師團隊維護。所有跨服務、跨層的設計決策來源。

## 應用拓撲（總覽）

```
┌────────────────────┐        ┌────────────────────┐
│ Next.js 16 (App R) │        │  External IdP      │
│  - RSC + Client    │◀─OIDC──│  (Keycloak/Auth0)  │
│  - RTK Query       │        └────────────────────┘
└────────┬───────────┘
         │ HTTPS / REST + JWT
         ▼
┌────────────────────────────────────────────────────┐
│ Java Modular Monolith (主幹)                       │
│ Spring Boot 3.3 + Spring Modulith                  │
│ ┌──────────┬──────────┬──────────┬──────────────┐  │
│ │ module-a │ module-b │ module-c │ module-d / …│  │
│ └────┬─────┴────┬─────┴────┬─────┴────┬─────────┘  │
│      ▼          ▼          ▼          ▼           │
│   PostgreSQL  Redis    NATS JetStream  S3 (MinIO) │
└─────────┬──────────────────────────────────────────┘
          │ REST + JWT (sync)  /  NATS + CloudEvents (async)
          ▼
┌─────────────────────────────────────────────────┐
│ Python services (按需獨立部署)                  │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ ml-inference │  │ etl-pipeline │ ... 等       │
│ │ FastAPI      │  │ FastAPI/Arq  │              │
│ └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────┘
```

**主幹**：Java modular monolith — 單一 Spring Boot fat jar 進 K8s Deployment，多副本搭配 Shedlock 處理排程一致性。

**Python services**：按需新增（ML / 資料 / Python-only 整合 / batch），**獨立 K8s Deployment**，**不**嵌入 JVM。語言選型決策見 [/30-backend/tech-decision.md](../30-backend/tech-decision.md)。

## 分層原則（前端 + 後端）

### 後端（Spring Modulith）

Java 模組內維持三層（詳見 [/30-backend-java/layering-rules.md](../30-backend-java/layering-rules.md)；Python service 結構見 [/30-backend-python/layering-rules.md](../30-backend-python/layering-rules.md)）：

```
controller/       →     domain/                 →     infrastructure/
(HTTP + DTO)            (service + business              (Repository + Entity
                         logic + tx 邊界)                  + 外部整合)
```

- **依賴方向只能向下**：上層可呼叫下層，下層**不得**反向引用上層
- **單一交易邊界**：`domain/` 內 service 擁有 `@Transactional`；controller 與 repository 都不開交易
- **DTO 不得跨層流通**：controller 用 web DTO；domain service 用 domain object；repository 回 entity。轉換在邊界
- **跨模組溝通**：禁止跨模組 `@Autowired` 別人的 service；改走「published event（NATS）」或「目標模組 `domain/` 內以 `@NamedInterface` 標註的 SPI 介面」。ArchUnit 強制驗證。

### 前端（Next.js feature-sliced）

```
src/
├── app/             # 路由層（RSC，盡量無邏輯）
├── features/<x>/    # 功能切片（不放 RTK Query；server state 一律從 src/api/ 取）
│   ├── components/  # feature 專用元件
│   ├── hooks/       # 邏輯 hook（不含 server-state hook；可包 RTK hook 加業務邏輯）
│   ├── schemas/     # Zod / 驗證 schema
│   └── types/
├── components/ui/   # 跨 feature 共用 UI 元件（自建）
├── api/             # **唯一** RTK Query 落點：baseApi、generated、extended
├── store/           # Redux store 設定
└── lib/             # 純工具函式（無 framework 依賴）
```

- **路由層不寫業務邏輯**：`app/` 內只做組合與 layout
- **features 之間禁止相互 import**：要共用就上抽到 `components/ui/` 或 `lib/`
- **單向依賴**：`app` → `features` → `components/ui` → `lib`；反向違規由 ESLint `eslint-plugin-boundaries` 或 `dependency-cruiser` 擋

## 服務切分原則

**Java 主幹預設單體 (Modular Monolith)**，符合 [/30-backend-java/tech-stack.md](../30-backend-java/tech-stack.md)。Python component 採用本身即為「拆服務」決策，見 [/30-backend/tech-decision.md](../30-backend/tech-decision.md)。

### 何時保持單體

- 團隊 < 30 人、單一部署單元仍可消化負載
- 模組邊界靠 Spring Modulith + ArchUnit 維持，足以擋住耦合
- 大部分本平台情境

### 何時拆服務（須走 ADR）

只在出現以下「強訊號」之一才考慮：

1. **獨立擴展需求**：某模組需要與主體不同的副本數 / 資源規格（如 query/analytics 變重）
2. **獨立發布節奏**：某模組需要與主體不同的部署頻率或停機窗
3. **語言/runtime 需求衝突**：例如 ML 推論需 Python，無法塞進 Spring
4. **法遵隔離**：資料需放不同網段 / 帳號
5. **第三方整合的高失敗率**：對接外部不穩定服務時，隔離爆炸半徑

不能用「微服務比較流行」「我覺得會變大」這種理由拆。

### 服務間溝通

- **同步**：REST + JWT（內部走 mTLS 或服務網格）；用 `@PreAuthorize` + service-to-service JWT 控制
- **非同步**：NATS JetStream + CloudEvents 信封；訊息一律 at-least-once，consumer 必須冪等
- **禁止**：跨服務直連對方資料庫；對方 DB 永遠透過對方 API

## 圖表

放在 [diagrams/](diagrams/) 目錄，優先 mermaid（PNG 只在 mermaid 無法表達時）。
更新後在 PR description 貼新圖。

## 對 AI 生成行為的影響

- 後端：生成 controller / service / repository 必須三層分離；跨模組必走 events 或公開 API
- 後端：禁止 controller 內加 `@Transactional`
- 前端：features 間 import 必須被 ESLint 擋；發現要共用即抽到 `components/ui/`
- 任何「拆服務」「合服務」「跨服務直連 DB」決定都要先有 ADR，AI 不得自行決定
