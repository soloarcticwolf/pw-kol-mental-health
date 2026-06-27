const wsUrl = `wss://aiplatform.googleapis.com//ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?key=${process.env.GEMINI_API_KEY}`;
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("WebSocket opened. Sending setup...");
  ws.send(JSON.stringify({
    setup: {
      model: "models/gemini-2.5-flash",
      systemInstruction: { parts: [{ text: "Hello" }] }
    }
  }));
};

ws.onmessage = (event) => {
  console.log("Message:", event.data);
  process.exit(0);
};

ws.onerror = (err) => {
  console.error("Error:", err);
};

ws.onclose = (event) => {
  console.log("Closed:", event.code, event.reason);
  process.exit(1);
};
