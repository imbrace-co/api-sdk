---
level: '2'
track:
- build
---

# AI 工具的构建指南

iMBrace 构建指南就是本课程的[构建得好](/zh-cn/learn/build-it-well/index.md)各页、每一个好的 iMBrace 构建成果背后的原则，加上[快速开始](/zh-cn/learn/build-it/getting-started.md)与[教程](/zh-cn/learn/build-it/vibe-coding-tutorial.md)——全部打包成 AI 编程工具自己就能读取的纯文本文件，而不是一份需要你读完再讲给它听的页面。

## 适用对象

任何正在用 Claude Code、Codex、Cursor，或其他能读取项目文件的 AI 编程工具，在 iMBrace 上构建的人。

## 使用方式

先下载下方的指南，再把你的工具指向它。三种简短做法：

**Claude Code。** 把指南解压到你的项目里。它自己的 `CLAUDE.md` 只有一行：`@AGENTS.md`，所以只要你项目的 `CLAUDE.md` 会读到它——不论是直接读到，还是通过你自己加的一行 `@` 指向解压后的文件夹——Claude Code 就会顺着读到 `AGENTS.md`。也可以改用技能：指南里也带了一份 `SKILL.md`，所以把解压后的文件夹安装成 Claude Code 技能，效果一样，而且完全不用改动 `CLAUDE.md`。

**Codex 及其他会读取 `AGENTS.md` 的工具。** 把指南解压，让它的 `AGENTS.md` 落在你项目的根目录，或者在你自己根目录的 `AGENTS.md` 里加一行指向它。任何已经遵循这个惯例的工具，都会用同样的方式读到它。

**Cursor。** 指南带了一个 `.cursor/rules/imbrace.mdc` 文件。把指南解压到你的项目里，Cursor 就会读到这条规则，而它会指向 `AGENTS.md` 本身的方法内容。

## 事实从哪里来

这份指南只讲方法：如何把设计与构建做好。它从不复制 SDK、CLI 或 MCP 的事实，因为复制来的事实会过时。它会告诉你的工具实时抓取 [https://engineer.imbrace.co/llms.txt](https://engineer.imbrace.co/llms.txt)，并读取它指向的那一页。把你的工具连接到测试组织的方式也一样：见 [MCP 指南](https://engineer.imbrace.co/zh-cn/mcp/overview/)。

## 下载

- **压缩包**——[imbrace-build-guide-community.zip](https://engineer.imbrace.co/learn/imbrace-build-guide-community.zip)
- **可浏览的文件**——`AGENTS.md` 及其他文件，都在 [engineer.imbrace.co/learn/agent-pack/README.md](https://engineer.imbrace.co/learn/agent-pack/README.md) 之下
- **整份指南合并成单个文件**，适合只读取单一文档、而非整个文件夹的工具：[英文](https://engineer.imbrace.co/learn/llms-full.txt)、[繁体中文](https://engineer.imbrace.co/zh-tw/learn/llms-full.txt)、[简体中文](https://engineer.imbrace.co/zh-cn/learn/llms-full.txt)
