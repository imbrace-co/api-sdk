# iMBrace 构建指南 - 给你的 AI 编程工具

这个文件夹教会一个 AI 编程工具——Claude Code、Cursor、Codex、Copilot，或任何能读取文件的助手——按照我们的方式在 iMBrace 上构建：找出用例的形状、在编写代码之前先用平台自身的能力、把规则保存成人可以编辑的数据、在需要的地方放进真正的人工决定，并且到平台上核实结果，而不是采信一份总结。

这份指南也能给人阅读。想了解方法，从 `build-it-well/index.md` 开始；想动手设置，从 `build-it/set-up-your-coding-tool.md` 开始。

## 里面有什么

**了解** (level 0)

- `understand/overview.md` - 什么是 iMBrace、它如何让 AI 保持可靠，以及由什么来管控它——足以向可能合适的客户讲清楚。
- `understand/capability-truth-table.md` - 按能力逐项列出 iMBrace 目前能做的事，并附上你可以亲自核实每一项的页面或界面。

**动手构建** (level 2)

- `build-it/index.md` - iMBrace 课程第 2 级——在测试组织上构建一个可运行的小型退货台，然后让它等待人的决定。
- `build-it/set-up-your-coding-tool.md` - 通过 MCP 把 AI 编程工具连接到测试组织，并把 SDK 的地图交给它：测试组织与密钥、MCP 连接，以及确认一切正常的检查。
- `build-it/vibe-coding-tutorial.md` - 在测试组织中，使用任意一款 AI 编程工具，构建一个可运行的小型智能体。
- `build-it/make-it-wait-for-a-person.md` - 让退货台通过邮件询问一个人并等待答复，这样同一次运行就会记录这个决定，并通知客户。
- `build-it/working-with-ai.md` - 让 AI 编程工具在 iMBrace 上构建出的成果保持可信的立场、习惯与准则。
- `build-it/building-blocks.md` - 认识每一个 iMBrace 构建都由哪五个部分组成，以及扩展和交付它们的三种方式——记住每一个的名称，也记住它在界面上的位置。

**构建得好** (level 3)

- `build-it-well/index.md` - 要设计出一个经得起真实使用、真实负载和真实监督考验的 iMBrace 构建，需要具备什么。
- `build-it-well/the-eight-principles.md` - 一个能经受真实使用考验的构建背后的八项原则——每一项原则的含义、做得好是什么样子，以及常见的出错方式。
- `build-it-well/use-case-shapes.md` - 业务用例在 iMBrace 上反复出现的九种形态，以及每一种通常由哪些部件组装而成。
- `build-it-well/human-approval.md` - 一个人如何在自己本来工作的地方做出决定——一封带有“批准”和“拒绝”按钮的邮件，再到页面上确认——以及构建在这之后如何接着把事情做完。
- `build-it-well/native-first.md` - 为什么要先动用平台自身的构建部件、再考虑写代码，以及这样做能带来什么好处。
- `build-it-well/document-models.md` - 如何选择让文档模块（DocIQ）从文档中提取什么内容——优先采用平台的默认模型，其次扩展它，只有在万不得已时才自己编写。
- `build-it-well/anti-patterns.md` - 一再被构建出来的错误、每一种的代价，以及对应的修复方法。
- `build-it-well/review-checklist.md` - 八项原则审查，做成一份清单，供你在交付前对照自己的构建逐项核查。

## 怎么用

1. **放进代码项目里（推荐做法）。** 把这个文件夹复制到项目中，例如放成 `docs/imbrace-build-guide/`。然后把你的工具指向 `AGENTS.md`：
   - **Claude Code：** 在你项目的 `CLAUDE.md` 里加上这一行：`@docs/imbrace-build-guide/AGENTS.md`。
   - **Cursor、Codex、Copilot 以及其他会读取 `AGENTS.md` 的工具：** 在你项目的 `AGENTS.md` 里加上一行：“在 iMBrace 上构建时，遵循 docs/imbrace-build-guide/AGENTS.md。”
2. **在具备项目知识的聊天助手中**，比如一个 Claude Project：上传 `llms-full.txt`，也就是整份指南合在一起的单个文件。
3. **其他任何场合：** 把 `llms.txt`——列出每一页的索引——交给工具。

然后通过 MCP 把工具连接到你的测试组织（见 `build-it/set-up-your-coding-tool.md`），让它能看到现有的东西，而不是靠猜。

## 这里故意没有放的内容

SDK、CLI 和 API 参考文档。它放在 https://engineer.imbrace.co，并按自己的节奏更新，所以这份指南要求你的工具现抓现用，而不是依赖一份可能已经过时的副本。

## 更新

这是版本 1.0.3，2026年10月4日。当方法发生变化时，我们会发布新版本，`CHANGELOG.md` 会说明变化了什么。请把整个文件夹替换掉，而不是自己编辑，这样你手上的版本才能保持同步。一旦这份指南在 engineer.imbrace.co 上发布，你的工具就能直接在那里读到最新版本。

## 反馈

这是社区版：没有附带专属的合作伙伴联系人。请到 iMBrace 的公开仓库 https://github.com/imbrace-co/api-sdk/issues 开一个议题（issue），告诉我们任何错误、不清楚或遗漏的地方——尤其是你的工具已经照着指南做了、却仍然出错的地方。那是你能给我们的、最有价值的反馈。

---

*版本 1.0.3，于 2026年10月4日。社区版，发布于 engineer.imbrace.co，这是一份用 AI 编程工具在 iMBrace 上构建的方法指南。*
