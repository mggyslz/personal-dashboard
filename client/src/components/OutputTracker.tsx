import { useState, useEffect } from 'react';
import { BarChart3, Plus, Target, TrendingUp, Calendar, Hash, FileText, Edit2, Trash2, Settings } from 'lucide-react';
import { api } from '../services/api';

interface OutputEntry {
  id: string;
  date: string;
  type: string;
  count: number;
  notes?: string;
  unit?: string;
  color?: string;
  target?: number;
}

interface OutputType {
  id: string;
  name: string;
  unit: string;
  target: number;
  color: string;
}

export default function OutputTracker() {
  const [outputTypes, setOutputTypes] = useState<OutputType[]>([]);
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [count, setCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [editingType, setEditingType] = useState<OutputType | null>(null);
  const [newType, setNewType] = useState({
    name: '',
    unit: '',
    target: 1,
    color: 'blue'
  });

  const currentDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadOutputTypes(),
        loadEntries(),
        loadStreak()
      ]);
    } catch (error) {
      console.error('Error loading output tracker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOutputTypes = async () => {
    try {
      const types = await api.getOutputTypes();
      setOutputTypes(types);
      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0].name);
      }
    } catch (error) {
      console.error('Error loading output types:', error);
      // Handle error appropriately - maybe show a toast notification
    }
  };

  const loadEntries = async () => {
    try {
      const entriesData = await api.getOutputEntries(50);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading entries:', error);
      // Handle error appropriately
    }
  };

  const loadStreak = async () => {
    try {
      const stats = await api.getOutputStats(currentDate);
      setStreak(stats.streak || 0);
    } catch (error) {
      console.error('Error loading streak:', error);
      setStreak(0);
    }
  };

  const addOutputEntry = async () => {
    if (count > 0 && selectedType) {
      try {
        const newEntry = await api.createOutputEntry({
          date: currentDate,
          type: selectedType,
          count,
          notes: notes.trim() || undefined,
        });
        
        setEntries(prev => [newEntry, ...prev]);
        setCount(1);
        setNotes('');
        
        // Reload streak after adding entry
        const stats = await api.getOutputStats(currentDate);
        setStreak(stats.streak || 0);
      } catch (error: any) {
        console.error('Error adding output entry:', error);
        alert(error.message || 'Failed to add output entry. Please try again.');
      }
    }
  };

  const deleteOutputEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await api.deleteOutputEntry(id);
        setEntries(prev => prev.filter(entry => entry.id !== id));
        
        // Reload streak after deleting entry
        const stats = await api.getOutputStats(currentDate);
        setStreak(stats.streak || 0);
      } catch (error: any) {
        console.error('Error deleting entry:', error);
        alert(error.message || 'Failed to delete entry. Please try again.');
      }
    }
  };

  const addOutputType = async () => {
    if (!newType.name.trim() || !newType.unit.trim() || newType.target < 1) {
      alert('Please fill in all required fields with valid values.');
      return;
    }

    try {
      const type = await api.createOutputType(newType);
      setOutputTypes(prev => [...prev, type]);
      setNewType({ name: '', unit: '', target: 1, color: 'blue' });
      setSelectedType(type.name);
    } catch (error: any) {
      console.error('Error adding output type:', error);
      alert(error.message || 'Failed to add output type. Please try again.');
    }
  };

  const updateOutputType = async (id: string) => {
    if (!editingType) return;

    try {
      const updatedType = await api.updateOutputType(id, {
        name: editingType.name,
        unit: editingType.unit,
        target: editingType.target,
        color: editingType.color
      });
      
      setOutputTypes(prev => prev.map(t => t.id === id ? updatedType : t));
      setEditingType(null);
    } catch (error: any) {
      console.error('Error updating output type:', error);
      alert(error.message || 'Failed to update output type. Please try again.');
    }
  };

  const deleteOutputType = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all associated entries.`)) {
      try {
        await api.deleteOutputType(id);
        setOutputTypes(prev => prev.filter(t => t.id !== id));
        setEntries(prev => prev.filter(e => e.type !== name));
        
        if (selectedType === name && outputTypes.length > 0) {
          setSelectedType(outputTypes[0].name);
        }
      } catch (error: any) {
        console.error('Error deleting output type:', error);
        alert(error.message || 'Failed to delete output type. Please try again.');
      }
    }
  };

  const getTypeStats = (typeName: string) => {
    const todayEntries = entries.filter(e => e.date === currentDate && e.type === typeName);
    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.count, 0);
    
    const type = outputTypes.find(t => t.name === typeName);
    const target = type?.target || 0;
    
    return { todayTotal, target, percentage: target > 0 ? Math.min((todayTotal / target) * 100, 100) : 0 };
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getProgressColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      purple: 'bg-purple-600',
      orange: 'bg-orange-600',
      red: 'bg-red-600',
      yellow: 'bg-yellow-600',
      pink: 'bg-pink-600',
      indigo: 'bg-indigo-600',
    };
    return colorMap[color] || 'bg-gray-600';
  };

  const todayEntries = entries.filter(e => e.date === currentDate);
  const todayTotalOutput = todayEntries.reduce((sum, entry) => sum + entry.count, 0);

  const colorOptions = [
    { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
    { value: 'green', label: 'Green', className: 'bg-green-500' },
    { value: 'purple', label: 'Purple', className: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', className: 'bg-orange-500' },
    { value: 'red', label: 'Red', className: 'bg-red-500' },
    { value: 'yellow', label: 'Yellow', className: 'bg-yellow-500' },
    { value: 'pink', label: 'Pink', className: 'bg-pink-500' },
    { value: 'indigo', label: 'Indigo', className: 'bg-indigo-500' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200/50 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200/50 rounded"></div>
            <div className="h-64 bg-gray-200/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center">
                <BarChart3 size={24} strokeWidth={1.5} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-light text-gray-800">
                  Output Tracker
                </h1>
                <p className="text-sm text-gray-500 font-light mt-1">
                  Measure what you produce, not how long you work
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowTypeManager(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-light transition-all"
              >
                <Settings size={18} />
                Manage Types
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8">
          {/* Left Column - Stats & Input */}
          <div className="lg:col-span-2">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target size={20} strokeWidth={1.5} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Today's Output</span>
                </div>
                <div className="text-3xl font-light text-gray-800 mb-1">{todayTotalOutput}</div>
                <div className="text-sm text-gray-600">units produced</div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp size={20} strokeWidth={1.5} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Current Streak</span>
                </div>
                <div className="text-3xl font-light text-gray-800 mb-1">{streak}</div>
                <div className="text-sm text-gray-600">days at target</div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar size={20} strokeWidth={1.5} className="text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Output Today</span>
                </div>
                <div className="text-3xl font-light text-gray-800 mb-1">{todayEntries.length}</div>
                <div className="text-sm text-gray-600">tracking entries</div>
              </div>
            </div>

            {/* Output Input */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-light text-gray-700 mb-6">Add Output</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {outputTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.name)}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          selectedType === type.name
                            ? getColorClasses(type.color)
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Hash size={16} strokeWidth={1.5} />
                          <span className="font-medium text-sm">{type.name}</span>
                        </div>
                        <div className="text-xs text-gray-500">Target: {type.target} {type.unit}/day</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center">
                      <button
                        onClick={() => setCount(Math.max(1, count - 1))}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-l-xl"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={count}
                        onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-4 py-3 border-y border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setCount(count + 1)}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-r-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl">
                      <span className="text-gray-700">
                        {outputTypes.find(t => t.name === selectedType)?.unit || 'units'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brief description of what you produced..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={addOutputEntry}
                    disabled={!selectedType || count < 1}
                    className={`px-8 py-3 rounded-xl font-light transition-colors flex items-center gap-2 ${
                      selectedType && count > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus size={20} strokeWidth={1.5} />
                    Add Output Entry
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-6">Daily Progress</h3>
              
              <div className="space-y-6">
                {outputTypes.map((type) => {
                  const stats = getTypeStats(type.name);
                  return (
                    <div key={type.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getProgressColor(type.color)}`} />
                          <span className="text-sm font-medium text-gray-700">{type.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {stats.todayTotal} / {stats.target} {type.unit}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(type.color)} transition-all duration-1000 ease-out`}
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Recent Entries */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-light text-gray-700 mb-6">Recent Output</h3>
            
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} strokeWidth={1} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No output entries yet</p>
                <p className="text-sm text-gray-400 mt-1">Start tracking your productivity</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {entries.map((entry) => {
                  const type = outputTypes.find(t => t.name === entry.type);
                  const isToday = entry.date === currentDate;
                  
                  return (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-xl border ${
                        isToday
                          ? 'border-blue-200 bg-blue-50/30'
                          : 'border-gray-200 bg-gray-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getProgressColor(type?.color || 'gray')}`} />
                          <span className={`text-sm font-medium ${
                            isToday ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            {entry.date === currentDate ? 'Today' : entry.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-lg ${
                            getColorClasses(type?.color || 'gray')
                          }`}>
                            <span className="text-sm font-medium">{entry.count}</span>
                          </div>
                          <button
                            onClick={() => deleteOutputEntry(entry.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-gray-800 font-medium">{entry.type}</span>
                      </div>
                      
                      {entry.notes && (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Methodology Note */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-4">
                <BarChart3 size={20} strokeWidth={1.5} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-1">Output-Based Tracking</h4>
                  <p className="text-sm font-light text-gray-600">
                    This method focuses on tangible results rather than time spent. 
                    By tracking outputs, you prioritize meaningful progress over visible activity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Output Type Manager Modal */}
      {showTypeManager && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-light text-gray-800 flex items-center gap-3">
                <Settings size={24} strokeWidth={1.5} className="text-blue-600" />
                Manage Output Types
              </h2>
              <button 
                onClick={() => {
                  setShowTypeManager(false);
                  setEditingType(null);
                  setNewType({ name: '', unit: '', target: 1, color: 'blue' });
                }} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Trash2 size={24} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 max-h-[calc(90vh-100px)] overflow-y-auto">
              {/* Current Types */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Current Output Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outputTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 rounded-xl border ${getColorClasses(type.color)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-lg">{type.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Target: {type.target} {type.unit}/day
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingType({ ...type })}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Edit type"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteOutputType(type.id, type.name)}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete type"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-3 h-3 rounded-full ${getProgressColor(type.color)}`} />
                        <span className="text-xs text-gray-600">{type.color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add/Edit Form */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-6">
                  {editingType ? 'Edit Output Type' : 'Add New Output Type'}
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type Name *
                      </label>
                      <input
                        type="text"
                        value={editingType ? editingType.name : newType.name}
                        onChange={(e) => 
                          editingType 
                            ? setEditingType({ ...editingType, name: e.target.value })
                            : setNewType({ ...newType, name: e.target.value })
                        }
                        placeholder="e.g., Code Commits"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={editingType ? editingType.unit : newType.unit}
                        onChange={(e) => 
                          editingType 
                            ? setEditingType({ ...editingType, unit: e.target.value })
                            : setNewType({ ...newType, unit: e.target.value })
                        }
                        placeholder="e.g., commits"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Target *
                      </label>
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            if (editingType && editingType.target > 1) {
                              setEditingType({ ...editingType, target: editingType.target - 1 });
                            } else if (newType.target > 1) {
                              setNewType({ ...newType, target: newType.target - 1 });
                            }
                          }}
                          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-l-xl"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={editingType ? editingType.target : newType.target}
                          onChange={(e) => {
                            const value = Math.max(1, parseInt(e.target.value) || 1);
                            if (editingType) {
                              setEditingType({ ...editingType, target: value });
                            } else {
                              setNewType({ ...newType, target: value });
                            }
                          }}
                          className="flex-1 px-4 py-3 border-y border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => {
                            if (editingType) {
                              setEditingType({ ...editingType, target: editingType.target + 1 });
                            } else {
                              setNewType({ ...newType, target: newType.target + 1 });
                            }
                          }}
                          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-r-xl"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => {
                              if (editingType) {
                                setEditingType({ ...editingType, color: color.value });
                              } else {
                                setNewType({ ...newType, color: color.value });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 ${
                              (editingType ? editingType.color : newType.color) === color.value
                                ? 'border-blue-500'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className={`w-full h-6 rounded ${color.className}`} />
                            <span className="text-xs mt-1 block text-gray-700">{color.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    {editingType && (
                      <button
                        onClick={() => setEditingType(null)}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-light transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => 
                        editingType 
                          ? updateOutputType(editingType.id)
                          : addOutputType()
                      }
                      disabled={
                        editingType
                          ? !editingType.name.trim() || !editingType.unit.trim()
                          : !newType.name.trim() || !newType.unit.trim()
                      }
                      className={`px-6 py-3 rounded-xl font-light transition-colors ${
                        editingType
                          ? (editingType.name.trim() && editingType.unit.trim()
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                          : (newType.name.trim() && newType.unit.trim()
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                      }`}
                    >
                      {editingType ? 'Update Type' : 'Add Type'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}