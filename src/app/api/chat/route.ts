import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      vertexai: true
    });

    const { message, examName, voiceContext } = await req.json();

    // 1. Perform Real-Time Exa Web Search
    let researchContext = '';
    if (process.env.EXA_API_KEY) {
      try {
        const searchQuery = voiceContext 
          ? `Advice or facts to help someone stressed about: ${voiceContext} in ${examName}`
          : `Encouraging facts or study help for: ${message} regarding ${examName}`;

        const exaResponse = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': process.env.EXA_API_KEY
          },
          body: JSON.stringify({
            query: searchQuery,
            useAutoprompt: true,
            numResults: 2,
            contents: { text: { maxCharacters: 500 } }
          })
        });

        if (exaResponse.ok) {
          const exaData = await exaResponse.json();
          if (exaData.results && exaData.results.length > 0) {
            researchContext = exaData.results.map((r: any) => `Source: ${r.title}\nInfo: ${r.text}`).join('\n\n');
          }
        }
      } catch (e) {
        console.error('Exa search failed, continuing without context', e);
      }
    }

    // 2. Build the Uplifting Prompt
    const systemPrompt = `You are a radically supportive, extremely high-energy, and deeply encouraging companion for a student preparing for ${examName || 'competitive exams'}.
Your entire goal is to uplift their mood, send positive vibes, and make them feel capable and confident.
Never be preachy. Never use medical/clinical language. Be like their biggest cheerleader and most caring older sibling.
Keep replies strictly under 60 words so they sound natural and conversational over voice TTS.

[REAL-TIME RESEARCH CONTEXT]
Use the following real-time facts/advice to ground your encouragement, proving to them that their situation is solvable or normal:
${researchContext || 'No specific real-time context found.'}

If the student mentions self-harm or hopelessness, gently and clearly encourage them to reach out to a helpline (iCall: 9152987821, Vandrevala Foundation: 1860-2662-345).`;

    const userPayload = voiceContext
      ? `Student's Journal: "${voiceContext}"\nStudent says: "${message}"`
      : `Student says: "${message}"`;

    // 3. Generate Content
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\n${userPayload}\n\nRespond overwhelmingly positively in under 60 words:`,
    });

    let text = response.text;
    if (!text) {
      throw new Error('No content returned from model');
    }

    return NextResponse.json({ reply: text.trim() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate response';
    console.error('Chat route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
