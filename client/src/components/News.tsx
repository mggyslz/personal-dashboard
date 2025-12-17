import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const data = await api.getNews();
      setArticles(data);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">News</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Latest News</h2>

      {articles.length === 0 ? (
        <p className="text-gray-500">No news available</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {articles.slice(0, 3).map((article) => (
            <div
              key={article.url}
              className="border-b pb-3 last:border-0"
            >
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-gray-600 font-medium block mb-1"
              >
                {article.title}
              </a>
              <p className="text-xs text-gray-500">
                {article.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
