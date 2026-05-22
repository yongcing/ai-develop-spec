# 後端分層與模組規範

採用 **Spring Modulith** 作為模組化基礎，再於模組內套用三層架構。

## 模組層級

```
┌──────────────────────────────────────────────────────────┐
│  Module A           Module B            Module C         │
│                                                          │
│  controller/        controller/         controller/      │
│      ↓                  ↓                   ↓            │
│  domain/  ──→ NamedInterface ←──  domain/  ──→  ...      │
│      ↓                  ↓                   ↓            │
│  infrastructure/    infrastructure/     infrastructure/  │
└──────────────────────────────────────────────────────────┘
```

### 模組規則

- 每個模組以 `package-info.java` 標註 `@ApplicationModule`
- 跨模組可見的介面 / 事件型別 = 在 `domain/` 內標 Spring Modulith `@NamedInterface`，其他都視為 module-private
- `controller/`、`infrastructure/` 對其他模組**永遠不可見**
- 跨模組溝通優先順序：
  1. **ApplicationEvents（最佳）**：解耦、可測、可改非同步
  2. **`@NamedInterface` SPI**：在 `domain/` 定義 interface 並標註 NamedInterface，目標模組實作並由 Spring 注入
  3. **直接呼叫 NamedInterface 中的 service**：可，但會增加耦合

## 模組內三層

```
controller/  (Controller + Request/Response DTO + OpenAPI 註解)
   ↓ 只能呼叫
domain/  (Service + business logic + domain event + 對外 NamedInterface)
   ↓ 只能呼叫
infrastructure/  (Repository + Entity + 外部整合)
```

### Controller (`controller/`)
- HTTP 處理、DTO ↔ domain 轉換、Bean Validation、`@PreAuthorize`、`@Operation` / `@ApiResponse`
- **禁止**：業務邏輯、直接存取 Repository、try-catch domain exception
- DTO：Request / Response 都是 **record**，位於 `controller/` package 內

### Service (`domain/`)
- 業務邏輯、編排
- **Transaction 邊界**：`@Transactional`（讀用 `readOnly = true`）
- 跨模組互動透過注入的 `@NamedInterface` 介面或發布 events
- **禁止**：依賴 web 層型別（DTO、HttpServletRequest…）、依賴其他模組的 internal class

### Repository / Infrastructure (`infrastructure/`)
- JPA Repository / MongoDB Repository / 外部 client
- Entity 定義（`@Entity` / `@Document`）
- **禁止**：業務邏輯

## DTO / Entity 邊界

- API 層用 **record DTO**（不可變、自動序列化）
- DB 層用 Entity（JPA `@Entity` 或 Mongo `@Document`）
- 兩者用手動 mapper 或 MapStruct 轉換
- **禁止** Entity 直接作為 API response 或接收 request

## 自動驗證

`src/test/java/.../ModulithTest.java`：

```java
@Test
void verifiesModularStructure() {
    ApplicationModules.of(AppApplication.class).verify();
}

@Test
void writesDocumentation() {
    ApplicationModules modules = ApplicationModules.of(AppApplication.class);
    new Documenter(modules).writeDocumentation();
}
```

並補上 ArchUnit 規則：
- `@RestController` / `@Controller` 只能在 `controller` package
- `@Entity` / `@Document` 只能在 `infrastructure` package
- `*Repository` 只能被 `domain` package import
- 跨模組 import 只允許指向對方 `domain` 內以 `@NamedInterface` 標註的型別；嚴禁指向 `controller` / `infrastructure`
