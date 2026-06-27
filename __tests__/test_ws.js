const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${process.env.GEMINI_API_KEY}`;
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("WebSocket opened. Sending setup...");
  ws.send(JSON.stringify({
    setup: {
      model: "models/gemini-2.5-flash",
      systemInstruction: {
        parts: [{ text: "Hello" }]
      },
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
      }
    }
  }));
};

ws.onmessage = async (event) => {
  let textData = event.data;
  if (event.data instanceof Blob) {
    textData = await event.data.text();
  }
  console.log("Received:", textData);
  if (JSON.parse(textData).setupComplete) {
     console.log("Setup Complete!");
     process.exit(0);
  }
};

ws.onerror = (err) => {
  console.error("Error:", err);
};

ws.onclose = (event) => {
  console.log("Closed:", event.code, event.reason);
  process.exit(1);
};
