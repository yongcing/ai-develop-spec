# UX 設計原則

## 設計哲學

待補：例如「Progressive disclosure」、「Mobile-first」、「Content-first」。

## 無障礙 (a11y) 規範

- 必須達到 WCAG 2.1 AA
- 所有互動元素鍵盤可達
- 顏色對比待補
- 表單必須有 label 與 error message

## 互動規範

- Loading state：超過 200ms 必須顯示 skeleton
- Error state：必須有重試機制
- Empty state：必須有引導使用者下一步的 CTA

## Prototype 流程

1. 使用 Claude Design 生成 prototype
2. 輸出存放至 [prototypes/](prototypes/)
3. 抽取的 design tokens 更新到 [design-tokens.json](design-tokens.json)
4. 前端依 prototype + tokens 實作
