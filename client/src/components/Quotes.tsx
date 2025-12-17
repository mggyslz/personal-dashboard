import { useState, useEffect } from 'react';
import { api } from '../services/api';

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

  const refreshQuote = async () => {
    setLoading(true);
    try {
      const data = await api.getRandomQuote();
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Quote of the Day</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Quote of the Day</h2>
        <p className="text-gray-500">Unable to load quote</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Quote of the Day</h2>
        <button
          onClick={refreshQuote}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        <p className="text-gray-700 text-lg italic leading-relaxed">
          "{quote.text}"
        </p>
        <p className="text-gray-600 text-sm font-medium text-right">
          — {quote.author}
        </p>
      </div>
    </div>
  );
}