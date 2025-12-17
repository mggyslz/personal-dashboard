import { useState, useEffect } from 'react';
import { api } from '../services/api';

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
      // Show the most recent entry (first one) as analysis result
      const data = await api.getEntries();
      if (data.length > 0) {
        setAnalysisResult(data[0]);
      }
      // Rotate to new prompt
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
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Journal</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Journal</h2>

      {/* AI Analysis Result Modal */}
      {analysisResult && (
        <div className="mb-6 border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-indigo-900">AI Analysis Complete</h3>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-indigo-400 hover:text-indigo-600 text-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Mood</span>
              <div className={`inline-block ml-3 px-3 py-1 rounded-full text-sm font-semibold border ${getMoodColor(analysisResult.mood)}`}>
                {analysisResult.mood}
              </div>
            </div>

            {analysisResult.themes && analysisResult.themes.length > 0 && (
              <div>
                <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide block mb-2">Key Themes</span>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.themes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full border border-indigo-200"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.insights && (
              <div>
                <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide block mb-2">Insights</span>
                <p className="text-sm text-indigo-900 leading-relaxed bg-white p-3 rounded border border-indigo-100">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
          />
          {newEntry.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting || !newEntry.trim()}
          className="mt-2 bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? 'Analyzing...' : 'Save Entry'}
        </button>
      </form>

      <div className="mb-4">
        <button
          onClick={() => setShowEntries(!showEntries)}
          className="text-gray-700 hover:text-gray-900 font-medium"
        >
          {showEntries ? 'Hide' : 'Show'} Past Entries ({entries.length})
        </button>
      </div>

      {showEntries && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-gray-500">No entries yet. Start journaling!</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getMoodColor(entry.mood)}`}>
                      {entry.mood}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-800 mb-2">{entry.text}</p>
                {entry.themes && entry.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {entry.themes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
                {entry.insights && (
                  <p className="text-sm text-gray-600 italic mt-2 pt-2 border-t border-gray-200">
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