import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Clipboard, Check, Maximize2 } from 'lucide-react';

interface CodeSnippet {
  id: number;
  title: string;
  code: string;
  language?: string;
}

export default function CodeEmbedManager() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);
  const [expandedSnippet, setExpandedSnippet] = useState<CodeSnippet | null>(null);
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '', language: 'javascript' });
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const languageOptions = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'sql'
  ];

  const handleCreateSnippet = () => {
    if (!newSnippet.title.trim()) return;
    const snippet: CodeSnippet = {
      id: Date.now(),
      title: newSnippet.title,
      code: newSnippet.code,
      language: newSnippet.language,
    };
    setSnippets([snippet, ...snippets]);
    setNewSnippet({ title: '', code: '', language: 'javascript' });
    setShowNew(false);
  };

  const handleUpdateSnippet = () => {
    if (!editingSnippet) return;
    setSnippets(snippets.map(s => s.id === editingSnippet.id ? editingSnippet : s));
    setEditingSnippet(null);
  };

  const handleDeleteSnippet = (id: number) => {
    if (!window.confirm('Delete this code snippet?')) return;
    setSnippets(snippets.filter(s => s.id !== id));
  };

  const handleCopy = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const resetForm = () => {
    setNewSnippet({ title: '', code: '', language: 'javascript' });
  };

  return (
    <div className="h-full bg-white/95 rounded-xl p-8 border border-gray-200/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
            <div className="text-gray-600 font-mono text-sm">{'<>'}</div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800">Code Snippets</h3>
            <p className="text-sm text-gray-500">Manage your reusable code blocks</p>
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
        >
          <Plus size={18} />
          <span className="text-sm">Add Snippet</span>
        </button>
      </div>

      {/* Expanded View Modal */}
      {expandedSnippet && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-4xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="text-gray-600 font-mono text-sm">{'<>'}</div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{expandedSnippet.title}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 mt-1">
                    {expandedSnippet.language}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExpandedSnippet(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 overflow-x-auto">
                <div className="text-gray-100 font-mono text-sm whitespace-pre">
                  {expandedSnippet.code}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleCopy(expandedSnippet.code, expandedSnippet.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copiedId === expandedSnippet.id ? <Check size={14} /> : <Clipboard size={14} />}
                  {copiedId === expandedSnippet.id ? 'Copied' : 'Copy Code'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSnippet(expandedSnippet);
                      setExpandedSnippet(null);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setExpandedSnippet(null);
                      handleDeleteSnippet(expandedSnippet.id);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Snippet Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">New Code Snippet</h3>
              <button
                onClick={() => {
                  setShowNew(false);
                  resetForm();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              <input
                type="text"
                placeholder="Title"
                value={newSnippet.title}
                onChange={e => setNewSnippet({ ...newSnippet, title: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-gray-900 placeholder-gray-400"
                autoFocus
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={newSnippet.language}
                  onChange={e => setNewSnippet({ ...newSnippet, language: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 text-gray-900"
                >
                  {languageOptions.map(lang => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <textarea
                placeholder="Code..."
                rows={8}
                value={newSnippet.code}
                onChange={e => setNewSnippet({ ...newSnippet, code: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 font-mono resize-none placeholder-gray-400"
              />
              
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowNew(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSnippet}
                  disabled={!newSnippet.title.trim()}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Create Snippet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Snippet Modal */}
      {editingSnippet && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Snippet</h3>
              <button onClick={() => setEditingSnippet(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              <input
                type="text"
                value={editingSnippet.title}
                onChange={e => setEditingSnippet({ ...editingSnippet, title: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-gray-900"
                autoFocus
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={editingSnippet.language || 'javascript'}
                  onChange={e => setEditingSnippet({ ...editingSnippet, language: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 text-gray-900"
                >
                  {languageOptions.map(lang => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <textarea
                value={editingSnippet.code}
                onChange={e => setEditingSnippet({ ...editingSnippet, code: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 font-mono resize-none"
              />
              
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  onClick={() => setEditingSnippet(null)}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSnippet}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snippets List - Vertical Layout */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {snippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4 border border-gray-200">
              <div className="text-gray-400 font-mono text-lg">{'<>'}</div>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No code snippets yet</h4>
            <p className="text-gray-500 text-sm mb-6">Create your first code snippet to get started</p>
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
            >
              Create Snippet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {snippets.map(snippet => (
              <div
                key={snippet.id}
                className="group relative bg-white rounded-lg p-4 border border-gray-200 
                           hover:border-gray-300 hover:shadow-sm transition-all duration-200 
                           cursor-pointer h-full flex flex-col"
                style={{ borderLeftColor: '#6B7280', borderLeftWidth: '4px' }}
                onClick={() => setExpandedSnippet(snippet)}
              >
                <div className="ml-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 pr-8">{snippet.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {snippet.language || 'javascript'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleCopy(snippet.code, snippet.id)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                        title="Copy"
                      >
                        {copiedId === snippet.id ? <Check size={14} /> : <Clipboard size={14} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingSnippet(snippet); }}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(snippet.id); }}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <pre className="text-gray-700 text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                      <code>{snippet.code.length > 300 ? `${snippet.code.substring(0, 300)}...` : snippet.code}</code>
                    </pre>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {snippet.code.length > 300 && (
                        <button
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSnippet(snippet);
                          }}
                        >
                          <Maximize2 size={12} />
                          View full code
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {snippet.code.length} chars
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}