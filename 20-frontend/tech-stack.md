# 前端技術棧（釘版本）

> 此清單為**強制規範**。AI 不得自行替換或升降版。變更須走 ADR。

## 應用定位

- **類型**：面向使用者的 Web App（登入後使用為主，互動豐富）
- **渲染策略**：Next.js App Router + **React Server Components 為主**，互動部分標 `'use client'`
- **SEO**：以登入後為主，公開頁面（如首頁、行銷頁）才需要 SEO

## 核心

| 類別 | 選型 | 版本 |
|------|------|------|
| 語言 | TypeScript | 5.x（strict + 額外 lint） |
| Framework | Next.js | 16.x（App Router） |
| Runtime | Node.js | 22.x（LTS） |
| Package manager | npm | 隨 Node 22 |

### TypeScript 額外設定（必須）

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 狀態管理

| 類別 | 選型 |
|------|------|
| Store | **Redux Toolkit** |
| Server state / API | **RTK Query**（與後端 OpenAPI codegen） |
| Form | React Hook Form + Zod |

## UI

| 類別 | 選型 |
|------|------|
| Styling | **Tailwind CSS 4** |
| 互動 / a11y primitives | **Radix UI**（`@radix-ui/react-*`） |
| 元件樣式 | 自建（基於 Radix primitives + Tailwind） |
| Icon | lucide-react |
| Animation | Framer Motion（需要時引入） |

> 不採用 shadcn/ui、Mantine、MUI 等成品庫；元件統一在 `components/ui/` 自建並由前端 lead 收斂。

## API 整合

- 後端提供 OpenAPI 3 spec
- 使用 **`@rtk-query/codegen-openapi`** 從 spec 自動產生 RTK Query API
- 生成檔案放於 `src/api/generated/<service-name>/`（一個 backend service 一個子資料夾，多 service 並存時禁止合併 spec），**禁止手改**
- 如需擴充（cache、transformResponse）在 `src/api/extended/` 包裝

## 測試

| 類別 | 選型 |
|------|------|
| Unit / Component | **Vitest** + **Testing Library** |
| E2E / Regression | **Cypress** |
| Mock | MSW（Mock Service Worker） |

## 工具鏈

- ESLint（含 `@typescript-eslint`、`eslint-plugin-react-hooks`、`eslint-plugin-jsx-a11y`）
- Prettier
- Husky + lint-staged pre-commit
- 必須通過：`npm run lint && npm run typecheck && npm run test`
