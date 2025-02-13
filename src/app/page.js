'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    // navigate to analysis page with query params
    const params = new URLSearchParams({
      keyword,
      startDate,
      endDate,
      sourceType,
    });
    router.push(`/analysis?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      <FloatingBubbles />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/[0.2] shadow-[0_4px_20px_rgba(195,175,227,0.5)]">
          <CardHeader>
            <CardTitle className="text-center">
              <span
                className={cn(
                  "inline-block mx-4 pb-6 overflow-visible text-4xl sm:text-6xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple/90 to-rose-300",
                  pacifico.className
                )}
              >
                Naver Scraper
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="keyword" className="text-black">
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
                <Label htmlFor="startDate" className="text-black">
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
                <Label htmlFor="endDate" className="text-black">
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
                <Label htmlFor="sourceType" className="text-black">
                  Source Type
                </Label>
                <Select
                  id="sourceType"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                >
                  <option value="blog">Blog</option>
                  <option value="news">News</option>
                  <option value="all">All Naver</option>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Scrape & Analyze
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
