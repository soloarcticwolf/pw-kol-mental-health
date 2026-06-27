import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
    });

    const { message, examName } = await req.json();

    const systemPrompt = `You are a supportive, non-clinical companion for an exam-stressed Indian student preparing for ${examName || 'competitive exams'}. 
Keep replies under 60 words, warm, never preachy, never give medical advice. 
If the student mentions self-harm or hopelessness, gently and clearly encourage them to reach out to a trusted adult or a helpline (iCall: 9152987821, Vandrevala Foundation: 1860-2662-345), and do not continue with coping tips.
Never diagnose or use clinical/diagnostic language.
Never suggest medication or specific clinical interventions.
Be like a caring older sibling who's been through exams themselves.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nStudent says: "${message}"\n\nRespond warmly in under 60 words:`,
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
