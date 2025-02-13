// src/app/api/scrape/route.js
import { NextResponse } from 'next/server';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs/promises';
import { scrapeData } from '../../../utils/scrapeData';

export async function POST(req) {
  try {
    const requestBody = await req.json();
    const { keyword, startDate, endDate, sourceType } = requestBody;

    if (!keyword || !startDate || !endDate || !sourceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client_id = process.env.NAVER_CLIENT_ID;
    const client_secret = process.env.NAVER_CLIENT_SECRET;
    if (!client_id || !client_secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const sourceTypes = sourceType === 'all' ? ['news', 'blog'] : [sourceType];

    // Use the shared scraping function
    const results = await scrapeData({ keyword, sourceTypes, client_id, client_secret });

    const sourceLabel = sourceTypes.join('_');
    const filename = `${keyword}_${startDate}_${endDate}_${sourceLabel}.csv`;
    const csvPath = `/tmp/${filename}`;

    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'source', title: 'Source' },
        { id: 'keyword', title: 'Keyword' },
        { id: 'title', title: 'Title' },
        { id: 'link', title: 'Link' },
        { id: 'description', title: 'Description' },
        { id: 'author', title: 'Author' },
        { id: 'author_link', title: 'Author Link' },
        { id: 'date', title: 'Date' },
      ],
    });

    await csvWriter.writeRecords(results);
    const csvData = await fs.readFile(csvPath, 'utf8');

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error('Error in scraping:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
