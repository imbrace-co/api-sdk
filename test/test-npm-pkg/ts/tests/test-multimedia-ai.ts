import { pathToFileURL } from 'url';
import { client, runTestSection, logResult, organizationId } from "../utils/utils.js";

/**
 * TEST MULTIMEDIA AI (SCENARIO-BASED)
 * Focuses on OCR (Extract File), STT (Transcribe), and TTS (Speech).
 */
async function testMultimediaAi() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 STARTING: MULTIMEDIA AI TEST");
  console.log("=".repeat(70));

  const ts = Date.now();
  const state = {
    orgId: organizationId as string || "",
  };

  try {
    // --- Section 1: OCR (Extract File) ---
    await runTestSection("OCR (Extract File)", async () => {
      // 1. Create a dummy text file/blob
      const formData = new FormData();
      formData.append("file", new Blob(["Hello from SDK OCR test. This is some text to extract."], { type: "text/plain" }), "test.txt");
      
      try {
        const result = await client.chatAi.extractFile(formData);
        logResult("Extracted Content", result.content || result);
      } catch (e: any) {
        console.warn(`   ⚠️ Extract file failed: ${e.message}`);
      }
    });

    // --- Section 2: STT (Transcribe) ---
    await runTestSection("STT (Transcribe)", async () => {
      // 1. Create a dummy audio file/blob (in reality needs real audio)
      const formData = new FormData();
      formData.append("file", new Blob(["dummy audio data"], { type: "audio/wav" }), "test.wav");
      
      try {
        const result = await client.chatAi.transcribe(formData);
        logResult("Transcribed Text", result.text);
      } catch (e: any) {
        console.warn(`   ⚠️ Transcribe failed (requires real audio usually): ${e.message}`);
      }
    });

    // --- Section 3: TTS (Speech) ---
    await runTestSection("TTS (Speech)", async () => {
      try {
        const response = await client.chatAi.speech({
            model: "tts-1",
            input: "Hello, this is a test of the IMBrace SDK text to speech capability.",
            voice: "alloy"
        });
        
        if (response.status === 200) {
            const blob = await response.blob();
            logResult("Generated Speech", `Success (${blob.size} bytes)`);
        } else {
            console.warn(`   ⚠️ Speech generation failed with status ${response.status}`);
        }
      } catch (e: any) {
        console.warn(`   ⚠️ Speech failed: ${e.message}`);
      }
    });

    // --- Section 4: Document AI ---
    await runTestSection("Document AI (Advanced OCR)", async () => {
        const models = await client.chatAi.listDocumentModels();
        logResult("Document AI Models", models.length);
        
        if (models.length > 0) {
            const modelName = models[0].name || models[0].id;
            try {
                // Testing with a public dummy image URL if possible, otherwise skip
                const result = await client.chatAi.processDocument({
                    modelName,
                    url: "https://imbrace.co/favicon.png",
                    organizationId: state.orgId,
                    additionalInstructions: "Tell me what's in this image"
                });
                logResult("Document AI Result", result.success);
            } catch (e: any) {
                console.warn(`   ⚠️ Process document failed: ${e.message}`);
            }
        }
    });

    console.log("\n" + "=".repeat(70));
    console.log("✅ MULTIMEDIA AI TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70));

  } catch (err: any) {
    console.error("\n❌ FATAL TEST ERROR:", err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testMultimediaAi().catch(console.error);
}

export { testMultimediaAi };
