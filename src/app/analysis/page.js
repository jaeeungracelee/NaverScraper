'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { FloatingBubbles } from '@/components/floatingbubbles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pacifico } from 'next/font/google';

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
});

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const sourceType = searchParams.get('sourceType') || 'blog';

  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/analyze', {
        keyword,
        startDate,
        endDate,
        sourceType,
      });
      setAnalysis(response.data.analysis);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Failed to fetch analysis.');
    }
    setLoading(false);
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await axios.post(
        '/api/scrape',
        { keyword, startDate, endDate, sourceType },
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const disposition = response.headers['content-disposition'];
      let filename = 'download.csv';
      if (disposition && disposition.indexOf('filename*=') !== -1) {
        const filenameMatch = disposition.match(/filename\*=UTF-8''(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setError('Failed to download CSV.');
    }
  };

  // get analysis automatically when the component mounts
  useEffect(() => {
    fetchAnalysis();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      <FloatingBubbles />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen space-y-6">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/[0.2] shadow-[0_4px_20px_rgba(195,175,227,0.5)]">
          <CardHeader>
            <CardTitle className="text-center">
              <span
                className={cn(
                  "inline-block mx-4 pb-6 overflow-visible text-4xl sm:text-6xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple/90 to-rose-300",
                  pacifico.className
                )}
              >
                Analysis Results
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading analysis...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {analysis && (
              <div className="whitespace-pre-wrap text-black">
                {analysis}
              </div>
            )}
            <Button onClick={handleDownloadCSV} className="mt-4 w-full">
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
