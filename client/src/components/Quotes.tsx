import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Quote as QuoteIcon, RotateCw } from 'lucide-react';

interface QuoteData {
  text: string;
  author: string;
}

// Cache keys for localStorage
const CACHE_KEYS = {
  DAILY_QUOTE: 'daily_quote_cache',
  DAILY_QUOTE_DATE: 'daily_quote_date',
  RANDOM_QUOTE: 'random_quote_cache'
};

export default function Quote() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); 
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadQuote('daily');
  }, []);

  // Check if we should use cached daily quote (same day)
  const shouldUseCachedDailyQuote = (): boolean => {
    const cachedDate = localStorage.getItem(CACHE_KEYS.DAILY_QUOTE_DATE);
    if (!cachedDate) return false;
    
    const today = new Date().toDateString();
    return cachedDate === today;
  };

  // Get cached daily quote
  const getCachedDailyQuote = (): QuoteData | null => {
    const cachedQuote = localStorage.getItem(CACHE_KEYS.DAILY_QUOTE);
    if (cachedQuote) {
      try {
        return JSON.parse(cachedQuote);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Cache a quote
  const cacheQuote = (quoteData: QuoteData, type: 'daily' | 'random') => {
    if (type === 'daily') {
      localStorage.setItem(CACHE_KEYS.DAILY_QUOTE, JSON.stringify(quoteData));
      localStorage.setItem(CACHE_KEYS.DAILY_QUOTE_DATE, new Date().toDateString());
    } else {
      localStorage.setItem(CACHE_KEYS.RANDOM_QUOTE, JSON.stringify(quoteData));
    }
  };

  const loadQuote = async (type: 'daily' | 'random') => {
    const setLoadingState = type === 'daily' ? setInitialLoading : setIsRefreshing;
    
    setLoadingState(true);
    
    try {
      let data;
      
      // For daily quotes, check cache first
      if (type === 'daily' && shouldUseCachedDailyQuote()) {
        data = getCachedDailyQuote();
        if (data) {
          setQuote(data);
          setLoadingState(false);
          return;
        }
      }
      
      // If no cache or random quote, fetch from API
      if (type === 'daily') {
        data = await api.getDailyQuote();
        // Cache the daily quote
        if (data) {
          cacheQuote(data, 'daily');
        }
      } else {
        data = await api.getRandomQuote();
        // Cache the random quote (optional, for page refresh persistence)
        if (data) {
          cacheQuote(data, 'random');
        }
      }
      
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      
      // Fallback to cached quote if available
      if (type === 'daily') {
        const cached = getCachedDailyQuote();
        if (cached) {
          setQuote(cached);
        }
      }
    } finally {
      setLoadingState(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200/50 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200/50 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5">
        <p className="text-gray-400 font-light">Unable to load quote</p>
      </div>
    );
  }

  return (
    <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 relative">
      
      {/* Refresh Button */}
      <button
        onClick={() => loadQuote('random')}
        disabled={isRefreshing}
        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 p-2 rounded-full hover:bg-white/50"
        title="Get a random quote"
      >
        <RotateCw 
          size={18} 
          className={isRefreshing ? 'animate-spin' : ''} 
        />
      </button>

      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center">
            <QuoteIcon className="text-blue-400" size={20} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-light text-gray-700">Daily Quote</h3>
        </div>
        
        {/* Quote Content */}
        <div className={`flex-1 flex flex-col justify-center ${isRefreshing ? 'opacity-50 transition-opacity duration-300' : 'transition-opacity duration-300'}`}>
          <p className="text-gray-800 text-xl font-light leading-relaxed mb-6 italic">
            "{quote.text}"
          </p>
          <div className="pt-4 border-t border-gray-200/50 mt-auto">
            <p className="text-gray-500 text-sm font-light tracking-wide">
              — {quote.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}