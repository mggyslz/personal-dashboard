import { useState, useEffect } from 'react';
import { api } from '../services/api';
// Import necessary icons: Quote for the main display, and RotateCw for refresh
import { Quote as QuoteIcon, RotateCw } from 'lucide-react'; 

interface QuoteData {
  text: string;
  author: string;
}

export default function Quote() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  // Use a separate state for initial load vs. manual refresh loading
  const [initialLoading, setInitialLoading] = useState(true); 
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load the initial daily quote on component mount
  useEffect(() => {
    loadQuote('daily');
  }, []);

  /**
   * Loads a quote, either the daily one or a completely random one.
   * @param type 'daily' or 'random'
   */
  const loadQuote = async (type: 'daily' | 'random') => {
    const setLoadingState = type === 'daily' ? setInitialLoading : setIsRefreshing;
    
    setLoadingState(true);
    
    try {
      let data;
      if (type === 'daily') {
        data = await api.getDailyQuote(); // Uses the /quotes/daily endpoint
      } else {
        data = await api.getRandomQuote(); // Uses the /quotes endpoint
      }
      
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      // Keep the existing quote if refresh fails
    } finally {
      setLoadingState(false);
    }
  };

  // Combined loading check for initial render
  if (initialLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm">
        <p className="text-gray-400 font-light">Unable to load quote</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all relative">
      
      {/* Refresh Button */}
      <button
        onClick={() => loadQuote('random')}
        disabled={isRefreshing}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        title="Get a random quote"
      >
        <RotateCw 
          size={18} 
          // Animate the icon if refreshing
          className={isRefreshing ? 'animate-spin' : ''} 
        />
      </button>

      <QuoteIcon className="text-gray-300 mb-4" size={24} strokeWidth={1.5} />
      
      {/* Apply a slight opacity change while refreshing for visual feedback */}
      <div className={isRefreshing ? 'opacity-50 transition-opacity duration-300' : ''}>
        <p className="text-gray-700 text-lg font-light leading-relaxed mb-4">
          "{quote.text}"
        </p>
        <p className="text-gray-500 text-sm font-light">
          — {quote.author}
        </p>
      </div>
    </div>
  );
}