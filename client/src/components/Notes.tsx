import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Pin, PinOff, Edit2, Trash2, Tag, X, Save, FileText, Check } from 'lucide-react';

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
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(() => {
    return localStorage.getItem('aiSummaryEnabled') === 'true';
  });
  const [isSummarizing, setIsSummarizing] = useState(false);
  
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
      
      const allCategories = new Set([
        ...defaultCategories,
        ...(data && Array.isArray(data) ? data : [])
      ]);
      
      const lowercaseCategories = Array.from(allCategories).map(c => c.toLowerCase());
      const uniqueCategories = Array.from(new Set(lowercaseCategories));
      
      setCategories(uniqueCategories);
      
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
        category: newNote.category.toLowerCase(),
        pinned: false
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
        color: editingNote.color,
        pinned: editingNote.pinned
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
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) return;

      const updatedNoteData = {
        ...noteToUpdate,
        pinned: !noteToUpdate.pinned
      };

      const updatedNote = await api.updateNote(id, updatedNoteData);
      
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
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
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm">
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
      {/* Main Notes Component with Glassmorphism */}
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="text-gray-400" size={20} strokeWidth={1.5} />
            <h2 className="text-lg font-light text-gray-700">Notes</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAiSummary}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-light transition-all ${
                aiSummaryEnabled 
                  ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                  : 'bg-gray-50/50 text-gray-600 border border-gray-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${aiSummaryEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              AI Assistant {aiSummaryEnabled ? 'Active' : 'Disabled'}
            </button>
            <button
              onClick={() => setShowNewNote(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-light"
            >
              <Plus size={16} strokeWidth={1.5} />
              New Note
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="space-y-8">
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Pin size={18} className="text-gray-500" strokeWidth={1.5} />
                <h3 className="text-lg font-light text-gray-700">Pinned</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pinnedNotes.map(note => (
                  <div
                    key={note.id}
                    className="group relative bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 
                             hover:border-gray-300 hover:shadow-sm transition-all duration-200 
                             cursor-pointer h-full flex flex-col min-h-[200px]"
                    style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
                    onClick={() => setExpandedNote(note)}
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-light text-gray-800 text-lg pr-10 line-clamp-2">{note.title}</h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleTogglePin(note.id)}
                            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                            title="Unpin"
                          >
                            <PinOff size={16} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingNote(note); }}
                            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                            title="Edit"
                          >
                            <Edit2 size={16} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                            title="Delete"
                          >
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4 font-light">
                        {note.content}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100/50" onClick={e => e.stopPropagation()}>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-light bg-gray-100/50 text-gray-600 border border-gray-200/50">
                        {note.category}
                      </span>
                      <span className="text-xs text-gray-400 font-light">
                        {new Date(note.updated_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Notes Section */}
          <div>
            <h3 className="text-lg font-light text-gray-700 mb-4">All Notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {regularNotes.map(note => (
                <div
                  key={note.id}
                  className="group relative bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 
                           hover:border-gray-300 hover:shadow-sm transition-all duration-200 
                           cursor-pointer h-full flex flex-col min-h-[200px]"
                  style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
                  onClick={() => setExpandedNote(note)}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-light text-gray-800 text-lg pr-10 line-clamp-2">{note.title}</h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleTogglePin(note.id)}
                          className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                          title="Pin"
                        >
                          <Pin size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingNote(note); }}
                          className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                          title="Edit"
                        >
                          <Edit2 size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                          className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                          title="Delete"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4 font-light">
                      {note.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50" onClick={e => e.stopPropagation()}>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-light bg-gray-100/50 text-gray-600 border border-gray-200/50">
                      {note.category}
                    </span>
                    <span className="text-xs text-gray-400 font-light">
                      {new Date(note.updated_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200/50 rounded-2xl bg-gray-50/30">
              <div className="w-16 h-16 rounded-lg bg-gray-100/50 flex items-center justify-center mb-4 border border-gray-200/50">
                <Tag className="text-gray-400" size={24} strokeWidth={1.5} />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-3">No notes yet</h4>
              <p className="text-gray-500 text-sm font-light mb-8 max-w-md">Start capturing your thoughts, ideas, and important information in one place.</p>
              <button
                onClick={() => setShowNewNote(true)}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all font-light"
              >
                Create your first note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODALS - Outside the main component, will overlay the entire page */}

      {/* Expanded Note Modal */}
      {expandedNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: expandedNote.color + '20' }}>
                  <Tag className="text-gray-600" size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{expandedNote.title}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-light bg-gray-100 text-gray-600 border border-gray-200 mt-1">
                    {expandedNote.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExpandedNote(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 whitespace-pre-wrap">
                <div className="text-gray-700 leading-relaxed font-light">
                  {expandedNote.content}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-400 font-light">
                  Last updated: {new Date(expandedNote.updated_at).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingNote(expandedNote);
                      setExpandedNote(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-light"
                  >
                    <Edit2 size={14} strokeWidth={1.5} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setExpandedNote(null);
                      handleDeleteNote(expandedNote.id);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors font-light"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Note Modal */}
      {showNewNote && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
            setShowNewNote(false);
            resetForm();
          }}></div>
          <div className="absolute right-0 top-0 bottom-0 w-[800px] bg-white border-l border-gray-200 shadow-xl">
            <div className="h-full overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light text-gray-800">New Note</h2>
                  <button
                    onClick={() => {
                      setShowNewNote(false);
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
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    placeholder="Title"
                    className="w-full px-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-xl font-light text-gray-800 placeholder-gray-400"
                    autoFocus
                  />
                  
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    placeholder="Start typing here..."
                    rows={12}
                    className="w-full px-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none text-gray-800 placeholder-gray-400 leading-relaxed font-light"
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-light text-gray-600 mb-3">
                        Category
                      </label>
                      <select
                        value={newNote.category}
                        onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 font-light"
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
                      <label className="block text-sm font-light text-gray-600 mb-3">
                        Color
                      </label>
                      <div className="flex gap-3">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleColorSelect(color)}
                            className={`
                              relative w-12 h-12 rounded-xl border-2 transition-all duration-200
                              ${selectedColor === color 
                                ? 'border-gray-800 scale-105 shadow-sm' 
                                : 'border-transparent hover:border-gray-300'
                              }
                            `}
                            style={{ backgroundColor: color }}
                            title={color}
                          >
                            {selectedColor === color && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check size={20} className="text-white opacity-90" strokeWidth={2} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowNewNote(false);
                        resetForm();
                      }}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-light"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateNote}
                      disabled={!newNote.title.trim()}
                      className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light"
                    >
                      Create Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingNote(null)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-[800px] bg-white border-l border-gray-200 shadow-xl">
            <div className="h-full overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light text-gray-800">Edit Note</h2>
                  <button
                    onClick={() => setEditingNote(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                  >
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="space-y-6">
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                    className="w-full px-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-xl font-light text-gray-800"
                    autoFocus
                  />
                  
                  <textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                    rows={12}
                    className="w-full px-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none text-gray-800 leading-relaxed font-light"
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-light text-gray-600 mb-3">
                        Category
                      </label>
                      <select
                        value={editingNote.category}
                        onChange={(e) => setEditingNote({...editingNote, category: e.target.value})}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 font-light"
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
                      <label className="block text-sm font-light text-gray-600 mb-3">
                        Color
                      </label>
                      <div className="flex gap-3">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleEditColorSelect(color)}
                            className={`
                              relative w-12 h-12 rounded-xl border-2 transition-all duration-200
                              ${editingNote.color === color 
                                ? 'border-gray-800 scale-105 shadow-sm' 
                                : 'border-transparent hover:border-gray-300'
                              }
                            `}
                            style={{ backgroundColor: color }}
                            title={color}
                          >
                            {editingNote.color === color && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check size={20} className="text-white opacity-90" strokeWidth={2} />
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
                        className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 font-light"
                      >
                        {isSummarizing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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

                  <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
                    <button
                      onClick={() => setEditingNote(null)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-light"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateNote}
                      disabled={!editingNote.title.trim()}
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