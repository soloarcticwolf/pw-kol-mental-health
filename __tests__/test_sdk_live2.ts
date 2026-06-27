import { GoogleGenAI } from '@google/genai';

async function run() {
  try {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      vertexai: true
    });
    
    // We want to see the endpoint it builds.
    const req = await ai.live.connect({
      model: 'gemini-2.5-flash'
    });
    console.log(req);
    
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
