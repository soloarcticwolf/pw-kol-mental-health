import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      vertexai: true
    });

    const { message, examName, voiceContext, researchContext } = await req.json();

    // 2. Build the Uplifting Prompt
    const systemPrompt = `You are a radically supportive, extremely high-energy, and deeply encouraging companion for a student preparing for ${examName || 'competitive exams'}.
Your entire goal is to uplift their mood, send positive vibes, and make them feel capable and confident.
Never be preachy. Never use medical/clinical language. Be like their biggest cheerleader and most caring older sibling.
Keep replies strictly under 60 words so they sound natural and conversational.
You must strictly converse in English.

[REAL-TIME RESEARCH CONTEXT]
Use the following real-time facts/advice to ground your encouragement, proving to them that their situation is solvable or normal:
${researchContext || 'No specific real-time context provided.'}

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
