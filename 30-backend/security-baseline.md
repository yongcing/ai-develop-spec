# 後端安全基線

## 認證模型（雙軌）

本系統存在兩類呼叫者，必須以**獨立 SecurityFilterChain** 分開處理：

### 1. End-user 請求（前端、行動 app）
- 機制：**OAuth2 / OIDC**，Spring Security Resource Server
- Token：第三方 IdP 簽發的 JWT（OIDC `id_token` 或 access token）
- 驗證：JWK Set URI 由 IdP 提供，Spring 自動驗簽 + 過期 + audience
- Claim → 角色映射：透過 `JwtAuthenticationConverter`

### 2. Service-to-service 請求（內部服務、批次工具）
- 機制：**自簽 JWT**
- 簽章演算法：建議 RS256（公私鑰）；HS256 僅限完全內部、密鑰嚴格管控的情境
- 必須包含 claim：`iss`、`aud`、`exp`（≤ 15 分鐘）、`sub`（呼叫者識別）
- 驗證路徑：獨立的 `SecurityFilterChain`，僅作用於 `/api/v1/internal/**` 或標記為內部的 endpoint

## 授權

- 使用 Spring Security method security：`@PreAuthorize("hasRole('XXX')")`
- 預設 deny：所有 endpoint 預設需要認證，公開 endpoint 必須在 `SecurityConfig` **明確列舉**
- 對資源所有權的檢查（例如「只能存取自己的訂單」）必須在 Service 層用 `@PostAuthorize` 或顯式檢查

## 必須遵守

- ✅ 所有輸入通過 Bean Validation
- ✅ 密碼 hash：BCrypt（cost ≥ 12）
- ✅ Secrets 由 K8s Secret / 環境變數注入，禁止寫死於程式碼或 `application.yml`
- ✅ SQL 必須參數化（JPA / prepared statement）
- ✅ 對外 API 必須有 rate limiting（Redis 實作，bucket per user / per IP）
- ✅ CORS 白名單明確設定，禁止 `*`
- ✅ 上傳檔案：MIME 檢查、大小限制、病毒掃描（若涉及外部使用者）、存 S3 時隨機化路徑

## 必須記錄（audit log）

- 登入 / 登出 / token refresh
- 權限變更
- 敏感資料存取 / 修改
- 失敗的授權嘗試（連續失敗應觸發告警）

audit log 與一般 app log 分流（建議寫到獨立 logger / topic）。

## 禁止

- ❌ 在 log 中輸出密碼、token、PII（生日、身分證、信用卡）
- ❌ 把 user input 直接拼進 SQL / OS command / file path
- ❌ 回傳完整 stack trace 給 client
- ❌ 不同認證機制共用同一個 SecurityFilterChain
- ❌ JWT 簽章金鑰寫死或 commit 進 repo
