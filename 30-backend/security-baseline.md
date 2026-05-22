# 後端安全基線（語言無關）

> 適用於本系統所有後端服務。
> 語言層級的實作細節：[30-backend-java/security-baseline.md](../30-backend-java/security-baseline.md)、[30-backend-python/security-baseline.md](../30-backend-python/security-baseline.md)。

## 認證模型（雙軌）

本系統存在兩類呼叫者，必須以**獨立的 auth chain / middleware** 分開處理：

### 1. End-user 請求（前端、行動 app）

- 機制：**OAuth2 / OIDC**，由獨立 IdP 簽發 token
- Token：第三方 IdP 簽發的 JWT（OIDC `id_token` 或 access token）
- 驗證：JWK Set URI 由 IdP 提供，runtime 取得後驗證 signature + `iss` + `aud` + `exp`
- Claim → 角色：透過映射層，把 claim 轉成內部角色 / permission

### 2. Service-to-service 請求（內部服務、批次工具）

- 機制：**自簽 JWT**
- 簽章演算法：建議 RS256（公私鑰）；HS256 僅限完全內部、密鑰嚴格管控的情境
- 必須包含 claim：`iss`、`aud`、`exp`（≤ 15 分鐘）、`sub`（呼叫者識別）
- 驗證路徑：獨立 auth chain，僅作用於 `/api/v1/internal/**` 或標記為內部的 endpoint
- 兩類認證**不共用** chain（防 token 誤用）

## 授權

- **預設 deny**：所有 endpoint 預設需要認證，公開 endpoint 必須**明確列舉**
- **方法層級**：權限檢查貼在 service / handler 層的方法上，不寫在 controller 之外的鬆散位置
- **資源所有權檢查**：例如「只能存取自己的訂單」必須在 service 層 / DB query filter 加 owner 條件，**不依賴**前端 filter 後讀全表
- **未授權回應**：未認證 → 401；認證但無權限 → 403

## 必須遵守（跨語言）

- ✅ 所有輸入做 schema-level validation（Java: Bean Validation；Python: Pydantic）
- ✅ 密碼 hash：使用語言對應的 Bcrypt / Argon2 函式庫，cost / iterations 取至少 NIST 建議值
- ✅ Secrets 由 K8s Secret / 環境變數注入，禁止寫死於程式碼或 config 檔
- ✅ SQL 一律參數化（ORM 預設行為）；NoSQL query 也要避免直接拼接使用者輸入
- ✅ 對外 API 必須有 rate limiting（建議 Redis bucket per user / per IP）
- ✅ CORS 白名單明確設定，禁止 `*`
- ✅ 上傳檔案：MIME 檢查、大小限制、病毒掃描（若涉及外部使用者）、存物件儲存時隨機化路徑

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
- ❌ 不同認證機制共用同一 auth chain
- ❌ JWT 簽章金鑰寫死或 commit 進 repo
