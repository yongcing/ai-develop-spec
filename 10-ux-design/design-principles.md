# UX 設計原則

## 設計哲學

### 1. Progressive disclosure

- 預設只顯示完成主要任務必要的資訊；進階選項收在「More」、抽屜、次層分頁
- 表單預設只給必填欄位 + 常用選填；其他放「Advanced」摺疊
- 列表預設只顯示關鍵欄位（≤ 6 欄）；其他透過「Columns」設定揭露

### 2. Content-first

- 畫面主視覺給內容/資料，不給裝飾
- Chrome（toolbar / sidebar / breadcrumb）保持低存在感；hover 才強化
- 不用無資訊的插畫填空白；empty state 直接給 CTA

### 3. Direct manipulation

- 能 inline edit 就不開 modal
- 能 drag 就不要「上移」「下移」按鈕
- Optimistic UI：先反映變化，失敗再 rollback + toast 通知

### 4. Keyboard-first

- 所有主要操作可鍵盤完成；提供快捷鍵（`?` 顯示快捷鍵清單）
- Focus ring 永遠可見且高對比
- Tab order 跟視覺順序一致

### 5. Forgiveness

- 破壞性操作必須二次確認（dialog 或 inline confirm）
- 提供 undo（toast 內附 Undo 按鈕，5 秒內可救回）
- 不靜默刪資料；告知後果與替代方案

## 無障礙 (a11y) 規範

### 標準

- 全站達 **WCAG 2.1 Level AA**
- 互動元件全部基於 Radix primitives（已內建 ARIA / focus management）

### 顏色對比

| 目標 | 最小對比 | 備註 |
|------|---------|------|
| 一般文字（< 18pt / < 14pt bold）| 4.5:1 | WCAG 2.1 AA |
| 大型文字（≥ 18pt 或 ≥ 14pt bold）| 3:1 | |
| 非文字元件（icon、border、focus ring）| 3:1 | |
| Disabled 元素 | 不要求，但**禁止**僅靠灰色傳達 disabled，必須有第二訊號（icon / cursor / aria-disabled）|

設計 tokens 內所有「文字 on 背景」組合都要過 4.5:1（CI 用 [color-contrast-checker](https://www.npmjs.com/package/color-contrast-checker) 跑）。

### 鍵盤

- 所有互動元素 Tab 可達；非互動元素不可獲焦
- Esc 關 dialog / dropdown
- Enter / Space 觸發 button
- Arrow keys 在 menu / radio / tabs / listbox 內導航（Radix 已處理）

### 螢幕閱讀器

- 所有 form control 必有 `<label>` 或 `aria-label`
- 所有圖示按鈕必有 `aria-label`
- 動態錯誤訊息 / toast 用 `aria-live="polite"`（嚴重錯誤用 `assertive`）
- 載入狀態用 `aria-busy`，不只是 spinner

### 觸控

- 主要互動 target ≥ 44x44px（即便桌面為主，平板/觸控筆也要顧）

### 測試

- Cypress / Vitest 加入 [axe-core](https://github.com/dequelabs/axe-core) 跑每個頁面
- 鍵盤導航測試列入關鍵流程 E2E

## 互動規範

### Loading

- < 200ms：不顯示 spinner（人類察覺臨界）
- ≥ 200ms < 1s：顯示 skeleton（保留版位、不跳動）
- ≥ 1s：skeleton + 進度提示（若可量化），> 3s 加「This may take a moment…」說明
- 全頁 loading 禁止；改局部 skeleton

### Error

- 永遠告知**發生了什麼** + **下一步怎麼辦** + **重試按鈕**
- 不顯示 stack trace / status code（除非「Show details」收起）
- 表單錯誤 inline 顯示在欄位下；submit 失敗整體錯誤顯示在表單頂端 + focus 到第一個錯誤欄位

### Empty

- 必須有：圖示或插畫（極簡）+ 標題（一句話說明）+ CTA（建議下一步動作）
- 例：合約清單空 → 「You haven't created any contracts yet」+ 「Create your first contract」按鈕

### Success / Toast

- 一般成功用 toast，3 秒消失
- 重要成功（建立資源、簽署完成）給 inline confirmation + 連結到新建立物件
- 不用 alert/modal 慶祝平凡成功

### Optimistic update

- 樂觀更新時 UI 立即反映，背景非同步寫入
- 失敗 rollback + 顯示 toast 並提供「Retry」
- 高風險操作（刪除、簽署）不做樂觀更新

## Prototype 流程

詳見 [/00-architecture/design-to-code-workflow.md](../00-architecture/design-to-code-workflow.md)（五階段、三份 spec、雙軌驗證）。
此處只列與設計原則相關要點：

1. 任何 prototype（v0、Claude Design、Figma、screenshot…）存到 **project repo** 的 `design/raw/`，不放 spec repo
2. 抽取的 design tokens 更新到 [design-tokens.json](design-tokens.json)
3. 更新 [component-inventory.md](component-inventory.md) 以反映 prototype 用到的新元件
4. **每個 section 三份 spec**：`visual/`、`behavior/`、`data/` — 詳見 [visual-parity-workflow.md](visual-parity-workflow.md) 與 [interaction-spec-workflow.md](interaction-spec-workflow.md)
5. 前端依 spec 實作；不直接複製 prototype 的 HTML，要重新基於規範元件實作 — **但成品要與 prototype 視覺一致**（pixel diff < 2%，肉眼難以分辨）
6. PR 必附 prototype vs 實作並排截圖，由 [/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md) 把關

## 對 AI 生成行為的影響

- 生成 UI 必先讀本檔的原則，違反 progressive disclosure / content-first 的設計需在 PR 描述說明理由
- 任何 interactive element 必須過鍵盤與 a11y 檢查；不滿足 a11y 的 PR 直接退回
- 配色不得任意自訂，必須從 [design-tokens.json](design-tokens.json) 取值；新增 token 要走 PR
- Loading/Error/Empty 三狀態未實作的 feature 視為未完成（[/40-quality-gates/definition-of-done.md](../40-quality-gates/definition-of-done.md)）
