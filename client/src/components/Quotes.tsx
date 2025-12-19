import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Quote as QuoteIcon } from 'lucide-react';

interface QuoteData {
  text: string;
  author: string;
}

export default function Quote() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, []);

  const loadQuote = async () => {
    try {
      const data = await api.getDailyQuote();
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
      <QuoteIcon className="text-gray-300 mb-4" size={24} strokeWidth={1.5} />
      <p className="text-gray-700 text-lg font-light leading-relaxed mb-4">
        "{quote.text}"
      </p>
      <p className="text-gray-500 text-sm font-light">
        — {quote.author}
      </p>
    </div>
  );
}