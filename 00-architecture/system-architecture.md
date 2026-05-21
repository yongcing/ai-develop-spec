# 系統架構規範

> 由架構師團隊維護。所有跨服務、跨層的設計決策來源。

## 分層原則

待補：定義各層職責邊界、依賴方向、禁止的反向依賴。

建議採用 C4 model 描述：
- Context：系統與外部使用者/系統的關係
- Container：服務切分（前端、後端 API、worker、DB）
- Component：每個 container 內的主要模組
- Code：必要時才描述

## 服務切分原則

待補：何時拆服務、何時合併、服務間溝通方式（同步 REST / 非同步事件）。

## 圖表

放在 [diagrams/](diagrams/) 目錄，優先使用 mermaid 以利版控 diff。
