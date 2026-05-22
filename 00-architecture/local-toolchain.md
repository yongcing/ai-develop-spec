# 本機開發工具鏈

> 規格中釘版本的執行階段（Node 22 LTS、JDK 17 LTS 等）是**強制**的。
> 本機工具版本必須完全對齊，不得用「比較新就好」的最新版替代。
> AI 在 scaffold 或執行命令前必須先確認本機版本符合規格，否則先切版本再做。

## Node.js — 必須是 22 LTS

### 安裝多版本管理（nvm-windows）

Windows 用 [nvm-windows](https://github.com/coreybutler/nvm-windows) 並存多個 Node 版本：

```powershell
winget install --id CoreyButler.NVMforWindows -e
# 開新終端機後
nvm install 22.20.0   # **canonical pin** — 唯一在此檔案釘的版本
nvm use 22.20.0
node --version        # 應印 v22.x
```

### 專案層級鎖定

每個專案 repo 必須提供：

1. **`.nvmrc`** — 內容與本檔的 canonical pin 一致（目前 `22.20.0`；其他 spec 文件提到 22.x 時不釘補丁版，**唯一**權威值在這裡）
2. **`package.json` 的 `engines`** —
   ```json
   "engines": { "node": ">=22.0.0 <23.0.0", "npm": ">=10.0.0" }
   ```
3. **`.npmrc`** — `engine-strict=true`（讓 `npm install` 在版本不符時 fail）

### AI 行為

- AI 執行 `npm install` / `npm run` 前若 `node --version` 不是 22.x，**先 `nvm use`**，不可繼續
- AI 不得修改 `.nvmrc` 或 `engines` 把版本拉高/降低（變更需 ADR）

## Java — 必須是 JDK 17 LTS

### 並存安裝

可同時裝多個 JDK，用 `JAVA_HOME` 切換。建議 [Azul Zulu 17](https://www.azul.com/downloads/?package=jdk)（與本機現有 Zulu 系列一致）：

```powershell
winget install --id Azul.Zulu.17.JDK -e
```

預設安裝路徑形如 `C:\Program Files\Zulu\zulu-17\`。

### 專案層級鎖定

每個 Java 專案 repo 必須提供：

1. **`pom.xml`** 設定：
   ```xml
   <maven.compiler.release>17</maven.compiler.release>
   ```
   讓編譯目標強制 17，即便本機是 JDK 21+ 也會輸出 17 bytecode
2. **`.mvn/jvm.config`**（選用） — 給 Maven 額外 JVM 參數
3. **README 或 CONTRIBUTING** — 註明需要 JDK 17 並提供切換指引
4. **CI workflow** — `setup-java` action 必須指定 `java-version: '17'` 與 `distribution: 'zulu'`

### 本機切換 JAVA_HOME

PowerShell（建議放進 profile 函式）：
```powershell
function use-jdk17 {
  $env:JAVA_HOME = 'C:\Program Files\Zulu\zulu-17'
  $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}
```
或用 [jenv-for-windows](https://github.com/FelixSelter/JEnv-for-Windows) / SDKMAN（在 WSL/Git Bash）。

### AI 行為

- AI 執行 `mvn` 前若 `java --version` 不是 17.x，**先要求切換 JAVA_HOME**，不可繼續
- 變更 `<maven.compiler.release>` 需 ADR

## Python — 僅在 Python component 才需要

詳見 [/30-backend-python/tech-stack.md](../30-backend-python/tech-stack.md)。

### 安裝 `uv`（package manager + runtime 切換器）

```powershell
winget install --id=astral-sh.uv -e
# 或 PowerShell: irm https://astral.sh/uv/install.ps1 | iex
```

### 安裝指定 Python 版本

```powershell
uv python install 3.12       # 跟 project 的 .python-version 對齊
cd <python-project>
uv sync                      # 依 uv.lock 安裝相依
uv run python --version      # 應印 3.12.x
```

### AI 行為

- AI 執行 `uv run`、`pytest` 等前，若 `uv python pin` 顯示版本與 `.python-version` 不符，**先切版**，不可繼續
- AI 不得修改 `.python-version` 或 `pyproject.toml [project] requires-python`（變更需 ADR）
- AI 不得 fallback 到 `pip install`（必須 `uv add` / `uv sync`）

## 其他工具

| 工具 | 版本 | 安裝 |
|------|------|------|
| Maven | 3.9+ | `winget install Apache.Maven` 或用專案的 `mvnw` |
| Docker Desktop | 任意現行版 | `winget install Docker.DockerDesktop`，本機跑 Testcontainers / Compose 必備 |
| Git | 2.40+ | 隨 Git for Windows / Git Bash 一起 |
| gh CLI | 2.x | `winget install GitHub.cli` |
| uv | latest | `winget install astral-sh.uv` |

## 版本驗證指令（每次開新終端機建議跑一次）

```powershell
node --version    # v22.x
npm --version     # 10.x 或 11.x
java --version    # openjdk 17.x (Java component)
mvn --version     # 3.9+      (Java component)
uv --version      # latest    (Python component)
python --version  # 與專案 .python-version 一致 (Python component)
docker --version  # 任意
```

## 不符規格時的處置

1. **AI 先報告**：列出實際版本 vs 規格版本
2. **由人類切換**：不要自動「降級全域版本」
3. **無法切換時**：暫停該工作，記入 issue/note 後處理；不要用錯版本繼續做
