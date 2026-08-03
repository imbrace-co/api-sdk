PS D:\HUANGJUNFENG\IMBrace\sdk\test-local-pkg\ts\tests> npm run test:all

> test-local-pkg@1.0.0 test:all
> tsx tests/test-all.ts

◇ injected env (5) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
================================================
   IMBRACE SDK COMPREHENSIVE TEST SUITE
================================================
Target: https://app-gatewayv2.imbrace.co
Mode:   Access Token
================================================

🚀 Testing Platform, Organizations, and Teams...

--- [TEST] platform.getMe ---
❌ Failed: [502] <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.4</center>
</body>
</html>

   HTTP Status: 502

❌ MODULE [Platform] FAILED: [502] <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.4</center>
</body>
</html>


🚀 Testing Agent Templates and Use Cases...

--- [TEST] agent.list ---
   Templates Count: N/A
✅ Passed (300ms)

--- [TEST] agent.create (Custom) ---
❌ Failed: [400] {"message":"Request failed with status code 400"}
   HTTP Status: 400

❌ MODULE [Agent] FAILED: [400] {"message":"Request failed with status code 400"}

🚀 Testing Marketplace Resource...

--- [TEST] marketplace.listProducts ---
   Products Count: N/A
✅ Passed (103ms)

--- [TEST] marketplace.listOrders ---
❌ Failed: [404] <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /v1/market-places/orders</pre>
</body>
</html>

   HTTP Status: 404
   ⚠️ Skipping section due to 404 (Endpoint might not exist on this environment)

--- [TEST] marketplace.listUseCaseTemplates ---
   UseCase Templates Count: N/A
✅ Passed (89ms)

--- [TEST] marketplace.listCategories ---
❌ Failed: [404] <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /v1/market-places/categories</pre>
</body>
</html>

   HTTP Status: 404
   ⚠️ Skipping section due to 404 (Endpoint might not exist on this environment)

✅ Marketplace Resource Testing Completed.

🚀 Testing AI Agent Resource...

--- [TEST] aiAgent.getHealth ---
   Health: {"success":true,"data":{"status":"ok","uptime":165879.640123363,"timestamp":"2026-04-23T06:49:04.532
✅ Passed (79ms)

--- [TEST] aiAgent.getConfig ---
   Config: {"success":true,"data":{"aichat":{"url":"https://aichat2.demo.imbrace.co"},"webapp":{"url":"https://
✅ Passed (79ms)

--- [TEST] aiAgent.getVersion ---
   Version: {"success":true,"data":{"version":"1.0.0","name":"fullstack-typescript-app","environment":"productio
✅ Passed (79ms)

--- [TEST] aiAgent.listChats ---
❌ Failed: [400] {"error":"organization_id is required"}
   HTTP Status: 400

❌ MODULE [AiAgent] FAILED: [400] {"error":"organization_id is required"}

🚀 Testing Chat AI Resource...

--- [TEST] chatAi.listAssistants ---
   Assistants: 8 items
✅ Passed (689ms)

--- [TEST] chatAi.createAssistant ---
   Created Assistant: 972cb829-06c3-4ba5-b466-5627ccc90b6b
✅ Passed (677ms)

--- [TEST] chatAi.getAssistant ---
   Fetched Assistant: 69e9c0e1835c54ba1036251d
✅ Passed (657ms)

--- [TEST] chatAi.updateAssistant ---
   Updated Assistant: 972cb829-06c3-4ba5-b466-5627ccc90b6b
✅ Passed (654ms)

--- [TEST] chatAi.listModels ---
❌ Failed: Invalid or expired access token (x-access-token).

❌ MODULE [ChatAi] FAILED: Invalid or expired access token (x-access-token).

🚀 Testing Activepieces Resource...

--- [TEST] activepieces.listFlows ---
   Flows: 4 items
✅ Passed (82ms)

--- [TEST] activepieces.listRuns ---
   Runs: 5 items
✅ Passed (76ms)

--- [TEST] activepieces.listFolders ---
   Folders: 4 items
✅ Passed (72ms)

--- [TEST] activepieces.listConnections ---
   Connections: 0 items
✅ Passed (77ms)

--- [TEST] activepieces.listTables ---
   Tables: 0 items
✅ Passed (75ms)

--- [TEST] activepieces.listPieces ---
   Pieces Count: 126
✅ Passed (262ms)

--- [TEST] activepieces.listMcpServers ---
❌ Failed: [400] {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"querystring must have required property 'projectId'"}
   HTTP Status: 400

❌ MODULE [Activepieces] FAILED: [400] {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"querystring must have required property 'projectId'"}

🚀 Testing Boards Resource...

--- [TEST] boards.list ---
   Boards: 9 items
✅ Passed (100ms)

--- [TEST] boards.create ---
   Created Board: brd_e90f6bfd-9757-4542-a06a-c6adc6a9f6bf
✅ Passed (96ms)

--- [TEST] boards.get ---
   Fetched Board: brd_e90f6bfd-9757-4542-a06a-c6adc6a9f6bf
✅ Passed (85ms)

--- [TEST] boards.update ---
   Updated Board: brd_e90f6bfd-9757-4542-a06a-c6adc6a9f6bf
✅ Passed (94ms)

--- [TEST] Field Lifecycle ---
   Created Field: 69e9c0e5f2b1e29e1c86942a
   Updated Field: true
❌ Failed: [400] {"message":"given fields length is not match with target board fields length"}
   HTTP Status: 400

❌ MODULE [Boards] FAILED: [400] {"message":"given fields length is not match with target board fields length"}

🚀 Testing CRM Resources (Contacts, Conversations, Messaging)...

--- [TEST] contacts.list ---
❌ Failed: [502] <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.4</center>
</body>
</html>

   HTTP Status: 502

❌ MODULE [CRM] FAILED: [502] <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.4</center>
</body>
</html>


======================================================================
🚀 STARTING: FULL FLOW GUIDE COMPREHENSIVE TEST
======================================================================

[FLOW 1] Assistant Lifecycle

--- [TEST] Assistant CRUD ---
   Assistant Created: 8640618a-df02-4745-9487-6cf2c23ac16c
   Assistant List & Verify: Found among 10 assistants
   Assistant Retrieved & Verified: true
   Instructions Updated: true
   Assistant Renamed: SDK Assistant 1776927042341 (Updated)
✅ Passed (3440ms)

[FLOW 2] Activepieces Workflows

--- [TEST] Workflow Lifecycle ---
   Using Existing Flow: VDaPxdtTjgQa4k5DqTUqX
   ⚠️ Workflow steps failed (Possible 404 or config issue): [404] {}
✅ Passed (209ms)

[FLOW 3] Knowledge Hub & RAG

--- [TEST] Folder & File Management ---
   KB Folder Created: 69e9c149fdd3d19e3ad10fe6
   Folder Retrieved: SDK KB 1776927042341
   Folder Updated: true
   Search Folders Verified: true
   Knowledge File Uploaded: IMBRACE-CODE-1776927042341
   Knowledge Attached to Assistant: true
   Waiting 3s for embedding indexing...
✅ Passed (6317ms)

--- [TEST] Multi-turn Chat Verification (RAG) ---
   ⚠️ New assistant has no model yet, falling back to an existing one for chat test.

   [Turn 1] Querying RAG...
   AI Turn 1 Response: 
   ✅ AI Turn 1 Response Finished.

   [Turn 2] Context Check...
   AI Turn 2 Response: 
   ✅ AI Turn 2 Response Finished.
✅ Passed (10926ms)

[FLOW 4] Boards & Items

--- [TEST] Board & Item Full Lifecycle ---
   Board Created: brd_80697efe-71c1-4fc1-a964-f3abce35c317
   Identifier Field Identified: 69e9c15bf2b1e29e1c8695de
   Item Created: bi_04c59469-6825-4582-9dd8-a105f120aad6
   Item Retrieved: bi_04c59469-6825-4582-9dd8-a105f120aad6
   List Items Verified: Found 1 items
   Search Verified: N/A
   CSV Exported (Bytes): 116
✅ Passed (1787ms)

======================================================================
✅ FULL FLOW GUIDE TEST COMPLETED SUCCESSFULLY
======================================================================

[Cleanup] Removing resources...
   Cleanup finished.

======================================================================
🚀 STARTING: FRONTEND SDK & TRACING TEST
======================================================================

--- [TEST] System Info & Health ---
   Config: {"success":true,"data":{"aichat":{"url":"https://aichat2.demo.imbrace.co"},"webapp":{"url":"https://
   Health: {"success":true,"data":{"status":"ok","uptime":166004.880879783,"timestamp":"2026-04-23T06:51:09.773
   Version: {"success":true,"data":{"version":"1.0.0","name":"fullstack-typescript-app","environment":"productio
✅ Passed (232ms)

--- [TEST] Chat Client Auth ---
   Chat Client User: N/A
   Credentials Verified: true
✅ Passed (403ms)

--- [TEST] Chat Client Chats ---
   ⚠️ Skipping Chat Client Chats because userId is null.
✅ Passed (0ms)

--- [TEST] Client Messages & Votes ---
   ⚠️ Skipping Messages & Votes because chatId is null.
✅ Passed (0ms)

--- [TEST] Tracing (Tempo) ---
❌ Failed: [500] {"error":"Failed to fetch services","message":"Failed to parse URL from /api/search/tag/service.name/values"}
   HTTP Status: 500

❌ Section [Tracing] Failed: [500] {"error":"Failed to fetch services","message":"Failed to parse URL from /api/search/tag/service.name/values"}

======================================================================
✅ FRONTEND SDK TEST COMPLETED SUCCESSFULLY
======================================================================

[Cleanup] Cleaning up chat client resources...
   Cleanup finished.

======================================================================
🚀 STARTING: MULTI-AGENT & SUB-AGENTS TEST
======================================================================

--- [TEST] Preparation ---
   Using Assistant: 972cb829-06c3-4ba5-b466-5627ccc90b6b
✅ Passed (761ms)

--- [TEST] Prompt Suggestions ---
   Prompt Suggestions: {"success":true,"data":["How can I help you today?","Tell me about current trends.","What is your fa
✅ Passed (2834ms)

--- [TEST] Chat v1 Lifecycle ---
   ⚠️ No Chat v1 found to test retrieval.
✅ Passed (78ms)

--- [TEST] Sub-Agent Chat & History ---
   Chat Created for Sub-agent: eaeb0806-58cd-439e-8b1d-4b7f07f34d3a
   Sub-agent Chat Stream: Started (200 OK)
   Sub-agent History: {"messages":[]}
✅ Passed (5876ms)

--- [TEST] Parquet Data Operations ---
   Generated Parquet: true
   Parquet Files: N/A
   ⚠️ Parquet operations failed: [404] {"error":"File not found","fileName":"test-1776927072923","localPaath":"/mnt/data/files/aiToolLoopAgent/embedding/test-1776927072923.parquet"}
✅ Passed (474ms)

======================================================================
✅ MULTI-AGENT TEST COMPLETED SUCCESSFULLY
======================================================================

[Cleanup] Cleaning up resources...
   Cleanup finished.

======================================================================
🚀 STARTING: CRM ADVANCED & RELATIONS TEST
======================================================================

--- [TEST] Contacts Advanced ---
❌ Failed: [502] <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.4</center>
</body>
</html>

   HTTP Status: 502

❌ Section [Contacts Advanced] Failed: [502] <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.4</center>
</body>
</html>


--- [TEST] Conversations & Activities ---
   ⚠️ No conversation found to test activities.
✅ Passed (0ms)

--- [TEST] Channels Management ---
❌ Failed: [502] <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.4</center>
</body>
</html>

   HTTP Status: 502

❌ Section [Channels Management] Failed: [502] <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.4</center>
</body>
</html>


--- [TEST] Board Relations (Link/Unlink) ---
❌ Failed: [400] {"message":"fields is not iterable"}
   HTTP Status: 400

❌ Section [Board Relations] Failed: [400] {"message":"fields is not iterable"}

======================================================================
✅ CRM ADVANCED TEST COMPLETED SUCCESSFULLY
======================================================================

[Cleanup] Cleaning up resources...
   Cleanup finished.

======================================================================
🚀 STARTING: MULTIMEDIA AI TEST
======================================================================

--- [TEST] OCR (Extract File) ---
   ⚠️ Extract file failed: [400] {"detail":"Error extracting file: Stream has ended unexpectedly"}
✅ Passed (384ms)

--- [TEST] STT (Transcribe) ---
   ⚠️ Transcribe failed (requires real audio usually): Invalid or expired access token (x-access-token).
✅ Passed (359ms)

--- [TEST] TTS (Speech) ---
   ⚠️ Speech failed: Invalid or expired access token (x-access-token).
✅ Passed (369ms)

--- [TEST] Document AI (Advanced OCR) ---
   Document AI Models: 2
   ⚠️ Process document failed: [500] {"detail":{"success":false,"message":"Error from document-ai assistant: Client error '404 Not Found' for url 'https://www.imbrace.co/favicon.png'\nFor more information check: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404"}}
✅ Passed (24739ms)

======================================================================
✅ MULTIMEDIA AI TEST COMPLETED SUCCESSFULLY
======================================================================

================================================
   TEST SUITE SUMMARY
   Passed: 6
   Failed: 7
================================================

⚠️ SOME MODULES FAILED. Please check the logs above.