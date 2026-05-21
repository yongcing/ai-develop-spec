# 後端編碼規範

## 命名

| 對象 | 規則 | 範例 |
|------|------|------|
| Class | PascalCase | `OrderService` |
| Interface | PascalCase，不加 `I` 前綴 | `OrderRepository` |
| 實作類 | 具體命名優先；單一實作可加 `Impl` | `JpaOrderRepository` 或 `OrderServiceImpl` |
| Method / 變數 | camelCase | `createOrder`, `orderId` |
| 常數 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Package | 全小寫，無底線 | `com.company.app.order.domain` |
| 測試 class | `<被測類>Test` / `<被測類>IT` | `OrderServiceTest`, `OrderControllerIT` |

## DTO / Entity / Mapper

### DTO
- **預設用 Java `record`**（不可變、自動 equals/hashCode、Jackson 原生支援）
- **需要 builder 的複雜 DTO** 才用 `class` + Lombok `@Builder`
- DTO 命名：`<Entity>Request`、`<Entity>Response`、`<Entity>Summary`、`Create<Entity>Command` 等表意命名

### Mapper
- **由 Entity 提供 static 轉換 method**：
  ```java
  // Entity 內
  public static OrderEntity fromCommand(CreateOrderCommand cmd) { ... }
  public OrderResponse toResponse() { ... }
  ```
- 禁止在 Controller 內寫轉換邏輯
- 不引入 MapStruct（避免額外依賴）

### Entity
- JPA `@Entity` 或 Mongo `@Document`
- 禁止加任何 Jackson 註解
- ID 一律用 `Long`（JPA auto-generated）或 `UUID`
- 必要的 audit 欄位：`createdAt`, `updatedAt`, `createdBy`, `updatedBy`（用 JPA Auditing）

## Lombok 使用

**全面使用**，常用組合：

| 註解 | 用途 |
|------|------|
| `@RequiredArgsConstructor` | Constructor injection（取代 `@Autowired`） |
| `@Slf4j` | 注入 logger |
| `@Builder` | 複雜 DTO / Entity 的 builder |
| `@Getter` / `@Setter` | Entity 欄位存取 |
| `@EqualsAndHashCode(of = "id")` | Entity 只用 ID 比對 |
| `@ToString(exclude = {"password"})` | 排除敏感欄位 |

**注意事項：**
- 禁止 `@Data` 用於 JPA Entity（會觸發雙向關聯遞迴 toString / equals）
- DTO 預設用 `record`，不需要 Lombok

## Java 慣用法

- 偏好 `Optional<T>` 表達「可能不存在」，禁止 method 回傳 `null`
- 使用 Java 17 features：`record`、`sealed` interface、pattern matching、`switch` expression、text block
- 集合操作偏好 Stream API（可讀性優先）
- 不可變集合用 `List.of()` / `Map.of()` / `Set.of()`
- 日期時間一律 `java.time.*`，禁止 `Date` / `Calendar`
- 金額使用 `BigDecimal`，禁止 `double` / `float`

## 注釋

- **預設不寫**
- 公開 API（Service public method、SPI）需要 Javadoc：描述**契約**與**為什麼**，非實作細節
- 禁止「這個 method 做什麼」的廢話注釋（命名要清楚到不需要）
- 註解 `// TODO` 必須連結 issue 編號

## Logging 規範

### 結構化 log（必須）
所有 log 用 SLF4J + key-value 結構（MDC + structured arguments）：

```java
log.info("order created orderId={} userId={} amount={}", orderId, userId, amount);
// 或用 net.logstash.logback 的 StructuredArguments
log.info("order created", kv("orderId", orderId), kv("userId", userId));
```

### 等級規則
| 等級 | 用途 |
|------|------|
| TRACE | **僅本機**，禁止在正式環境啟用 |
| DEBUG | 開發除錯細節 |
| INFO | 業務事件（訂單建立、登入）、startup |
| WARN | 異常但可恢復、4xx 路徑 |
| ERROR | 系統錯誤、500 路徑 |

### 必須遵守
- ✅ 所有 ERROR log 必須包含 `traceId`（從 OpenTelemetry MDC 取）
- ✅ 跨服務 / 跨模組呼叫前後都應 log（INFO 或 DEBUG）
- ✅ 敏感資料一律遮罩或省略：密碼、token、信用卡、身分證、Email（部分遮罩）、手機（部分遮罩）
- ✅ 遮罩用統一 utility：`MaskUtils.maskEmail(...)`、`MaskUtils.maskPhone(...)`

### 禁止
- ❌ `System.out.println` / `e.printStackTrace()`
- ❌ Log 明文密碼、JWT token、API key、Refresh token
- ❌ 完整 dump request / response body（如需 audit，用獨立的 audit logger 且做遮罩）
- ❌ 在 hot path 用字串串接組 log message（用 `{}` placeholder）

## 格式化

- Spotless + google-java-format
- 行寬 120
- 提交前自動格式化（pre-commit hook）

## Git

- Commit message：Conventional Commits（`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`）
- 分支：`feature/<ticket>-<slug>`、`fix/<ticket>-<slug>`
- 禁止直接 push 到 `main`，必須走 PR
