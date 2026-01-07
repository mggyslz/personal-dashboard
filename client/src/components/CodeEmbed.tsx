import { useState, useEffect } from 'react';
import { api } from '../services/api'; // Adjust path as needed
import { Plus, Edit2, Trash2, Save, X, Clipboard, Check, Maximize2, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeSnippet {
  id: number;
  title: string;
  code: string;
  language: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function CodeEmbedManager() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);
  const [expandedSnippet, setExpandedSnippet] = useState<CodeSnippet | null>(null);
  const [newSnippet, setNewSnippet] = useState({ 
    title: '', 
    code: '', 
    language: 'javascript',
    description: ''
  });
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const languageOptions = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'sql'
  ];

  const languageColors: Record<string, string> = {
    javascript: '#F59E0B',
    typescript: '#3B82F6',
    python: '#10B981',
    java: '#EF4444',
    cpp: '#8B5CF6',
    csharp: '#EC4899',
    go: '#06B6D4',
    rust: '#F97316',
    php: '#8B5CF6',
    ruby: '#DC2626',
    swift: '#F59E0B',
    kotlin: '#7C3AED',
    html: '#E34F26',
    css: '#1572B6',
    sql: '#64748B',
    default: '#6B7280'
  };

  useEffect(() => {
    loadSnippets();
  }, []);

  // Handle body scroll when modals are open
  useEffect(() => {
    if (showNew || editingSnippet || expandedSnippet) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showNew, editingSnippet, expandedSnippet]);

  const loadSnippets = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCodeSnippets();
      setSnippets(data);
    } catch (error) {
      console.error('Error loading snippets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSnippet = async () => {
    if (!newSnippet.title.trim() || !newSnippet.code.trim()) return;
    
    try {
      const createdSnippet = await api.createCodeSnippet({
        title: newSnippet.title,
        code: newSnippet.code,
        language: newSnippet.language,
        description: newSnippet.description
      });
      
      setSnippets([createdSnippet, ...snippets]);
      resetForm();
      setShowNew(false);
    } catch (error) {
      console.error('Error creating snippet:', error);
      alert('Failed to create snippet');
    }
  };

  const handleUpdateSnippet = async () => {
    if (!editingSnippet) return;
    
    try {
      const updatedSnippet = await api.updateCodeSnippet(editingSnippet.id, {
        title: editingSnippet.title,
        code: editingSnippet.code,
        language: editingSnippet.language,
        description: editingSnippet.description
      });
      
      setSnippets(snippets.map(s => s.id === updatedSnippet.id ? updatedSnippet : s));
      setEditingSnippet(null);
    } catch (error) {
      console.error('Error updating snippet:', error);
      alert('Failed to update snippet');
    }
  };

  const handleDeleteSnippet = async (id: number) => {
    if (!window.confirm('Delete this code snippet?')) return;
    
    try {
      await api.deleteCodeSnippet(id);
      setSnippets(snippets.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting snippet:', error);
      alert('Failed to delete snippet');
    }
  };

  const handleCopy = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const resetForm = () => {
    setNewSnippet({ 
      title: '', 
      code: '', 
      language: 'javascript',
      description: '' 
    });
  };

  const getLanguageColor = (language?: string) => {
    const lang = language?.toLowerCase() || 'default';
    return languageColors[lang] || languageColors.default;
  };

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200/50 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200/50 rounded"></div>
            <div className="h-4 bg-gray-200/50 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Component with Glassmorphism */}
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Code className="text-gray-400" size={20} strokeWidth={1.5} />
            <h2 className="text-lg font-light text-gray-700">Code Snippets</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-light"
            >
              <Plus size={16} strokeWidth={1.5} />
              New Snippet
            </button>
          </div>
        </div>

        {/* Code Snippets Grid */}
        <div className="space-y-8">
          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200/50 rounded-2xl bg-gray-50/30">
              <div className="w-16 h-16 rounded-lg bg-gray-100/50 flex items-center justify-center mb-4 border border-gray-200/50">
                <Code className="text-gray-400" size={24} strokeWidth={1.5} />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-3">No code snippets yet</h4>
              <p className="text-gray-500 text-sm font-light mb-8 max-w-md">Save and organize your reusable code snippets for quick access.</p>
              <button
                onClick={() => setShowNew(true)}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all font-light"
              >
                Create your first snippet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {snippets.map(snippet => (
                <div
                  key={snippet.id}
                  className="group relative bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 
                           hover:border-gray-300 hover:shadow-sm transition-all duration-200 
                           cursor-pointer h-full flex flex-col min-h-[260px]"
                  style={{ 
                    borderLeftColor: getLanguageColor(snippet.language),
                    borderLeftWidth: '4px'
                  }}
                  onClick={() => setExpandedSnippet(snippet)}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-light text-gray-800 text-lg pr-10 line-clamp-2">{snippet.title}</h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleCopy(snippet.code, snippet.id)}
                          className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                          title="Copy"
                        >
                          {copiedId === snippet.id ? <Check size={16} strokeWidth={1.5} /> : <Clipboard size={16} strokeWidth={1.5} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingSnippet(snippet); }}
                          className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                          title="Edit"
                        >
                          <Edit2 size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(snippet.id); }}
                          className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    
                    {snippet.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 font-light">
                        {snippet.description}
                      </p>
                    )}
                    
                    <div className="mb-4">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-light text-gray-600 border border-gray-200/50"
                        style={{ 
                          backgroundColor: getLanguageColor(snippet.language) + '20',
                          borderColor: getLanguageColor(snippet.language) + '40'
                        }}
                      >
                        {snippet.language}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-200/50 overflow-hidden max-h-32">
                      <div className="relative">
                        <div className="absolute top-0 left-0 text-xs font-mono text-gray-400 pr-2 border-r border-gray-300/50">
                          {snippet.code.split('\n').map((_, i) => (
                            <div key={i} className="text-right pr-2 font-light">{i + 1}</div>
                          )).slice(0, 8)}
                        </div>
                        <pre className="text-gray-700 font-mono text-xs pl-10 overflow-x-auto">
                          <SyntaxHighlighter
                            language={snippet.language || 'javascript'}
                            style={vs}
                            customStyle={{
                              margin: 0,
                              padding: 0,
                              backgroundColor: 'transparent',
                              fontSize: '0.75rem',
                              overflow: 'visible'
                            }}
                            PreTag="div"
                          >
                            {snippet.code.length > 150 
                              ? `${snippet.code.substring(0, 150)}...` 
                              : snippet.code}
                          </SyntaxHighlighter>
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50 mt-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLanguageColor(snippet.language) }}></div>
                      <span className="text-xs text-gray-400 font-light">
                        {snippet.code.length} chars
                      </span>
                    </div>
                    {snippet.code.length > 150 && (
                      <button
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-light"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSnippet(snippet);
                        }}
                      >
                        <Maximize2 size={12} strokeWidth={1.5} />
                        View full
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded View Modal */}
      {expandedSnippet && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setExpandedSnippet(null)}></div>
          
          {/* Modal container - positioned absolutely inside fixed parent */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl w-full max-w-4xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: getLanguageColor(expandedSnippet.language) + '20' }}>
                    <Code className="text-gray-600" size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-light text-gray-800">{expandedSnippet.title}</h3>
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-light text-gray-600 border border-gray-200/50 mt-1"
                      style={{ 
                        backgroundColor: getLanguageColor(expandedSnippet.language) + '20',
                        borderColor: getLanguageColor(expandedSnippet.language) + '40'
                      }}
                    >
                      {expandedSnippet.language}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedSnippet(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-4">
                {expandedSnippet.description && (
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
                    <p className="text-gray-700 text-sm font-light">{expandedSnippet.description}</p>
                  </div>
                )}

                <div className="rounded-xl border border-gray-200/50 overflow-hidden bg-gray-50/30">
                  <SyntaxHighlighter
                    language={expandedSnippet.language || 'javascript'}
                    style={vs}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'transparent',
                      borderRadius: '0.75rem'
                    }}
                    showLineNumbers
                  >
                    {expandedSnippet.code}
                  </SyntaxHighlighter>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                  <button
                    onClick={() => handleCopy(expandedSnippet.code, expandedSnippet.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-colors font-light"
                  >
                    {copiedId === expandedSnippet.id ? <Check size={14} strokeWidth={1.5} /> : <Clipboard size={14} strokeWidth={1.5} />}
                    {copiedId === expandedSnippet.id ? 'Copied!' : 'Copy Code'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSnippet(expandedSnippet);
                        setExpandedSnippet(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-colors font-light"
                    >
                      <Edit2 size={14} strokeWidth={1.5} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setExpandedSnippet(null);
                        handleDeleteSnippet(expandedSnippet.id);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50/50 rounded-xl transition-colors font-light"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Snippet Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
            setShowNew(false);
            resetForm();
          }}></div>
          <div className="fixed right-0 top-0 bottom-0 w-[800px] bg-white border-l border-gray-200 shadow-xl">
            <div className="h-full overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light text-gray-800">New Code Snippet</h2>
                  <button
                    onClick={() => {
                      setShowNew(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                  >
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="space-y-6">
                  <input
                    type="text"
                    value={newSnippet.title}
                    onChange={(e) => setNewSnippet({...newSnippet, title: e.target.value})}
                    placeholder="Snippet Title"
                    className="w-full px-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-xl font-light text-gray-800 placeholder-gray-400"
                    autoFocus
                  />
                  
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newSnippet.description}
                      onChange={(e) => setNewSnippet({...newSnippet, description: e.target.value})}
                      placeholder="What does this code do?"
                      rows={2}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 placeholder-gray-400 resize-none font-light"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-3">
                      Language
                    </label>
                    <select
                      value={newSnippet.language}
                      onChange={(e) => setNewSnippet({...newSnippet, language: e.target.value})}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 font-light"
                    >
                      {languageOptions.map(lang => (
                        <option key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-sm font-light text-gray-600">Code</span>
                    </div>
                    <textarea
                      value={newSnippet.code}
                      onChange={(e) => setNewSnippet({...newSnippet, code: e.target.value})}
                      placeholder="Paste your code here..."
                      rows={12}
                      className="w-full px-4 py-4 bg-white text-gray-800 rounded-b-xl focus:outline-none resize-none font-mono text-sm leading-relaxed placeholder-gray-400"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowNew(false);
                        resetForm();
                      }}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-light"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSnippet}
                      disabled={!newSnippet.title.trim() || !newSnippet.code.trim()}
                      className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light"
                    >
                      Create Snippet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Snippet Modal */}
      {editingSnippet && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingSnippet(null)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-[800px] bg-white border-l border-gray-200 shadow-xl">
            <div className="h-full overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light text-gray-800">Edit Code Snippet</h2>
                  <button
                    onClick={() => setEditingSnippet(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                  >
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="space-y-6">
                  <input
                    type="text"
                    value={editingSnippet.title}
                    onChange={(e) => setEditingSnippet({...editingSnippet, title: e.target.value})}
                    className="w-full px-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-xl font-light text-gray-800"
                    autoFocus
                  />
                  
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={editingSnippet.description || ''}
                      onChange={(e) => setEditingSnippet({...editingSnippet, description: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 resize-none font-light"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-light text-gray-600 mb-3">
                      Language
                    </label>
                    <select
                      value={editingSnippet.language || 'javascript'}
                      onChange={(e) => setEditingSnippet({...editingSnippet, language: e.target.value})}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 font-light"
                    >
                      {languageOptions.map(lang => (
                        <option key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-sm font-light text-gray-600">Code</span>
                    </div>
                    <textarea
                      value={editingSnippet.code}
                      onChange={(e) => setEditingSnippet({...editingSnippet, code: e.target.value})}
                      rows={12}
                      className="w-full px-4 py-4 bg-white text-gray-800 rounded-b-xl focus:outline-none resize-none font-mono text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
                    <button
                      onClick={() => setEditingSnippet(null)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-light"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateSnippet}
                      disabled={!editingSnippet.title.trim() || !editingSnippet.code.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light"
                    >
                      <Save size={18} strokeWidth={1.5} />
                      Save Changes
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