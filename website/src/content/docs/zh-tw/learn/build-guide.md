---
title: AI 工具的建置指南
description: 讓你的 AI 程式碼工具讀取 iMBrace 建置指南——每一個好的 iMBrace 建置成果背後的方法，以工具自己就能讀取的純文字檔案呈現。
---

iMBrace 建置指南就是本課程的[建置得好](/learn/build-it-well/)各頁、每一個好的 iMBrace 建置成果背後的原則，加上[快速上手](/learn/build-it/getting-started/)與[教學課程](/learn/build-it/vibe-coding-tutorial/)——全部打包成 AI 程式碼工具自己就能讀取的純文字檔案，而不是一份需要你讀完再講給它聽的頁面。

## 適用對象

任何正在用 Claude Code、Codex、Cursor，或其他能讀取專案檔案的 AI 程式碼工具，在 iMBrace 上建置的人。

## 使用方式

先下載下方的指南，再把你的工具指向它。三種簡短做法：

<strong>Claude Code。</strong> 把指南解壓縮到你的專案裡。它自己的 `CLAUDE.md` 只有一行：`@AGENTS.md`，所以只要你專案的 `CLAUDE.md` 會讀到它——不論是直接讀到，還是透過你自己加的一行 `@` 指向解壓縮後的資料夾——Claude Code 就會照著讀到 `AGENTS.md`。也可以改用技能：指南裡也附了一份 `SKILL.md`，所以把解壓縮後的資料夾安裝成 Claude Code 技能，效果一樣，而且完全不用改動 `CLAUDE.md`。

**Codex 及其他會讀取 `AGENTS.md` 的工具。** 把指南解壓縮，讓它的 `AGENTS.md` 落在你專案的根目錄，或是在你自己根目錄的 `AGENTS.md` 裡加一行指向它。任何已經遵循這個慣例的工具，都會用同樣的方式讀到它。

<strong>Cursor。</strong> 指南附了一個 `.cursor/rules/imbrace.mdc` 檔案。把指南解壓縮到你的專案裡，Cursor 就會讀到這條規則，而它會指向 `AGENTS.md` 本身的方法內容。

## 事實從哪裡來

這份指南只談方法：如何把設計與建置做好。它從不複製 SDK、CLI 或 MCP 的事實，因為複製來的事實會過時。它會告訴你的工具即時抓取 [https://engineer.imbrace.co/llms.txt](https://engineer.imbrace.co/llms.txt)，並讀取它指向的那一頁。把你的工具連接到測試組織的方式也一樣：見 [MCP 指南](https://engineer.imbrace.co/zh-tw/mcp/overview/)。

## 下載

- <strong>壓縮檔</strong>——[imbrace-build-guide-community.zip](https://engineer.imbrace.co/learn/imbrace-build-guide-community.zip)
- <strong>可瀏覽的檔案</strong>——`AGENTS.md` 及其他檔案，都在 [engineer.imbrace.co/learn/agent-pack/README.md](https://engineer.imbrace.co/learn/agent-pack/README.md) 之下
- <strong>整份指南合併成單一檔案</strong>，適合只讀取單一文件、而非整個資料夾的工具：[英文](https://engineer.imbrace.co/learn/llms-full.txt)、[繁體中文](https://engineer.imbrace.co/zh-tw/learn/llms-full.txt)、[簡體中文](https://engineer.imbrace.co/zh-cn/learn/llms-full.txt)
