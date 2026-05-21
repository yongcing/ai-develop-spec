# 後端分層與模組規範

採用 **Spring Modulith** 作為模組化基礎，再於模組內套用三層架構。

## 模組層級

```
┌─────────────────────────────────────────────┐
│  Module A         Module B        Module C  │
│  ┌─────┐         ┌─────┐         ┌─────┐    │
│  │ api │ ──→ 公開介面/事件 ←── │ api │     │
│  └─────┘         └─────┘         └─────┘    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ domain  │    │ domain  │    │ domain  │  │
│  └─────────┘    └─────────┘    └─────────┘  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │ infra    │   │ infra    │   │ infra    │ │
│  └──────────┘   └──────────┘   └──────────┘ │
└─────────────────────────────────────────────┘
```

### 模組規則

- 每個模組以 `package-info.java` 標註 `@ApplicationModule`
- 模組 `api/` 為唯一對外入口（DTO、SPI 介面、發布的 events）
- `domain/` 與 `infrastructure/` 對其他模組**不可見**
- 跨模組溝通優先順序：
  1. **ApplicationEvents（最佳）**：解耦、可測、可改非同步
  2. **公開 SPI 介面**：在 `api/` 定義 interface，目標模組實作並由 Spring 注入
  3. **直接呼叫 api/ 中的 service**：可，但會增加耦合

## 模組內三層

```
api/  (Controller + DTO + 對外 event/SPI)
   ↓ 只能呼叫
domain/  (Service + business logic + domain event)
   ↓ 只能呼叫
infrastructure/  (Repository + Entity + 外部整合)
```

### Controller (api/)
- HTTP 處理、DTO ↔ domain 轉換、Bean Validation、`@PreAuthorize`
- **禁止**：業務邏輯、直接存取 Repository、try-catch domain exception

### Service (domain/)
- 業務邏輯、編排
- **Transaction 邊界**：`@Transactional`（讀用 `readOnly = true`）
- 跨模組互動透過注入的 SPI 介面或發布 events
- **禁止**：依賴 web 層型別、依賴其他模組的 internal class

### Repository / Infrastructure (infrastructure/)
- JPA Repository / MongoDB Repository / 外部 client
- Entity 定義
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
- Controller 只能在 `api` package
- `@Entity` / `@Document` 只能在 `infrastructure` package
- `*Repository` 只能被 `domain` package import
- 跨模組 import 必須以對方的 `api` 為起點
