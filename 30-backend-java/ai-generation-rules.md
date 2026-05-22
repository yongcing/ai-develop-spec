# 後端 AI 生成硬規則

> 機械化可驗證的規則。AI 違反者 = PR 直接 reject。
> 對應檢查工具：Maven verify（Spotless + ArchUnit + Testcontainers）。

## 必須 (MUST)

### 結構與分層
- ✅ 採 **Spring Modulith** 模組結構：`com.<org>.<module>.{controller, domain, infrastructure}`（package root 不含 `.app`）
- ✅ 模組間**僅能透過 public API package 或 Spring Modulith ApplicationEvents 互動**，禁止跨模組直接 import internal class
- ✅ 嚴格分層：Controller → Service → Repository。Controller 不得呼叫 Repository
- ✅ Controller 只處理 HTTP 與 input validation，業務邏輯一律在 Service

### Persistence
- ✅ DB 選型必須對齊架構師的決定，新增 DB 種類或選型衝突時**先停下確認**
- ✅ 關聯型 DB schema 變更必須產生 **Flyway** migration（`V<timestamp>__<desc>.sql`）
- ✅ MongoDB schema 變更必須產生 **Mongock** changelog
- ✅ JPA 關聯查詢必須用 **fetch join / `@EntityGraph` / projection** 避免 N+1
- ✅ `@Transactional` **只能標於 Service 層**，且必須明確 `readOnly` 屬性
- ✅ 涉及多筆寫入的 Service method 必須在單一 transaction 內

### API
- ✅ 所有 endpoint 必須在 `/api/v1/...` 路徑下
- ✅ 所有 endpoint 必須有 OpenAPI 註解（`@Operation`, `@ApiResponse`）
- ✅ 所有 request DTO 必須有 Bean Validation 註解
- ✅ **所有 list endpoint 必須分頁**（`Pageable` + `Page<T>` response），預設 max page size = 100
- ✅ 錯誤回應使用 RFC 7807 Problem Details 格式（透過 `@RestControllerAdvice`）
- ✅ End-user endpoint 走 OIDC token；service-to-service endpoint 走自簽 JWT，二者 SecurityFilterChain 分開

### 可觀測性
- ✅ 所有 Service 方法錯誤路徑必須 log（含 traceId）
- ✅ 跨服務 / 跨模組 / 外部 API 呼叫必須有 OpenTelemetry span
- ✅ 自訂 metric 透過 Micrometer 註冊，命名 `app.<module>.<metric>`

### 測試
- ✅ Service public method 必須有 unit test
- ✅ Controller 必須有 integration test（Testcontainers 起真實依賴）
- ✅ 模組邊界與分層由 **ArchUnit + Spring Modulith `verify()`** 驗證

### 排程
- ✅ `@Scheduled` 方法必須加 Shedlock 註解，避免 K8s 多副本重複執行

## 禁止 (MUST NOT)

### 結構
- ❌ Controller 注入 Repository
- ❌ 模組 A 直接 import 模組 B 的 internal class（必須走 public API 或事件）
- ❌ Service 互相循環依賴
- ❌ `@Autowired` field injection（必須 constructor injection，建議搭配 Lombok `@RequiredArgsConstructor` 或手寫）

### Persistence / 效能
- ❌ N+1 query：禁止在 loop 內觸發 lazy load 或 Repository 呼叫
- ❌ **未分頁的 list endpoint** 或回傳 `List<T>` 給可能成長的查詢
- ❌ 在 Entity 上加 Jackson 註解
- ❌ Entity 直接序列化為 API response（必須轉 DTO，建議 `record`）
- ❌ 直接拼接 SQL / JPQL 字串（必須參數化）

### 並行 / 狀態
- ❌ Shared mutable state：static 變數、singleton bean 內的 mutable field（除非用 `AtomicX` / `ConcurrentX` 且有充分理由）
- ❌ 在 Controller / Service 內 `new Thread()` 或自建 thread pool（必須用 Spring 管理的 `TaskExecutor`）

### 錯誤處理
- ❌ Catch `Exception` 後 swallow 不處理或不 rethrow
- ❌ Controller 內 try-catch 處理 domain exception（必須丟給 `@RestControllerAdvice`）
- ❌ 把 stack trace / 內部訊息直接回傳給 client

### 其他
- ❌ `System.out.println` / `e.printStackTrace()`（必須用 SLF4J logger）
- ❌ 引入未列在 [tech-stack.md](tech-stack.md) 的新套件（須先提 ADR）
- ❌ Secrets 寫死於程式碼或 `application.yml`（必須由環境變數 / K8s Secret 注入）
- ❌ 同步處理預期超過 5 秒的任務（必須丟 NATS 非同步）

## 套件結構（Spring Modulith）

```
com.<org>/
├── <module-a>/
│   ├── package-info.java          # @ApplicationModule 宣告
│   ├── controller/                # HTTP 層：Controller + Request/Response DTO + OpenAPI 註解
│   ├── domain/                    # 業務層：Service、business logic、domain event、跨模組 SPI interface（@NamedInterface）
│   ├── infrastructure/            # 持久化 + 外部整合：Repository、Entity、外部 client
│   └── config/                    # 該模組的 @Configuration
├── <module-b>/
│   └── ...
├── shared/                        # 跨模組共用的純技術型工具（無業務邏輯）
└── AppApplication.java
```

跨模組溝通：對外介面（SPI interface、發布的 event 型別）放在 `domain/`，用 Spring Modulith `@org.springframework.modulith.NamedInterface` 標註讓 ArchUnit 認得是公開介面。

## 自動化檢查（CI 必過）

```bash
./mvnw verify
# 包含：spotless:check、test、failsafe（integration test）、archunit、modulith verify、jacoco:check
```

**Coverage 門檻**：JaCoCo `jacoco:check` 至少 **70% line coverage**（與 Python 對齊）。在 `pom.xml` 設定：

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <executions>
    <execution>
      <id>check</id>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <element>BUNDLE</element>
            <limits>
              <limit><counter>LINE</counter><value>COVEREDRATIO</value><minimum>0.70</minimum></limit>
            </limits>
          </rule>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```
