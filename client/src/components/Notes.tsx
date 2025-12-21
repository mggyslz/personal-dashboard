import { useState, useEffect } from 'react';
import { api } from '../services/api'; // Fixed import - using named export
import { Plus, Pin, PinOff, Edit2, Trash2, Tag, X, Save } from 'lucide-react';

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
  // Default categories list is used if API fails or returns empty
  const defaultCategories = ['general', 'work', 'personal', 'ideas', 'shopping']; 
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  
  // Form state
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general',
    color: '#6B7280' // Changed from blue to gray
  });

  useEffect(() => {
    loadNotes();
    loadCategories();
  }, []);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      // Ensure the 'api' object has a 'getNotes' method
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
      // Ensure the 'api' object has a 'getCategories' method
      const data = await api.getCategories(); 
      if (data && Array.isArray(data) && data.length > 0) {
        // Use a Set to ensure unique categories from the API, then prepend 'general' if it's missing
        const uniqueCategories = new Set(data.map((c: string) => c.toLowerCase()));
        if (!uniqueCategories.has('general')) {
            uniqueCategories.add('general');
        }
        setCategories(Array.from(uniqueCategories));
      } else {
        // Fallback to default categories if API call fails or returns empty array
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to default categories on error
      setCategories(defaultCategories);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) return;

    try {
      const createdNote = await api.createNote(newNote);
      // Prepend new note to the list, keeping pinned notes at the top after a full load/sort is triggered
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
        category: editingNote.category,
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
      // Re-sort notes to ensure the pinned/unpinned note moves to the correct section immediately
      loadNotes(); 
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const resetForm = () => {
    setNewNote({
      title: '',
      content: '',
      category: 'general',
      color: '#6B7280' // Changed from blue to gray
    });
  };

  const colorOptions = [
    '#6B7280', // Gray (now first/default)
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
  ];

  // Sorting is done by filtering, which is fine
  const pinnedNotes = notes.filter(note => note.pinned);
  const regularNotes = notes.filter(note => !note.pinned);

  // The rest of your component (JSX and styling) remains the same as it is correct
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
            <Tag className="text-gray-600" size={20} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Quick Notes</h3>
        </div>
        <button
          onClick={() => setShowNewNote(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
        >
          <Plus size={18} />
          <span className="text-sm">New Note</span>
        </button>
      </div>

      {/* New Note Form Modal */}
      {showNewNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
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
                rows={5}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none text-gray-900 placeholder-gray-400"
              />

              <div className="flex items-center justify-between">
                <select
                  value={newNote.category}
                  onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                  className="px-3 py-2.5 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 text-gray-900"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>

                <div className="flex gap-1.5">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewNote({...newNote, color})}
                      className={`w-7 h-7 rounded-full border-2 ${newNote.color === color ? 'border-gray-800' : 'border-transparent'} hover:border-gray-300 transition-all`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
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

      {/* Edit Note Form Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
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
                rows={5}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none text-gray-900"
              />

              <div className="flex items-center justify-between">
                <select
                  value={editingNote.category}
                  onChange={(e) => setEditingNote({...editingNote, category: e.target.value})}
                  className="px-3 py-2.5 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-gray-400 text-gray-900"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>

                <div className="flex gap-1.5">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditingNote({...editingNote, color})}
                      className={`w-7 h-7 rounded-full border-2 ${editingNote.color === color ? 'border-gray-800' : 'border-transparent'} hover:border-gray-300 transition-all`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

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

      {/* Notes Grid */}
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        {/* Pinned Notes */}
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
                  className="group relative bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                  style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
                >
                  <div className="ml-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 pr-8">{note.title}</h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleTogglePin(note.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                          title="Unpin"
                        >
                          <PinOff size={14} />
                        </button>
                        <button
                          onClick={() => setEditingNote(note)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {note.content && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 font-light">
                        {note.content.length > 200 ? `${note.content.substring(0, 200)}...` : note.content}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
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

        {/* Regular Notes */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-4">All Notes</h4>
          <div className="grid grid-cols-1 gap-3">
            {regularNotes.map(note => (
              <div
                key={note.id}
                className="group relative bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
              >
                <div className="ml-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 pr-8">{note.title}</h4>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                        title="Pin"
                      >
                        <Pin size={14} />
                      </button>
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {note.content && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 font-light">
                      {note.content.length > 200 ? `${note.content.substring(0, 200)}...` : note.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
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

        {/* Empty State */}
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