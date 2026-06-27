import { GoogleGenAI } from '@google/genai';

async function run() {
  try {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      vertexai: true
    });
    
    const session = await ai.live.connect({
      model: 'gemini-2.5-flash',
      config: {}
    });
    
    try {
      session.sendRealtimeInput([{ mimeType: "audio/pcm;rate=16000", data: "abcd" }]);
      console.log("sendRealtimeInput with array worked!");
    } catch(e) { console.error("Array failed", e); }
    
    try {
      session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello" }] }], turnComplete: true });
      console.log("sendClientContent worked!");
    } catch(e) { console.error("ClientContent failed", e); }

    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
