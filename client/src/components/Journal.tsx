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

export default function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEntries, setShowEntries] = useState(false);

  useEffect(() => {
    loadEntries();
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
      loadEntries();
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

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="What's on your mind today?"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
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
                  <div>
                    <span className="text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <span className="ml-4 text-sm font-semibold text-gray-700">
                      {entry.mood}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-400 hover:text-gray-600"
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
                  <p className="text-sm text-gray-600 italic">
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