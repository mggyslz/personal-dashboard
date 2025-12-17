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
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">News</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Latest News</h2>

      {articles.length === 0 ? (
        <p className="text-gray-500">No news available</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {articles.slice(0, 3).map((article) => (
            <div
              key={article.url}
              className="border-b pb-2 last:border-0"
            >
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                {article.title}
              </a>

              <p className="text-xs text-gray-500 mt-1">
                {article.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
