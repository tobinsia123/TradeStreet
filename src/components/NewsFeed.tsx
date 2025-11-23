import { useMemo } from 'react';
import { NewsEvent } from '../types/market';

interface NewsFeedProps {
  news: NewsEvent[];
}

export function NewsFeed({ news }: NewsFeedProps) {
  // Memoize sorted news to prevent unnecessary re-sorts on every render
  const sortedNews = useMemo(() => {
    return [...news].sort((a, b) => b.timestamp - a.timestamp);
  }, [news]);

  if (sortedNews.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded p-4">
        <div className="text-gray-500 text-center">No news yet</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4 h-full overflow-y-auto">
      <div className="text-white font-bold mb-4">Market News</div>
      <div className="space-y-4">
        {sortedNews.map((item) => {
          const isPositive = item.sentiment > 0;
          const sentimentColor = isPositive ? 'text-green-400' : 'text-red-400';
          
          return (
            <div key={`${item.ticker}-${item.timestamp}`} className="border-b border-gray-800 pb-3 last:border-0">
              <div className="flex justify-between items-start mb-1">
                <div className="text-white font-mono font-bold text-sm">
                  {item.ticker}
                </div>
                <div className={`text-xs font-mono ${sentimentColor}`}>
                  {item.sentiment > 0 ? '+' : ''}
                  {(item.sentiment * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-white font-semibold text-sm mb-1">
                {item.headline}
              </div>
              <div className="text-gray-400 text-xs">{item.body}</div>
              <div className="text-gray-600 text-xs mt-1">
                {new Date(item.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

