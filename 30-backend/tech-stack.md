# 後端技術棧（釘版本）

> 此清單為**強制規範**。AI 不得自行替換或升降版。變更須走 ADR。

## 應用定位

- **類型**：傳統 Web/Mobile API（CRUD + 業務邏輯為主）
- **規模**：Modular Monolith（單一部署、模組邊界清楚）
- **部署目標**：Kubernetes（本機開發以 Docker Compose 模擬依賴）

## 核心

| 類別 | 選型 | 版本 |
|------|------|------|
| 語言 | Java | 17 (LTS) |
| Framework | Spring Boot | 3.3.x |
| 模組化 | Spring Modulith | 1.2.x |
| Build tool | Maven | 3.9+ |

## 資料層

可選池（**由架構師逐模組決定**，AI 不得自行挑選；詳見 [/00-architecture/database-selection.md](../00-architecture/database-selection.md)）：

| DB | 用途定位 |
|----|---------|
| PostgreSQL 17 | 關聯型主力，需要 JSONB / 全文 / 進階索引時優先 |
| MariaDB | 關聯型替代，現有系統相容或營運偏好時使用 |
| MongoDB | 文件型 / 彈性 schema / append-only 記錄 |

**ORM / Driver：**
- 關聯型：Spring Data JPA + Hibernate
- 文件型：Spring Data MongoDB
- Migration：Flyway（SQL）+ Mongock（Mongo）

## 快取 / 訊息 / 儲存

| 類別 | 選型 | 用途 |
|------|------|------|
| 快取 / 分散式鎖 | Redis 7（Lettuce client） | hot data、session、rate limit、Shedlock |
| 訊息 | NATS / NATS JetStream | 服務內事件、非同步任務、模組間解耦 |
| 物件儲存 | S3-compatible（正式環境 S3 / 本機 MinIO） | 使用者上傳、靜態媒體 |

## API 與認證

| 類別 | 選型 |
|------|------|
| API 風格 | REST，URL path 版本（`/api/v1/...`） |
| OpenAPI | springdoc-openapi（自動生成 OpenAPI 3） |
| 驗證 | Bean Validation (Jakarta) |
| 序列化 | Jackson |
| 認證（end-user） | OAuth2 / OIDC，Spring Security Resource Server 驗 JWT |
| 認證（service-to-service） | 自簽 JWT（HMAC 或公私鑰，依架構決定） |
| 授權 | Spring Security method security (`@PreAuthorize`) |

## 可觀測性

| 類別 | 選型 |
|------|------|
| Logging | SLF4J + Logback，JSON 輸出，由 FluentBit 採集 |
| Metrics | Micrometer + Prometheus（透過 `/actuator/prometheus`） |
| Tracing | OpenTelemetry（OTLP exporter） |
| Health | Spring Actuator（`/actuator/health/{liveness,readiness}` 給 K8s probe） |

## 排程 / 背景任務

- Spring `@Scheduled` + **Shedlock**（K8s 多副本必須分散式鎖避免重複執行）
- 長時間任務一律走 NATS JetStream 非同步化，禁止同步處理超過 5 秒的任務

## 測試

| 類別 | 選型 |
|------|------|
| Unit | JUnit 5 + AssertJ + Mockito |
| Integration | Spring Boot Test + Testcontainers（PG / MariaDB / Mongo / Redis / NATS / MinIO 一律真實容器） |
| Architecture | ArchUnit（搭配 Spring Modulith 驗證模組邊界） |
| Contract | Spring Cloud Contract 或 Pact（前後端 / 模組間） |

## 程式碼品質工具鏈

- Spotless + google-java-format（提交前自動格式化，行寬 120）
- 提交前必須 `./mvnw verify` 全綠
- Pre-commit hook 建議：spotless check + 快速 unit test
