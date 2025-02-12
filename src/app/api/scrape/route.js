// src/app/api/scrape/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs/promises';

export async function POST(req) {
  try {
    const requestBody = await req.json();
    console.log('Received request:', requestBody);

    const { keyword, startDate, endDate, sourceType } = requestBody;

    if (!keyword || !startDate || !endDate || !sourceType) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client_id = process.env.NAVER_CLIENT_ID;
    const client_secret = process.env.NAVER_CLIENT_SECRET;
    if (!client_id || !client_secret) {
      console.error('Missing Naver API credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const headers = {
      'X-Naver-Client-Id': client_id,
      'X-Naver-Client-Secret': client_secret,
    };

    const sourceTypes = sourceType === 'all' ? ['news', 'blog'] : [sourceType];

    const results = [];

    const searchNaver = async (query, start, display, type) => {
      const encText = encodeURIComponent(query);
      const url = `https://openapi.naver.com/v1/search/${type}.json?query=${encText}&start=${start}&display=${display}`;
      try {
        console.log('Making request to Naver API:', url);
        const response = await axios.get(url, { headers });
        console.log('Naver API response:', response.data);
        return response.data;
      } catch (error) {
        console.error("Error in axios.get:", {
          message: error.message,
          response: error.response
            ? {
                data: error.response.data,
                status: error.response.status,
                headers: error.response.headers,
              }
            : null,
          config: error.config,
          stack: error.stack,
        });
        throw error;
      }
    };

    const parseItems = (jsonData, keyword, type) => {
      const items = jsonData.items || [];
      console.log(`Parsing ${items.length} items for source: ${type}`);
      return items.map(item => ({
        source: type,
        keyword,
        title: item.title.replace(/<b>|<\/b>/g, ''),
        link: item.link,
        description: item.description.replace(/<b>|<\/b>/g, ''),
        author: item.bloggername || item.author || '',
        author_link: item.bloggerlink || '',
        date: item.postdate || item.pubDate,
      }));
    };

    // iterate
    for (const type of sourceTypes) {
      let start = 1;
      while (start <= 1000) {
        console.log(`Fetching page ${start} for source: ${type}`);
        const jsonData = await searchNaver(keyword, start, 100, type);
        if (jsonData.items && jsonData.items.length > 0) {
          const parsedItems = parseItems(jsonData, keyword, type);
          results.push(...parsedItems);
          // less than 100 items means we've reached the end
          if (jsonData.items.length < 100) break;
          start += 100;
        } else {
          break;
        }
      }
    }

    const sourceLabel = sourceTypes.join('_');
    const filename = `${keyword}_${startDate}_${endDate}_${sourceLabel}.csv`;
    const csvPath = `/tmp/${filename}`;
    console.log('Writing CSV to:', csvPath);

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
    console.log('CSV written successfully');

    const csvData = await fs.readFile(csvPath, 'utf8');
    console.log('CSV read successfully');

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
      },
    });
  } catch (error) {
    console.error('Error in scraping:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
