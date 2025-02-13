// src/app/api/analyze/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import axios from 'axios';
import { scrapeData } from '../../../utils/scrapeData';
import OpenAI from 'openai';

export async function POST(req) {
  try {
    // parse incoming request body
    const body = await req.json();
    const { keyword, startDate, endDate, sourceType } = body;

    if (!keyword || !startDate || !endDate || !sourceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client_id = process.env.NAVER_CLIENT_ID;
    const client_secret = process.env.NAVER_CLIENT_SECRET;
    if (!client_id || !client_secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const effectiveSourceTypes = sourceType === 'all' ? ['news', 'blog'] : [sourceType];

    // scrape data using the shared function
    const results = await scrapeData({ keyword, sourceTypes: effectiveSourceTypes, client_id, client_secret });

    if (!results.length) {
      return NextResponse.json({ error: 'No data scraped for analysis.' }, { status: 404 });
    }

    // Aggregate a subset (first 20 items) for the analysis prompt
    const aggregatedData = results
      .slice(0, 20)
      .map(
        (item, index) =>
          `Result ${index + 1}:\nTitle: ${item.title}\nDescription: ${item.description}`
      )
      .join('\n\n');

    const prompt = `Analyze the following media headlines and descriptions about the topic "${keyword}" in Korean.
    
Please provide the following in Korean:
1. A sentiment score percentage from 0% (most negative) to 100% (most positive).
2. Comments on the positive viewpoints.
3. Comments on the negative viewpoints.
4. A combined summary of how the media views the topic.

Data:
${aggregatedData}`;

    console.log("Generating analysis with OpenAI GPT-4o-mini...");

    // Ensure the OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }
    
    // Initialize the OpenAI client with static import
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
      { role: 'system', content: 'You are a Korean media analysis expert.' },
      { role: 'user', content: prompt }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const analysis = completion.choices[0].message.content.trim();
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error in analysis route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
