# iMBrace 建置指南 - 給你的 AI 程式碼工具

這個資料夾教會一個 AI 程式碼工具——Claude Code、Cursor、Codex、Copilot，或任何能讀取檔案的助理——依照我們的方式在 iMBrace 上建置：找出使用案例的形狀、在寫程式碼之前先用平台本身的功能、把規則保存成人可以編輯的資料、在需要的地方放進真實的人工決策，並且到平台上檢查結果，而不是採信一份摘要。

這份指南也能給人閱讀。想了解方法，從 `build-it-well/index.md` 開始；想動手設定，從 `build-it/set-up-your-coding-tool.md` 開始。

## 內容有什麼

**認識** (level 0)

- `understand/overview.md` - iMBrace 是什麼、如何讓 AI 保持可靠，以及由什麼來治理，內容足以向潛在客戶說明。
- `understand/capability-truth-table.md` - 逐項列出 iMBrace 現在能做的事，並附上頁面或畫面，讓你可以親自確認每一項。

**建置** (level 2)

- `build-it/index.md` - iMBrace 課程第 2 級——在測試組織上建置一個能運作的小型退貨櫃台，再讓它等一個人做決定。
- `build-it/set-up-your-coding-tool.md` - 把 AI 程式碼工具透過 MCP 連接到測試組織，並把 SDK 的地圖交給它：測試組織與金鑰、MCP 連線，以及確認一切正常的檢查。
- `build-it/vibe-coding-tutorial.md` - 使用任何 AI 程式碼工具，在測試組織中建置一個能運作的小型代理人。
- `build-it/make-it-wait-for-a-person.md` - 讓退貨櫃台以電子郵件請一個人做決定並等候答覆，同一次執行便會記錄決定並通知顧客。
- `build-it/working-with-ai.md` - 讓 AI 程式碼工具在 iMBrace 上建置出的成果值得信任所需的態度、習慣與防護措施。
- `build-it/building-blocks.md` - 認出每一個 iMBrace 建置背後都有的五樣東西，以及延伸並交付它們的三種方式——說出它們的名稱，並找到它們在畫面上的位置。

**建置得好** (level 3)

- `build-it-well/index.md` - 要讓一個 iMBrace 建置成果禁得起真實使用、真實負載與真實監督的考驗，需要哪些設計。
- `build-it-well/the-eight-principles.md` - 支撐一個禁得起實際使用考驗之建置的八大原則：每項原則的意義、做得好的樣子，以及會如何出錯。
- `build-it-well/use-case-shapes.md` - 業務使用案例在 iMBrace 上會呈現的九種常見形狀，以及每一種形狀通常是用哪些元件組成的。
- `build-it-well/human-approval.md` - 一個人如何在自己原本工作的地方做出決策——一封附有「核准」與「拒絕」按鈕的電子郵件，再到頁面上確認——以及建置在那之後如何接續完成。
- `build-it-well/native-first.md` - 為什麼要在寫程式碼之前，先善用平台自身的內建元件，以及這麼做能帶來什麼好處。
- `build-it-well/document-models.md` - 如何選擇「文件模組」要從一份文件中擷取什麼內容－先採用平台的預設模型，其次加以擴充，只有在真的別無選擇時才自行撰寫。
- `build-it-well/anti-patterns.md` - 一再被重複建置出來的錯誤，各自的代價，以及對應的解法。
- `build-it-well/review-checklist.md` - 依循八大原則進行審查，寫成一份你可以在上線之前，對自己的建置親自跑一遍的清單。

## 使用方式

1. **放進程式碼專案裡（建議做法）。** 把這個資料夾複製到專案中，例如放成 `docs/imbrace-build-guide/`。然後把你的工具指向 `AGENTS.md`：
   - **Claude Code：** 在你專案的 `CLAUDE.md` 中加入這一行：`@docs/imbrace-build-guide/AGENTS.md`。
   - **Cursor、Codex、Copilot 及其他會讀取 `AGENTS.md` 的工具：** 在你專案的 `AGENTS.md` 中加入一行：「在 iMBrace 上建置時，請依照 docs/imbrace-build-guide/AGENTS.md。」
2. **在具備專案知識的聊天助理中**，例如 Claude Project：上傳 `llms-full.txt`，也就是整份指南合併成的單一檔案。
3. **其他任何情況：** 把 `llms.txt`——列出每一頁的索引——交給工具。

接著透過 MCP 把工具連接到你的測試組織（見 `build-it/set-up-your-coding-tool.md`），讓它能看到現有的東西，而不必用猜的。

## 這裡刻意沒有放的東西

SDK、CLI 與 API 參考文件。它放在 https://engineer.imbrace.co，並依自己的節奏更新，所以這份指南要求你的工具即時抓取最新內容，而不是依賴一份可能已經過時的副本。

## 更新

這是版本 1.0.3，2026年10月4日。當方法有變動時，我們會發出新版本，`CHANGELOG.md` 會說明變動了什麼。請整個資料夾替換掉，而不是自己編輯，這樣你手上的版本才會保持同步。一旦這份指南在 engineer.imbrace.co 上發布，你的工具就能直接在那裡讀到最新版本。

## 意見回饋

這是社群版：沒有附上專屬的合作夥伴聯絡窗口。請到 iMBrace 的公開儲存庫 https://github.com/imbrace-co/api-sdk/issues 開一個議題（issue），告訴我們任何錯誤、不清楚或遺漏的地方——尤其是你的工具已經照著指南做、卻仍然出錯的地方。那是你能提供給我們、最有價值的意見。

---

*版本 1.0.3，於 2026年10月4日。社群版，發布於 engineer.imbrace.co，這是一份用 AI 程式碼工具在 iMBrace 上建置的方法指南。*
