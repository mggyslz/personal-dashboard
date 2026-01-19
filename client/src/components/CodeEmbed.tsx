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

  if (isLoading) {
    return (
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 h-full bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Component - Neobrutalism Style */}
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-black">
              <Code className="text-black" size={20} strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black text-black">CODE SNIPPETS</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black font-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Plus size={16} strokeWidth={2} />
              NEW SNIPPET
            </button>
          </div>
        </div>

        {/* Code Snippets Grid */}
        <div className="space-y-8">
          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-black bg-gray-50">
              <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center mb-4 border-2 border-black">
                <Code className="text-black" size={24} strokeWidth={2} />
              </div>
              <h4 className="text-lg font-black text-black mb-3">NO CODE SNIPPETS YET</h4>
              <p className="text-black text-sm font-bold mb-8 max-w-md">SAVE AND ORGANIZE YOUR REUSABLE CODE SNIPPETS FOR QUICK ACCESS.</p>
              <button
                onClick={() => setShowNew(true)}
                className="px-6 py-3 bg-black text-white border-2 border-black font-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                CREATE YOUR FIRST SNIPPET
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {snippets.map(snippet => (
                <div
                  key={snippet.id}
                  className="group relative bg-white border-2 border-black p-5 
                           hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 
                           cursor-pointer h-full flex flex-col min-h-[280px]"
                  onClick={() => setExpandedSnippet(snippet)}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-black text-black text-lg pr-10 line-clamp-2">{snippet.title}</h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleCopy(snippet.code, snippet.id)}
                          className="p-2 border border-black hover:bg-gray-100 hover:border-black transition-colors text-black"
                          title="Copy"
                        >
                          {copiedId === snippet.id ? <Check size={16} strokeWidth={2} /> : <Clipboard size={16} strokeWidth={2} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingSnippet(snippet); }}
                          className="p-2 border border-black hover:bg-blue-100 hover:border-blue-600 transition-colors text-black"
                          title="Edit"
                        >
                          <Edit2 size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(snippet.id); }}
                          className="p-2 border border-black hover:bg-red-100 hover:border-red-600 transition-colors text-black"
                          title="Delete"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    
                    {snippet.description && (
                      <p className="text-black text-sm mb-3 line-clamp-2 font-bold">
                        {snippet.description}
                      </p>
                    )}
                    
                    <div className="mb-4">
                      <span 
                        className="inline-flex items-center px-3 py-1 border-2 border-black text-xs font-black bg-white text-black"
                      >
                        {snippet.language.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 border-2 border-black p-3 overflow-hidden max-h-32">
                      <div className="relative">
                        <div className="absolute top-0 left-0 text-xs font-mono text-black pr-2 border-r-2 border-black">
                          {snippet.code.split('\n').map((_, i) => (
                            <div key={i} className="text-right pr-2 font-bold">{i + 1}</div>
                          )).slice(0, 8)}
                        </div>
                        <pre className="text-black font-mono text-xs pl-10 overflow-x-auto">
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
                  
                  <div className="flex items-center justify-between pt-4 border-t-2 border-black mt-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-black"></div>
                      <span className="text-xs text-black font-black">
                        {snippet.code.length} CHARS
                      </span>
                    </div>
                    {snippet.code.length > 150 && (
                      <button
                        className="flex items-center gap-1 text-xs text-black hover:text-gray-600 font-black"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSnippet(snippet);
                        }}
                      >
                        <Maximize2 size={12} strokeWidth={2} />
                        VIEW FULL
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded View Modal - Neobrutalism Style */}
      {expandedSnippet && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExpandedSnippet(null)}></div>
          
          {/* Modal container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded border-2 border-black flex items-center justify-center bg-black">
                      <Code className="text-white" size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-black">{expandedSnippet.title}</h3>
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 mt-1 border-2 border-black text-xs font-black bg-white text-black"
                      >
                        {expandedSnippet.language.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedSnippet(null)}
                    className="p-1.5 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>

                <div className="space-y-4">
                  {expandedSnippet.description && (
                    <div className="bg-gray-50 border-2 border-black p-4">
                      <p className="text-black text-sm font-bold">{expandedSnippet.description}</p>
                    </div>
                  )}

                  <div className="border-2 border-black overflow-hidden bg-gray-50">
                    <SyntaxHighlighter
                      language={expandedSnippet.language || 'javascript'}
                      style={vs}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'transparent',
                      }}
                      showLineNumbers
                    >
                      {expandedSnippet.code}
                    </SyntaxHighlighter>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-black">
                    <button
                      onClick={() => handleCopy(expandedSnippet.code, expandedSnippet.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-black hover:text-gray-800 hover:bg-gray-100 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
                    >
                      {copiedId === expandedSnippet.id ? <Check size={14} strokeWidth={2} /> : <Clipboard size={14} strokeWidth={2} />}
                      {copiedId === expandedSnippet.id ? 'COPIED!' : 'COPY CODE'}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingSnippet(expandedSnippet);
                          setExpandedSnippet(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-black hover:text-gray-800 hover:bg-blue-100 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] transition-all font-black"
                      >
                        <Edit2 size={14} strokeWidth={2} />
                        EDIT
                      </button>
                      <button
                        onClick={() => {
                          setExpandedSnippet(null);
                          handleDeleteSnippet(expandedSnippet.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-900 hover:text-red-800 hover:bg-red-100 border-2 border-red-600 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] transition-all font-black"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Snippet Modal - Neobrutalism Style */}
      {showNew && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowNew(false);
            resetForm();
          }}></div>
          <div className="fixed right-0 top-0 bottom-0 w-[800px] bg-white border-l-2 border-black shadow-[8px_0px_0px_0px_rgba(0,0,0,1)]">
            <div className="h-full overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-black">NEW CODE SNIPPET</h2>
                  <button
                    onClick={() => {
                      setShowNew(false);
                      resetForm();
                    }}
                    className="p-2 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                  >
                    <X size={24} strokeWidth={2} />
                  </button>
                </div>

                <div className="space-y-6">
                  <input
                    type="text"
                    value={newSnippet.title}
                    onChange={(e) => setNewSnippet({...newSnippet, title: e.target.value})}
                    placeholder="SNIPPET TITLE"
                    className="w-full px-4 py-4 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all text-xl font-black text-black placeholder-gray-500"
                    autoFocus
                  />
                  
                  <div>
                    <label className="block text-sm font-black text-black mb-3">
                      DESCRIPTION (OPTIONAL)
                    </label>
                    <textarea
                      value={newSnippet.description}
                      onChange={(e) => setNewSnippet({...newSnippet, description: e.target.value})}
                      placeholder="WHAT DOES THIS CODE DO?"
                      rows={2}
                      className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all text-black placeholder-gray-500 resize-none font-bold"
                    />
                  </div>            
                  <div>
                    <label className="block text-xs font-black text-black mb-2">
                      LANGUAGE
                    </label>
                    <select
                      value={newSnippet.language}
                      onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
                      className="w-full px-4 py-2 bg-white border-2 border-black text-black text-sm font-bold focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-1px] focus:translate-y-[-1px)] transition-all"
                    >
                      {languageOptions.map(lang => (
                        <option key={lang} value={lang} className="text-sm py-1 font-bold">
                          {lang.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="border-2 border-black overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b-2 border-black">
                      <span className="text-sm font-black text-black">CODE</span>
                    </div>
                    <textarea
                      value={newSnippet.code}
                      onChange={(e) => setNewSnippet({...newSnippet, code: e.target.value})}
                      placeholder="PASTE YOUR CODE HERE..."
                      rows={12}
                      className="w-full px-4 py-4 bg-white text-black border-t-0 focus:outline-none resize-none font-mono text-sm leading-relaxed placeholder-gray-500"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t-2 border-black">
                    <button
                      onClick={() => {
                        setShowNew(false);
                        resetForm();
                      }}
                      className="px-6 py-3 text-black hover:bg-gray-100 border-2 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleCreateSnippet}
                      disabled={!newSnippet.title.trim() || !newSnippet.code.trim()}
                      className="px-6 py-3 bg-black text-white border-2 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none font-black"
                    >
                      CREATE SNIPPET
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Snippet Modal - Neobrutalism Style */}
      {editingSnippet && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingSnippet(null)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-[800px] bg-white border-l-2 border-black shadow-[8px_0px_0px_0px_rgba(0,0,0,1)]">
            <div className="h-full overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-black">EDIT CODE SNIPPET</h2>
                  <button
                    onClick={() => setEditingSnippet(null)}
                    className="p-2 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                  >
                    <X size={24} strokeWidth={2} />
                  </button>
                </div>

                <div className="space-y-6">
                  <input
                    type="text"
                    value={editingSnippet.title}
                    onChange={(e) => setEditingSnippet({...editingSnippet, title: e.target.value})}
                    className="w-full px-4 py-4 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all text-xl font-black text-black"
                    autoFocus
                  />
                  
                  <div>
                    <label className="block text-sm font-black text-black mb-3">
                      DESCRIPTION (OPTIONAL)
                    </label>
                    <textarea
                      value={editingSnippet.description || ''}
                      onChange={(e) => setEditingSnippet({...editingSnippet, description: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all text-black resize-none font-bold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-black mb-3">
                      LANGUAGE
                    </label>
                    <select
                      value={editingSnippet.language || 'javascript'}
                      onChange={(e) => setEditingSnippet({...editingSnippet, language: e.target.value})}
                      className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all text-black font-bold"
                    >
                      {languageOptions.map(lang => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-2 border-black overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b-2 border-black">
                      <span className="text-sm font-black text-black">CODE</span>
                    </div>
                    <textarea
                      value={editingSnippet.code}
                      onChange={(e) => setEditingSnippet({...editingSnippet, code: e.target.value})}
                      rows={12}
                      className="w-full px-4 py-4 bg-white text-black border-t-0 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t-2 border-black">
                    <button
                      onClick={() => setEditingSnippet(null)}
                      className="px-6 py-3 text-black hover:bg-gray-100 border-2 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleUpdateSnippet}
                      disabled={!editingSnippet.title.trim() || !editingSnippet.code.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-black text-white border-2 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none font-black"
                    >
                      <Save size={18} strokeWidth={2} />
                      SAVE CHANGES
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