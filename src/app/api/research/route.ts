import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic, examName } = await req.json();
    let researchContext = '';

    if (process.env.EXA_API_KEY && topic) {
      const searchQuery = `Encouraging facts or study help for: ${topic} regarding ${examName}`;
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
    }
    return NextResponse.json({ research: researchContext });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
