# Code Review Checklist

> Reviewer 必查項。AI 生成的 PR 特別要看「是否走捷徑」。

## 規格符合度

- [ ] 是否違反 `ai-generation-rules.md` 任一條
- [ ] 是否引入未列入 tech-stack 的套件
- [ ] 是否自製了已存在的元件/工具

## 設計

- [ ] 分層是否乾淨（Controller/Service/Repository）
- [ ] 抽象是否合理（不過度設計、不重複）
- [ ] 命名是否表意清楚
- [ ] 是否有未處理的邊界情況

## AI 容易犯的錯

- [ ] 是否有「為了讓測試過」而寫的程式碼
- [ ] 是否有 catch 後 swallow exception
- [ ] 是否有 hardcoded 應該參數化的值
- [ ] 是否有無意義的 wrapper / 重複抽象
- [ ] 是否生成了規格未要求的「貼心」功能
- [ ] 是否在不該動的地方做了「順手清理」

## 測試

- [ ] 測試覆蓋核心邏輯（非為了覆蓋率而寫）
- [ ] 測試命名清楚描述情境
- [ ] 沒有 flaky / order-dependent test
