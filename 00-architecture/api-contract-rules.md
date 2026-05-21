# API 契約規範

## REST 設計

- 版本策略：URL path `/api/v1/...`
- 命名：複數名詞、kebab-case
- 錯誤格式：RFC 7807 Problem Details
- 認證：待補

## OpenAPI

- 所有 endpoint 必須有 OpenAPI 註解
- Spec 自動產生並提交至 repo
- 前端透過 spec 自動生成 client

## 待補

- gRPC 使用情境
- 事件 schema（若採用事件驅動）
