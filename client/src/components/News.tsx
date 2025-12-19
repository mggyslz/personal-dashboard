import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Calendar, ExternalLink, RefreshCw, Newspaper, Globe } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  image?: string;
}

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('technology');
  const [country, setCountry] = useState('us');

  useEffect(() => {
    loadNews();
  }, [category, country]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredArticles(filtered);
    }
  }, [searchTerm, articles]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNews(country, category, 20);
      setArticles(data);
      setFilteredArticles(data);
    } catch (error) {
      console.error('Error loading news:', error);
      setError('Failed to load news');
      setArticles([]);
      setFilteredArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffHours * 60);
        return `${diffMinutes}m ago`;
      }
      
      if (diffHours < 24) {
        return `${diffHours}h ago`;
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const categories = [
    { value: 'technology', label: 'Technology' },
    { value: 'business', label: 'Business' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'health', label: 'Health' },
    { value: 'science', label: 'Science' },
    { value: 'sports', label: 'Sports' },
    { value: 'general', label: 'General' }
  ];

  const countries = [
    { value: 'us', label: 'USA' },
    { value: 'gb', label: 'UK' },
    { value: 'ph', label: 'Philippines' },
    { value: 'in', label: 'India' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' }
  ];

  if (loading && articles.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <Newspaper className="text-gray-400" size={20} strokeWidth={1.5} />
          <h2 className="text-lg font-light text-gray-700">Latest News</h2>
        </div>
        
        <button
          onClick={loadNews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} strokeWidth={1.5} className={`${loading ? 'animate-spin' : ''} text-gray-600`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-600 font-light">{error}</p>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent font-light"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Globe size={16} strokeWidth={1.5} className="text-gray-400" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 font-light"
            >
              {countries.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 font-light"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredArticles.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400 font-light">No articles found</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {filteredArticles.slice(0, 10).map((article, index) => (
            <a
              key={`${article.url}-${index}`}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex gap-4">
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-normal text-gray-800 group-hover:text-blue-600 line-clamp-2 mb-2 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 font-light">
                      {article.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-light">{article.source}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} strokeWidth={1.5} />
                        <span className="font-light">{formatDate(article.publishedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <ExternalLink size={16} strokeWidth={1.5} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div> // ← This closing div was missing
  );
}