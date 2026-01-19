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
    loadDailyQuote();
  }, []);

  const loadDailyQuote = async () => {
    try {
      const data = await api.getDailyQuote();
      setQuote(data);
    } catch (err) {
      console.error('Failed to load daily quote:', err);
    } finally {
      setLoading(false);
    }
  };

  const containerBase =
    'border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 h-full bg-white';

  if (loading) {
    return (
      <div className={containerBase}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-black/10 w-3/4" />
          <div className="h-4 bg-black/10 w-1/2" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className={`${containerBase} flex items-center justify-center`}>
        <p className="font-black border-2 border-black p-3">
          NO QUOTE AVAILABLE
        </p>
      </div>
    );
  }

  return (
    <div className={`${containerBase} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 border-2 border-black">
          <QuoteIcon size={20} />
        </div>
        <h3 className="text-lg font-black">QUOTE OF THE DAY</h3>
      </div>

      {/* Quote */}
      <div className="flex flex-col flex-1">
        <div className="p-4 border-2 border-black mb-4 flex-1">
          <p className="text-lg font-black italic leading-snug">
            “{quote.text}”
          </p>
        </div>

        <div className="pt-3 border-t-2 border-black mt-auto">
          <p className="font-black text-sm">
            — {quote.author.toUpperCase()}
          </p>
          <div className="font-black text-xs mt-1">
            DAILY INSPIRATION
          </div>
        </div>
      </div>
    </div>
  );
}
