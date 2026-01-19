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
  if (mood.includes('Positive')) return 'bg-green-200 border-green-400 text-green-900';
  if (mood.includes('Negative')) return 'bg-red-200 border-red-400 text-red-900';
  return 'bg-gray-200 border-gray-400 text-gray-900';
};

const getMoodIcon = (mood: string) => {
  if (mood.includes('Positive')) return <Smile size={14} className="text-green-800" />;
  if (mood.includes('Negative')) return <Frown size={14} className="text-red-800" />;
  return <Meh size={14} className="text-gray-800" />;
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

  // Handle body scroll when modal is open
  useEffect(() => {
    if (expandedEntry) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [expandedEntry]);

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
    <>
      {/* Main Journal Component */}
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 h-full bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 border-2 border-black">
              <BookOpen className="text-black" size={20} strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black text-black">JOURNAL</h2>
          </div>
          <div className="px-3 py-1 border-2 border-black text-sm font-bold">
            {entries.length} ENTRIES
          </div>
        </div>

        {analysisResult && (
          <div className="mb-6 border-2 border-black bg-yellow-100 p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-black text-black">AI INSIGHTS</h3>
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-black hover:text-gray-700"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-black text-black uppercase tracking-wider">MOOD</span>
                <div className={`inline-flex items-center gap-2 ml-3 px-3 py-1 border-2 font-black ${getMoodColor(analysisResult.mood)}`}>
                  {getMoodIcon(analysisResult.mood)}
                  {analysisResult.mood}
                </div>
              </div>

              {analysisResult.themes && analysisResult.themes.length > 0 && (
                <div>
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-2">THEMES</span>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.themes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white border-2 border-black text-black text-sm font-black"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.insights && (
                <div>
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-2">REFLECTION</span>
                  <p className="text-sm text-black leading-relaxed bg-white p-4 border-2 border-black font-bold">
                    {analysisResult.insights}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative mb-3">
            <textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder={currentPrompt}
              rows={4}
              className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 resize-none font-bold"
            />
            {newEntry.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-black font-black">
                {wordCount} {wordCount === 1 ? 'WORD' : 'WORDS'}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting || !newEntry.trim()}
            className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-3 border-2 border-black font-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <Send size={16} strokeWidth={2} />
            {submitting ? 'ANALYZING...' : 'SAVE ENTRY'}
          </button>
        </form>

        <button
          onClick={() => setShowEntries(!showEntries)}
          className="flex items-center justify-between w-full px-3 py-2 border-2 border-black bg-white font-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all mb-4"
        >
          <span>
            {showEntries ? 'HIDE' : 'VIEW'} PAST ENTRIES
          </span>
          {showEntries ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
        </button>

        {showEntries && (
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-black bg-gray-50">
                <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center mb-4 border-2 border-black">
                  <BookOpen className="text-black" size={24} strokeWidth={2} />
                </div>
                <h4 className="text-lg font-black text-black mb-2">NO JOURNAL ENTRIES YET</h4>
                <p className="text-black text-sm font-bold">WRITE YOUR FIRST ENTRY TO BEGIN</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative bg-white border-2 border-black p-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border-2 border-black flex items-center justify-center">
                          <Calendar className="text-black" size={14} strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="font-black text-black">
                            {formatDate(entry.date).toUpperCase()}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border-2 text-xs font-black ${getMoodColor(entry.mood)}`}>
                              {getMoodIcon(entry.mood)}
                              <span>{entry.mood}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setExpandedEntry(entry)}
                          className="p-1.5 hover:bg-gray-100 border border-black hover:border-black transition-colors text-black"
                          title="View Details"
                        >
                          <Eye size={14} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 hover:bg-red-100 border border-black hover:border-red-600 transition-colors text-black"
                          title="Delete"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-black text-sm leading-relaxed font-bold line-clamp-3">
                        {entry.text}
                      </p>
                      {entry.text.length > 150 && (
                        <button
                          className="mt-2 text-xs text-black hover:text-gray-700 font-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedEntry(entry);
                          }}
                        >
                          READ MORE →
                        </button>
                      )}
                    </div>
                    
                    {entry.themes && entry.themes.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {entry.themes.slice(0, 3).map((theme, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white border border-black text-black text-xs font-black"
                            >
                              {theme}
                            </span>
                          ))}
                          {entry.themes.length > 3 && (
                            <span className="px-2 py-0.5 bg-white border border-black text-black text-xs font-black">
                              +{entry.themes.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-black">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-black font-black">
                          {entry.text.split(/\s+/).length} WORDS
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedEntry(entry);
                          }}
                          className="text-xs text-black hover:text-gray-700 font-black flex items-center gap-1"
                        >
                          <Eye size={12} strokeWidth={2} />
                          VIEW DETAILS
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

      {/* Expanded Entry Modal - Neobrutalism Style */}
      {expandedEntry && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setExpandedEntry(null)}
          ></div>
          
          {/* Modal container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
                            w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded border-2 border-black flex items-center justify-center">
                      <Calendar className="text-black" size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-black">
                        {formatDate(expandedEntry.date).toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 border-2 text-xs font-black ${getMoodColor(expandedEntry.mood)}`}>
                          {getMoodIcon(expandedEntry.mood)}
                          {expandedEntry.mood}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedEntry(null)}
                    className="p-1.5 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border-2 border-black p-6">
                    <h4 className="text-sm font-black text-black mb-3">ENTRY</h4>
                    <div className="text-black leading-relaxed whitespace-pre-wrap font-bold">
                      {expandedEntry.text}
                    </div>
                  </div>

                  {expandedEntry.themes && expandedEntry.themes.length > 0 && (
                    <div className="bg-yellow-100 border-2 border-black p-6">
                      <h4 className="text-sm font-black text-black mb-3">THEMES</h4>
                      <div className="flex flex-wrap gap-2">
                        {expandedEntry.themes.map((theme, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white border-2 border-black text-black text-sm font-black"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {expandedEntry.insights && (
                    <div className="bg-green-100 border-2 border-black p-6">
                      <h4 className="text-sm font-black text-black mb-3">AI INSIGHTS</h4>
                      <div className="text-black leading-relaxed font-bold">
                        {expandedEntry.insights}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t-2 border-black">
                    <span className="text-xs text-black font-black">
                      CREATED: {new Date(expandedEntry.date).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      }).toUpperCase()}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this journal entry?')) {
                          setExpandedEntry(null);
                          handleDelete(expandedEntry.id);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 border-2 border-red-600 bg-red-100 text-red-900 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] transition-all font-black text-sm"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                      DELETE ENTRY
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}