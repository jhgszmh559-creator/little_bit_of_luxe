import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Missing required field: content' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key is not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are an expert editorial writer for "Little bit of LUXE", a premium luxury travel publication. 
Your writing style is elevated but down-to-earth, avoiding cliches and overly corporate marketing jargon.

Given the body content of a luxury travel article, your task is to write a high-converting, concise newsletter summary (excerpt).
The summary should be exactly one elegant, poetic, serif italic sentence setting the scene. It must be between 120 and 160 characters long.
Do NOT output any markdown formatting, quotes, or conversational filler. Output JUST the sentence itself.`;

    const userPrompt = `Here is the article content:\n\n${content}\n\nWrite the summary sentence now:`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    return NextResponse.json({ summary: responseText });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during generation' }, { status: 500 });
  }
}
