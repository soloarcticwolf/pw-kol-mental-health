import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      vertexai: true
    });

    const { mood, journal, examName, moodHistory } = await req.json();

    const prompt = `You are a calm, emotionally intelligent wellness companion for a student preparing for ${examName || 'competitive exams'} in India. 
You are not a therapist and must never give clinical/medical advice or diagnose anything.

Today's mood rating (1-5, 5=great): ${mood}
Today's journal entry: "${journal}"
Recent mood trend (last 5 days): [${(moodHistory || []).join(', ')}]

Analyze the journal entry for the SPECIFIC underlying stress trigger (e.g. fear of disappointing parents, 
comparison with peers, fear of failure, burnout from over-studying, sleep deprivation, specific subject anxiety). 
Do not default to generic "exam stress" — find what's actually said or implied.

Respond ONLY in this exact JSON format, nothing else, no markdown fences:
{
  "detected_trigger": "one short specific phrase, max 8 words",
  "validation": "one warm sentence that makes the student feel heard, referencing their specific situation",
  "coping_action": "one concrete, specific action takeable in under 5 minutes, tailored to the trigger — not generic 'take deep breaths'",
  "why_this_helps": "one sentence explaining the mechanism, simple language",
  "encouragement": "one short, non-cliché motivating line, max 15 words"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text;
    if (!text) {
      throw new Error('No content returned from model');
    }

    // Strip markdown fences if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return NextResponse.json(JSON.parse(text));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate response';
    console.error('AI route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
