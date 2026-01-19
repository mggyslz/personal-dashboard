import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Calendar, ExternalLink, RefreshCw, Newspaper } from 'lucide-react';

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

  useEffect(() => {
    loadNews();
  }, [category]);

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
      // Simplified: Just get news with default country
      const data = await api.getNews('us', category, 20);
      setArticles(data);
      setFilteredArticles(data);
    } catch (error) {
      console.error('Error loading news:', error);
      setError('FAILED TO LOAD NEWS');
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
        return `${diffMinutes}M AGO`;
      }
      
      if (diffHours < 24) {
        return `${diffHours}H AGO`;
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }).toUpperCase();
    } catch {
      return 'RECENTLY';
    }
  };

  const categories = [
    { value: 'technology', label: 'TECHNOLOGY' },
    { value: 'business', label: 'BUSINESS' },
    { value: 'entertainment', label: 'ENTERTAINMENT' },
    { value: 'health', label: 'HEALTH' },
    { value: 'science', label: 'SCIENCE' },
    { value: 'sports', label: 'SPORTS' },
    { value: 'general', label: 'GENERAL' }
  ];

  if (loading && articles.length === 0) {
    return (
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 rounded w-1/3 bg-gray-200"></div>
            <div className="h-6 rounded w-16 bg-gray-200"></div>
          </div>
          <div className="h-32 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 h-full bg-white">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 border-2 border-black">
            <Newspaper className="text-black" size={20} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-black">LATEST NEWS</h2>
        </div>
        
        <button
          onClick={loadNews}
          disabled={loading}
          className="p-2 border-2 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <RefreshCw size={16} strokeWidth={2} className={`text-black ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-400">
          <p className="text-red-900 font-black">{error}</p>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black" size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="SEARCH NEWS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 font-bold"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 font-bold"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value} className="font-bold">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredArticles.length === 0 && !loading ? (
        <div className="text-center py-12 border-2 border-dashed border-black bg-gray-50">
          <p className="text-black font-black">NO ARTICLES FOUND</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredArticles.slice(0, 10).map((article, index) => (
            <a
              key={`${article.url}-${index}`}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="border-2 border-black bg-white p-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                <div className="flex gap-4">
                  {article.image && (
                    <div className="flex-shrink-0 w-24 h-24 border-2 border-black overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.style.background = '#f3f4f6';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-black group-hover:text-gray-700 line-clamp-2 mb-2 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3 font-bold">
                      {article.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-black">
                      <span className="font-black">{article.source.toUpperCase()}</span>
                      <span className="font-black">•</span>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} strokeWidth={2} />
                        <span className="font-black">{formatDate(article.publishedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <ExternalLink size={16} strokeWidth={2} className="text-black group-hover:text-gray-700 flex-shrink-0 transition-colors" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}