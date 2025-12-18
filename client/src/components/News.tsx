import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Calendar, ExternalLink, RefreshCw, Newspaper, Globe, Filter } from 'lucide-react';

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
      setError('Failed to load news. Please check your API key and try again.');
      setArticles([]);
      setFilteredArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadNews();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      loadNews();
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search news');
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
        day: 'numeric',
        year: 'numeric'
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
    { value: 'au', label: 'Australia' },
    { value: 'jp', label: 'Japan' },
    { value: 'kr', label: 'South Korea' }
  ];

  if (loading && articles.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-7 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-4 last:border-0">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Newspaper className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Latest News</h2>
            <p className="text-sm text-gray-500">Stay updated with current events worldwide</p>
          </div>
        </div>
        
        <button
          onClick={loadNews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh News'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadNews}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search news by title, description, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter size={16} />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          {/* Country Selector */}
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-gray-400" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            >
              {countries.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Info */}
      {articles.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-sm text-gray-600">
            {searchTerm ? (
              <>
                Found <span className="font-semibold text-blue-600">{filteredArticles.length}</span> news matching "{searchTerm}"
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-blue-600">{filteredArticles.length}</span> latest news from {countries.find(c => c.value === country)?.label}
              </>
            )}
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                loadNews();
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search & show all
            </button>
          )}
        </div>
      )}

      {/* News Articles */}
      {filteredArticles.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">No news articles found</p>
          <p className="text-sm text-gray-400 mb-4">
            {searchTerm 
              ? 'Try a different search term or clear the search'
              : 'Try changing the country or category filters'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCountry('us');
              setCategory('technology');
              loadNews();
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article, index) => (
            <div
              key={`${article.url}-${article.publishedAt}-${index}`}
              className="group border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Article Image */}
                {article.image && (
                  <div className="sm:w-40 sm:flex-shrink-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-40 sm:h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </a>
                  </div>
                )}

                {/* Article Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 line-clamp-2 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-3 mb-3">
                          {article.description}
                        </p>
                      </a>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 mt-1 flex-shrink-0 group-hover:text-blue-500" />
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {article.source}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium group/link"
                    >
                      Read full story
                      <ExternalLink size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Articles Message */}
      {articles.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
            <Newspaper size={24} className="text-blue-500" />
          </div>
          <p className="text-gray-500 mb-2">No news articles available</p>
          <p className="text-sm text-gray-400 mb-4">
            Check your API key configuration or try a different country/category
          </p>
        </div>
      )}
    </div>
  );
}