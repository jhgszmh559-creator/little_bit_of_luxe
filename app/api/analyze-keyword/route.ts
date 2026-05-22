import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { content, keyword } = await request.json();

    if (!content || !keyword) {
      return NextResponse.json({ error: 'Missing content or keyword parameters' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are an SEO and Editorial Director for "Little bit of LUXE", a premium luxury travel publication. 
Analyze the following article body content and the target focus keyword/phrase.
Identify exactly 2 or 3 best semantic/thematic insertion points where this focus keyword/phrase can be naturally integrated without ruining the editorial, high-end tone of the journal.

Target Focus Keyword: "${keyword}"

Article Content:
${content}

Return a JSON array of objects. Do not return any other text, conversational wrapper, or markdown formatting (like \`\`\`json). The response must be a valid JSON array matching this typescript structure:
Array<{
  context: string; // A short quote of 1-2 sentences from the original article copy where the keyword should be inserted.
  suggestion: string; // A specific, actionable step-by-step editing hint showing how to rephrase this context to seamlessly include the keyword.
}>`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    let suggestions = [];
    try {
      suggestions = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON response:', responseText);
      // Fallback parsing or return raw text
      return NextResponse.json({ 
        error: 'Invalid response format from AI model', 
        raw: responseText 
      }, { status: 500 });
    }

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error in analyze-keyword API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
