import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Pin, PinOff, Edit2, Trash2, Tag, X, Save, Maximize2 } from 'lucide-react';

interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  color: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewNote, setShowNewNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(() => {
    return localStorage.getItem('aiSummaryEnabled') === 'true';
  });
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  
  const defaultCategories = ['general', 'work', 'personal', 'ideas', 'shopping']; 
  const [categories, setCategories] = useState<string[]>([]);
  
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general',
    color: '#6B7280'
  });

  const [selectedColor, setSelectedColor] = useState('#6B7280');

  useEffect(() => {
    loadNotes();
    loadCategories();
  }, []);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const data = await api.getNotes();
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      
      // Merge default categories with fetched categories
      const allCategories = new Set([
        ...defaultCategories,
        ...(data && Array.isArray(data) ? data : [])
      ]);
      
      // Convert to lowercase and remove duplicates
      const lowercaseCategories = Array.from(allCategories).map(c => c.toLowerCase());
      const uniqueCategories = Array.from(new Set(lowercaseCategories));
      
      setCategories(uniqueCategories);
      
      // If 'general' isn't in the list, add it
      if (!uniqueCategories.includes('general')) {
        setCategories(['general', ...uniqueCategories.filter(c => c !== 'general')]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(defaultCategories);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) return;

    try {
      const createdNote = await api.createNote({
        ...newNote,
        category: newNote.category.toLowerCase()
      });
      setNotes([createdNote, ...notes]);
      resetForm();
      setShowNewNote(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;

    try {
      const updatedNote = await api.updateNote(editingNote.id, {
        title: editingNote.title,
        content: editingNote.content,
        category: editingNote.category.toLowerCase(),
        color: editingNote.color
      });
      
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await api.deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      const updatedNote = await api.togglePinNote(id);
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      loadNotes();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleRephraseNote = async (noteToRephrase: Note) => {
    if (!noteToRephrase.content.trim()) {
      alert('No content to rephrase');
      return;
    }
    
    if (!window.confirm('This will replace the current note content with the AI-rephrased version. Continue?')) {
      return;
    }

    try {
      setIsSummarizing(true);
      
      const rephrasedResult = await api.summarizeNote(noteToRephrase.content, 400);
      const newContent = rephrasedResult.summary.trim();
      
      const updatedNote = await api.updateNote(noteToRephrase.id, {
        ...noteToRephrase,
        content: newContent
      });
      
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      
      if (editingNote && editingNote.id === updatedNote.id) {
        setEditingNote(updatedNote);
      }
      
      alert('Note rephrased successfully!');
      
    } catch (error) {
      console.error('Error rephrasing note:', error);
      alert('Failed to rephrase note. Please check if Ollama is running.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const toggleAiSummary = () => {
    const newValue = !aiSummaryEnabled;
    setAiSummaryEnabled(newValue);
    localStorage.setItem('aiSummaryEnabled', newValue.toString());
  };

  const resetForm = () => {
    setNewNote({
      title: '',
      content: '',
      category: 'general',
      color: '#6B7280'
    });
    setSelectedColor('#6B7280');
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setNewNote({...newNote, color});
  };

  const handleEditColorSelect = (color: string) => {
    if (editingNote) {
      setEditingNote({...editingNote, color});
    }
  };

  const colorOptions = [
    '#6B7280',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
  ];

  const pinnedNotes = notes.filter(note => note.pinned);
  const regularNotes = notes.filter(note => !note.pinned);

  if (isLoading) {
    return (
      <div className="h-full bg-white/95 rounded-xl p-8 border border-gray-200/80">
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
    <div className="h-full bg-white/95 rounded-xl p-8 border border-gray-200/80">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
            <Tag className="text-gray-600" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800">Quick Notes</h3>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={toggleAiSummary}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  aiSummaryEnabled 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                AI Assistant
                <div className={`w-2 h-2 rounded-full ${aiSummaryEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </button>
              <span className="text-xs text-gray-400">
                {aiSummaryEnabled ? 'Ollama Mistral Active' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowNewNote(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
        >
          <Plus size={18} />
          <span className="text-sm">New Note</span>
        </button>
      </div>

      {expandedNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                      style={{ backgroundColor: expandedNote.color + '20' }}>
                  <Tag className="text-gray-600" size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{expandedNote.title}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 mt-1">
                    {expandedNote.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExpandedNote(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 whitespace-pre-wrap">
                <div className="text-gray-700 leading-relaxed text-sm">
                  {expandedNote.content}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Last updated: {new Date(expandedNote.updated_at).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingNote(expandedNote);
                      setExpandedNote(null);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setExpandedNote(null);
                      handleDeleteNote(expandedNote.id);
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

      {showNewNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Increased max-width for bigger popup */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">New Note</h3>
              <button
                onClick={() => {
                  setShowNewNote(false);
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
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                placeholder="Title"
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-gray-900 placeholder-gray-400"
                autoFocus
              />
              
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                placeholder="Write something..."
                rows={6}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none text-gray-900 placeholder-gray-400"
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 text-gray-900"
                  >
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))
                    ) : (
                      <option value="general">General</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`
                          relative w-10 h-10 rounded-full border-2 transition-all duration-300
                          ${selectedColor === color 
                            ? 'border-gray-800 scale-110 shadow-lg' 
                            : 'border-transparent hover:border-gray-300 hover:scale-105'
                          }
                          transform hover:scale-110 active:scale-95
                        `}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {selectedColor === color && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full opacity-90"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowNewNote(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={!newNote.title.trim()}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Create Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Note</h3>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-gray-900"
                autoFocus
              />
              
              <textarea
                value={editingNote.content}
                onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                rows={6}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none text-gray-900"
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={editingNote.category}
                    onChange={(e) => setEditingNote({...editingNote, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 text-gray-900"
                  >
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))
                    ) : (
                      <option value="general">General</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleEditColorSelect(color)}
                        className={`
                          relative w-10 h-10 rounded-full border-2 transition-all duration-300
                          ${editingNote.color === color 
                            ? 'border-gray-800 scale-110 shadow-lg' 
                            : 'border-transparent hover:border-gray-300 hover:scale-105'
                          }
                          transform hover:scale-110 active:scale-95
                        `}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {editingNote.color === color && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full opacity-90"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {aiSummaryEnabled && editingNote.content.trim().length > 100 && (
                <div className="pt-2">
                  <button
                    onClick={() => handleRephraseNote(editingNote)}
                    disabled={isSummarizing}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {isSummarizing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Rephrasing Note...</span>
                      </>
                    ) : (
                      <>
                        <span>Improve Note with AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateNote}
                  disabled={!editingNote.title.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        {pinnedNotes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Pin size={16} className="text-gray-500" />
              <h4 className="text-sm font-medium text-gray-500">Pinned</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {pinnedNotes.map(note => (
                <div
                  key={note.id}
                  className="group relative bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
                  onClick={() => setExpandedNote(note)}
                >
                  <div className="ml-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 pr-8">{note.title}</h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleTogglePin(note.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                          title="Unpin"
                        >
                          <PinOff size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingNote(note); }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {note.content && (
                      <>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 font-light">
                          {note.content.length > 200 ? `${note.content.substring(0, 200)}...` : note.content}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          {note.content.length > 200 && (
                            <button
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedNote(note);
                              }}
                            >
                              <Maximize2 size={12} />
                              View full note
                            </button>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {note.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.updated_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-4">All Notes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full flex flex-col">
            {regularNotes.map(note => (
              <div
                key={note.id}
                className="group relative bg-white rounded-lg p-4 border border-gray-200 
             hover:border-gray-300 hover:shadow-sm transition-all duration-200 
             cursor-pointer h-full flex flex-col"
                style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
                onClick={() => setExpandedNote(note)}
              >
                <div className="ml-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 pr-8">{note.title}</h4>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                        title="Pin"
                      >
                        <Pin size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingNote(note); }}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {note.content && (
                    <>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 font-light">
                        {note.content.length > 200 ? `${note.content.substring(0, 200)}...` : note.content}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        {note.content.length > 200 && (
                          <button
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedNote(note);
                            }}
                          >
                            <Maximize2 size={12} />
                            View full note
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {note.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(note.updated_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4 border border-gray-200">
              <Tag className="text-gray-400" size={24} />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No notes yet</h4>
            <p className="text-gray-500 text-sm mb-6">Create your first note to get started</p>
            <button
              onClick={() => setShowNewNote(true)}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
            >
              Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}