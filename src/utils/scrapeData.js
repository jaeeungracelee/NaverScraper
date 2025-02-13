// src/utils/scrapeData.js
import axios from 'axios';

export async function scrapeData({ keyword, sourceTypes, client_id, client_secret }) {
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

  const parseItems = (jsonData, keyword, type) => {
    const items = jsonData.items || [];
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

  for (const type of sourceTypes) {
    let start = 1;
    while (start <= 1000) {
      const jsonData = await searchNaver(keyword, start, 100, type);
      if (jsonData.items && jsonData.items.length > 0) {
        const parsedItems = parseItems(jsonData, keyword, type);
        results.push(...parsedItems);
        if (jsonData.items.length < 100) break;
        start += 100;
      } else {
        break;
      }
    }
  }
  return results;
}
