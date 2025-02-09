'use client';

import { useState } from 'react';
import axios from 'axios';
import { FloatingBubbles } from '@/components/floatingbubbles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pacifico } from 'next/font/google';

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
});

const Select = (props) => (
  <select
    {...props}
    className="block w-full rounded-md border border-gray-300 bg-transparent py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sourceType, setSourceType] = useState('blog');
  const [filePath, setFilePath] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/scrape', {
        keyword,
        startDate,
        endDate,
        sourceType,
      });
      setFilePath(response.data.filePath);
    } catch (error) {
      console.error('Error scraping data:', error);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030303]">
 
      <FloatingBubbles />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/[0.2] shadow-lg">
          <CardHeader>
            <CardTitle className={cn("text-center text-xl font-bold text-white", pacifico.className)}>
              Naver Scraper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="keyword" className="text-white">
                  Keyword
                </Label>
                <Input
                  id="keyword"
                  type="text"
                  placeholder="Enter keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate" className="text-white">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-white">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sourceType" className="text-white">
                  Source Type
                </Label>
                <Select
                  id="sourceType"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                >
                  <option value="blog">Blog</option>
                  <option value="news">News</option>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Scrape
              </Button>
            </form>
            {filePath && (
              <a
                href={filePath}
                download
                className="block mt-4 text-center text-sm text-blue-300 hover:underline"
              >
                Download CSV
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
