# 前端編碼規範

## 命名

| 對象 | 規則 | 範例 |
|------|------|------|
| Component | PascalCase | `UserCard.tsx` |
| Hook | camelCase 且 `use` 開頭 | `useUserProfile.ts` |
| Util | camelCase | `formatDate.ts` |
| 常數 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Type / Interface | PascalCase，不加 `I` 前綴 | `UserProfile` |
| Zod schema | PascalCase + `Schema` 後綴 | `UserProfileSchema` |
| Redux slice | camelCase | `userSlice.ts` |
| RTK Query API | camelCase + `Api` 後綴 | `userApi.ts` |

## Component 結構

```tsx
'use client'; // 僅在需要時加

// 1. imports（外部 → 內部 → 樣式）
import { useState } from 'react';
import { useGetUserQuery } from '@/api/extended/user';
import { Button } from '@/components/ui/Button';

// 2. type / schema definitions
type Props = {
  userId: string;
};

// 3. component
export function UserCard({ userId }: Props) {
  // ...
}

// 4. 內部 helper（必要時）
```

## Server Component vs Client Component

- **預設 Server Component**：列表頁、詳細頁的靜態框架、SEO 相關內容
- **`'use client'` 場景**：表單、互動 widget、需要 Redux store、需要 `useState` / `useEffect`
- 盡量把 `'use client'` 下推到葉節點，避免污染父層

## TypeScript 慣用法

- 偏好 `type` over `interface`（除非要 declaration merging）
- Union > enum（`type Status = 'idle' | 'loading' | 'error'`）
- 從 Zod schema 推導型別：`type User = z.infer<typeof UserSchema>`
- API 型別來自 OpenAPI codegen，不重複定義
- Discriminated unions 處理多狀態（`loading | success | error`）

## 注釋

- **預設不寫**
- 只有「為什麼」需要說明時才寫（特殊 workaround、非顯而易見的約束、外部規格參照）
- 禁止寫廢話注釋（「這個 function 是 X」、「state for Y」）
- TODO 必須連結 issue

## 樣式慣例

- Tailwind class 順序：layout → spacing → sizing → typography → color → state
- 條件樣式用 `clsx` / `cn` utility
- 重複的 class 組合抽成 component（不抽成 `@apply`）
- 響應式：mobile-first，斷點用 Tailwind 預設（`sm:`、`md:`、`lg:`）

## Git

- Commit message：Conventional Commits
- 分支：`feature/<ticket>-<slug>`、`fix/<ticket>-<slug>`
- 禁止直接 push 到 `main`
