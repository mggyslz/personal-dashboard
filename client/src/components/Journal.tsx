import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookOpen, Send, ChevronDown, ChevronUp, Trash2, X, Calendar, Eye, Smile, Frown, Meh } from 'lucide-react';

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
  if (mood.includes('Positive')) return 'bg-green-50 text-green-700 border-green-100';
  if (mood.includes('Negative')) return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-gray-50 text-gray-700 border-gray-100';
};

const getMoodIcon = (mood: string) => {
  if (mood.includes('Positive')) return <Smile size={12} className="text-green-600" />;
  if (mood.includes('Negative')) return <Frown size={12} className="text-red-600" />;
  return <Meh size={12} className="text-gray-600" />;
};

export default function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Entry | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<Entry | null>(null);

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
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    
    try {
      await api.deleteEntry(id);
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
              <div className={`inline-flex items-center gap-2 ml-3 px-3 py-1 rounded-full text-sm font-light border ${getMoodColor(analysisResult.mood)}`}>
                {getMoodIcon(analysisResult.mood)}
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

      {expandedEntry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Calendar className="text-gray-600" size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatDate(expandedEntry.date)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-xs font-medium ${getMoodColor(expandedEntry.mood)}`}>
                      {getMoodIcon(expandedEntry.mood)}
                      {expandedEntry.mood}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExpandedEntry(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Entry</h4>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {expandedEntry.text}
                </div>
              </div>

              {expandedEntry.themes && expandedEntry.themes.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
                  <h4 className="text-sm font-medium text-indigo-700 mb-3">Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {expandedEntry.themes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white text-indigo-700 text-sm rounded-full border border-indigo-200"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {expandedEntry.insights && (
                <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
                  <h4 className="text-sm font-medium text-amber-700 mb-3">AI Insights</h4>
                  <div className="text-amber-800 leading-relaxed">
                    {expandedEntry.insights}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Created: {new Date(expandedEntry.date).toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    setExpandedEntry(null);
                    handleDelete(expandedEntry.id);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                  Delete Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEntries && (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4 border border-gray-200">
                <BookOpen className="text-gray-400" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">No journal entries yet</h4>
              <p className="text-gray-500 text-sm">Write your first entry to begin your journal</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative bg-white rounded-xl p-5 border border-gray-200 
                           hover:border-gray-300 hover:shadow-md transition-all duration-200 
                           cursor-pointer h-full flex flex-col"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Calendar className="text-gray-500" size={14} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {formatDate(entry.date)}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${getMoodColor(entry.mood)}`}>
                              {getMoodIcon(entry.mood)}
                              <span className="text-xs text-gray-600 font-light">
                                {entry.mood}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setExpandedEntry(entry)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm leading-relaxed font-light line-clamp-3">
                        {entry.text}
                      </p>
                      {entry.text.length > 150 && (
                        <button
                          className="mt-2 text-xs text-gray-500 hover:text-gray-700 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedEntry(entry);
                          }}
                        >
                          Read more
                        </button>
                      )}
                    </div>
                    
                    {entry.themes && entry.themes.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {entry.themes.slice(0, 3).map((theme, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-light"
                            >
                              {theme}
                            </span>
                          ))}
                          {entry.themes.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full font-light">
                              +{entry.themes.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-light">
                        {entry.text.split(/\s+/).length} words
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedEntry(entry);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                      >
                        <Eye size={12} />
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}