import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookOpen, Send, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';

interface Entry {
  id: number;
  date: string;
  text: string;
  mood: string;
  themes: string[];
  insights: string;
}

const writingPrompts = [
  "What's on your mind today?",
  "What made you smile today?",
  "What's one thing you're grateful for?",
  "What challenged you today?",
  "What's something you learned recently?",
  "How are you feeling right now?",
  "What's a goal you're working toward?",
  "What's been weighing on you lately?",
  "What surprised you today?",
  "What do you need more of in your life?"
];

const getMoodColor = (mood: string) => {
  if (mood.includes('Positive')) return 'text-green-600 bg-green-50 border-green-200';
  if (mood.includes('Negative')) return 'text-red-600 bg-red-50 border-red-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

export default function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Entry | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    loadEntries();
    setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
  }, []);

  const loadEntries = async () => {
    try {
      const data = await api.getEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;

    setSubmitting(true);
    try {
      await api.createEntry({
        text: newEntry,
        date: new Date().toISOString().split('T')[0],
      });
      setNewEntry('');
      await loadEntries();
      const data = await api.getEntries();
      if (data.length > 0) {
        setAnalysisResult(data[0]);
      }
      setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
    } catch (error) {
      console.error('Error creating entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteEntry(id);
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const wordCount = newEntry.trim().split(/\s+/).filter(w => w.length > 0).length;

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="text-gray-400" size={20} strokeWidth={1.5} />
        <h2 className="text-lg font-light text-gray-700">Journal</h2>
      </div>

      {analysisResult && (
        <div className="mb-6 border border-indigo-200 rounded-2xl p-5 bg-indigo-50/50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-normal text-indigo-900">AI Insights</h3>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-indigo-400 hover:text-indigo-600"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-xs font-light text-indigo-600 uppercase tracking-wider">Mood</span>
              <div className={`inline-block ml-3 px-3 py-1 rounded-full text-sm font-light border ${getMoodColor(analysisResult.mood)}`}>
                {analysisResult.mood}
              </div>
            </div>

            {analysisResult.themes && analysisResult.themes.length > 0 && (
              <div>
                <span className="text-xs font-light text-indigo-600 uppercase tracking-wider block mb-2">Themes</span>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.themes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white text-indigo-700 text-sm rounded-full border border-indigo-200 font-light"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.insights && (
              <div>
                <span className="text-xs font-light text-indigo-600 uppercase tracking-wider block mb-2">Reflection</span>
                <p className="text-sm text-indigo-900 leading-relaxed bg-white p-4 rounded-xl border border-indigo-100 font-light">
                  {analysisResult.insights}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder={currentPrompt}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent resize-none font-light"
          />
          {newEntry.length > 0 && (
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-light">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting || !newEntry.trim()}
          className="mt-3 flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-light"
        >
          <Send size={16} strokeWidth={1.5} />
          {submitting ? 'Analyzing...' : 'Save Entry'}
        </button>
      </form>

      <button
        onClick={() => setShowEntries(!showEntries)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-light mb-4"
      >
        {showEntries ? <ChevronUp size={18} strokeWidth={1.5} /> : <ChevronDown size={18} strokeWidth={1.5} />}
        {showEntries ? 'Hide' : 'View'} Past Entries ({entries.length})
      </button>

      {showEntries && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-gray-400 font-light text-center py-8">No entries yet</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-2xl p-5 bg-gray-50/30 group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-light">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={`px-2 py-1 text-xs font-light rounded-full border ${getMoodColor(entry.mood)}`}>
                      {entry.mood}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <Trash2 size={14} strokeWidth={1.5} className="text-gray-400" />
                  </button>
                </div>
                <p className="text-gray-700 mb-3 font-light leading-relaxed">{entry.text}</p>
                {entry.themes && entry.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {entry.themes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-light"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
                {entry.insights && (
                  <p className="text-sm text-gray-500 italic mt-3 pt-3 border-t border-gray-200 font-light">
                    {entry.insights}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}