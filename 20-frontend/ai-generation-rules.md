# 前端 AI 生成硬規則

> 機械化可驗證的規則。AI 違反者 = PR 直接 reject。
> 對應檢查：`npm run lint && npm run typecheck && npm run test`。

## 必須 (MUST)

### 結構與型別
- ✅ 所有 component 用 **function component + hooks**
- ✅ 所有 prop / state / 函式參數與回傳值必須有 TypeScript 型別
- ✅ Server / API data 型別來自 **OpenAPI codegen**（`src/api/generated/`），禁止手寫對應型別

### Next.js 與渲染
- ✅ **App Router + RSC 為主**：預設 Server Component；只有需要互動 (hooks、event handler、Redux) 時才加 `'use client'`
- ✅ `'use client'` 元件盡量下推到「葉節點」，避免整顆樹變 client
- ✅ Data fetching：RSC 內可直接 await server-side fetch；client component 必須走 **RTK Query hook**

### State 與資料
- ✅ Server state 一律走 **RTK Query hook**（`useGetXxxQuery` / `useXxxMutation`）
- ✅ Cross-component shared client state 走 Redux Toolkit slice
- ✅ Component-local state 才用 `useState` / `useReducer`
- ✅ Form 一律使用 **React Hook Form + Zod resolver**
- ✅ 所有 schema validation 用 Zod，並 export `z.infer<typeof schema>` 為型別

### UI 與樣式
- ✅ 樣式使用 **Tailwind utility class** + design tokens
- ✅ 互動元件（dropdown、dialog、tooltip、tabs、popover 等）**必須**基於 **Radix UI primitives** 包裝，禁止從零造輪子
- ✅ 自建元件放於 `src/components/ui/`，先檢查是否已存在再新增
- ✅ 互動元件必須**鍵盤可達** + 正確 ARIA（Radix 提供基礎，自製部分不得退化）
- ✅ 每個 page-level component 必須處理 **loading / error / empty** 三狀態

### 檔案組織
- ✅ Feature 按模組組織：`src/features/<name>/{components, hooks, schemas, types}`
- ✅ 命名：component PascalCase、hook 以 `use` 開頭、util camelCase、Zod schema 以 `Schema` 後綴

## 禁止 (MUST NOT)

### 型別
- ❌ **`any`**（除非標註 `// ai-allow: any <具體理由>` 並由 reviewer 核可）
- ❌ **`as` type assertion 用於掃除編譯錯誤**（修型別、不要掩蓋；極少數合法情境須加註解說明）
- ❌ `@ts-ignore` / `@ts-expect-error` 無說明
- ❌ `unknown` 後不做 narrowing 直接使用

### State / 資料
- ❌ **`useEffect` 內 fetch**（必須用 RTK Query hook 或 RSC server-side fetch）
- ❌ `axios` / `fetch` 直接寫在 component 內
- ❌ 手寫對應後端 schema 的 TS interface（必須來自 OpenAPI codegen）
- ❌ 修改 `src/api/generated/` 內生成的檔案
- ❌ 在 Redux store 存非序列化值（Date object、function、class instance）

### 樣式
- ❌ **寫死顏色 / 間距**：`bg-[#3366ff]`、`p-[13px]`、`text-[15px]`、`mt-[7px]` 一律禁止
- ❌ 內聯 `style={{}}`（極少數動態值例外，須加註解）
- ❌ 全域 CSS（除了 `globals.css` 的 reset / Tailwind directive）
- ❌ 自製已有 Radix primitive 的元件（dialog、dropdown 等）

### Next.js
- ❌ Client Component 內 import 大型 server-only 套件（避免 bundle 膨脹）
- ❌ 在 Server Component 內用 hooks / event handler / 瀏覽器 API
- ❌ `'use client'` 標在 layout 最上層導致整個 tree 變 client

### 安全 / 權限
- ❌ **前端 route guard 取代後端授權**：所有權限決定權在後端，前端的 guard 僅用於 UX（隱藏不可用功能），絕不可作為唯一防線
- ❌ 把 JWT / refresh token 存 localStorage（必須 HttpOnly Cookie 或 sessionStorage 視情境）
- ❌ `dangerouslySetInnerHTML` 不經 sanitize

### a11y
- ❌ 自製互動元件未提供鍵盤操作
- ❌ 點擊 handler 加在非互動元素上不補 role 與鍵盤事件
- ❌ 圖片缺 `alt`

## 套件結構

```
src/
├── app/                       # Next.js App Router（layouts、pages、route handlers）
├── features/<name>/           # 功能模組
│   ├── components/            # 該 feature 的 components
│   ├── hooks/                 # 該 feature 的 hooks
│   ├── schemas/               # Zod schemas
│   └── types/                 # 衍生型別（非 API 型別）
├── components/ui/             # 跨 feature 共用 UI（基於 Radix）
├── store/                     # Redux Toolkit store + slices
├── api/
│   ├── generated/             # OpenAPI codegen，禁止手改
│   └── extended/              # 擴充 / 包裝
├── lib/                       # 純函式工具
└── styles/                    # Tailwind config 與 globals
```

## 自動化檢查（CI 必過）

```bash
npm run lint        # ESLint + jsx-a11y
npm run typecheck   # tsc --noEmit (strict + extra)
npm run test        # Vitest
```
