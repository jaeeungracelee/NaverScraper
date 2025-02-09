// pages/api/scrape.js
import axios from 'axios';
import { createObjectCsvWriter } from 'csv-writer';

const client_id = process.env.NAVER_CLIENT_ID;
const client_secret = process.env.NAVER_CLIENT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { keyword, startDate, endDate, sourceType } = req.body;

    const headers = {
      'X-Naver-Client-Id': client_id,
      'X-Naver-Client-Secret': client_secret,
    };

    const results = [];

    const searchNaver = async (query, start, display, type) => {
      const encText = encodeURIComponent(query);
      const url = `https://openapi.naver.com/v1/search/${type}.json?query=${encText}&start=${start}&display=${display}`;
      const response = await axios.get(url, { headers });
      return response.data;
    };

    const parseItems = (jsonData, keyword, sourceType) => {
      const items = jsonData.items || [];
      return items.map(item => ({
        source: sourceType,
        keyword,
        title: item.title.replace(/<b>|<\/b>/g, ''),
        link: item.link,
        description: item.description.replace(/<b>|<\/b>/g, ''),
        author: item.bloggername || item.author || '',
        author_link: item.bloggerlink || '',
        date: item.postdate || item.pubDate,
      }));
    };

    let start = 1;
    while (start <= 1000) {
      const jsonData = await searchNaver(keyword, start, 100, sourceType);
      if (jsonData.items && jsonData.items.length > 0) {
        const parsedItems = parseItems(jsonData, keyword, sourceType);
        results.push(...parsedItems);
        if (jsonData.items.length < 100) break;
        start += 100;
      } else {
        break;
      }
    }

    const csvPath = `./public/${keyword}_${startDate}_${endDate}_${sourceType}.csv`;
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

    return res.status(200).json({
      success: true,
      filePath: `/${keyword}_${startDate}_${endDate}_${sourceType}.csv`,
    });
  } catch (error) {
    console.error('Error in scraping:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
