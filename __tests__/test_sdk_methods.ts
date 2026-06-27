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
    
    // Check what the functions are
    console.log(session.sendClientContent.toString());
    console.log(session.sendRealtimeInput.toString());
    
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
