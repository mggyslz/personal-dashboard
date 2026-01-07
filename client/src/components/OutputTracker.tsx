import { useState, useEffect } from 'react';
import { BarChart3, Plus, Target, TrendingUp, Calendar, Hash, FileText, Edit2, Trash2, Settings, Check, X } from 'lucide-react';
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
    }
  };

  const loadEntries = async () => {
    try {
      const entriesData = await api.getOutputEntries(50);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading entries:', error);
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
      blue: 'bg-blue-100/50 text-blue-700 border-blue-200/50',
      green: 'bg-green-100/50 text-green-700 border-green-200/50',
      purple: 'bg-purple-100/50 text-purple-700 border-purple-200/50',
      orange: 'bg-orange-100/50 text-orange-700 border-orange-200/50',
      red: 'bg-red-100/50 text-red-700 border-red-200/50',
      yellow: 'bg-yellow-100/50 text-yellow-700 border-yellow-200/50',
      pink: 'bg-pink-100/50 text-pink-700 border-pink-200/50',
      indigo: 'bg-indigo-100/50 text-indigo-700 border-indigo-200/50',
    };
    return colorMap[color] || 'bg-gray-100/50 text-gray-700 border-gray-200/50';
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
            <BarChart3 className="text-gray-400" size={20} strokeWidth={1.5} />
            <h2 className="text-lg font-light text-gray-700">Output Tracker</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTypeManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-light"
            >
              <Settings size={16} strokeWidth={1.5} />
              Manage Types
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-gray-50/30 to-gray-100/20 rounded-2xl border border-gray-200/50 p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-xl border border-gray-200/50">
                  <div className="text-2xl font-light text-gray-800 mb-1">{todayTotalOutput}</div>
                  <div className="text-sm text-gray-600 font-light">Today's Output</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl border border-gray-200/50">
                  <div className="text-2xl font-light text-gray-800 mb-1">{streak}</div>
                  <div className="text-sm text-gray-600 font-light">Day Streak</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl border border-gray-200/50">
                  <div className="text-2xl font-light text-gray-800 mb-1">{todayEntries.length}</div>
                  <div className="text-sm text-gray-600 font-light">Entries Today</div>
                </div>
              </div>
            </div>

            {/* Output Input Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-4">Add Output</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 font-light">
                    Output Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {outputTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.name)}
                        className={`p-4 rounded-xl border transition-all text-left font-light ${getColorClasses(type.color)} ${
                          selectedType === type.name
                            ? 'ring-2 ring-gray-800/20'
                            : 'hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Hash size={16} strokeWidth={1.5} />
                          <span className="font-medium text-sm">{type.name}</span>
                        </div>
                        <div className="text-xs text-gray-600">Target: {type.target} {type.unit}/day</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-light">
                      Quantity
                    </label>
                    <div className="flex items-center">
                      <button
                        onClick={() => setCount(Math.max(1, count - 1))}
                        className="px-4 py-3 bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 rounded-l-xl font-light"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={count}
                        onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-4 py-3 border-y border-gray-200/50 text-center focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white/50 font-light"
                      />
                      <button
                        onClick={() => setCount(count + 1)}
                        className="px-4 py-3 bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 rounded-r-xl font-light"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-light">
                      Unit
                    </label>
                    <div className="px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl">
                      <span className="text-gray-700 font-light">
                        {outputTypes.find(t => t.name === selectedType)?.unit || 'units'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-light">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brief description of what you produced..."
                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-800 placeholder-gray-400 font-light bg-white/50"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={addOutputEntry}
                    disabled={!selectedType || count < 1}
                    className={`px-8 py-3 rounded-xl font-light transition-all text-lg flex items-center gap-2 ${
                      selectedType && count > 0
                        ? 'bg-gray-800 hover:bg-gray-900 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus size={20} strokeWidth={1.5} />
                    Add Output Entry
                  </button>
                </div>
              </div>
            </div>

            {/* Methodology Card */}
            <div className="p-6 bg-gradient-to-r from-blue-50/20 to-blue-100/10 rounded-2xl border border-blue-200/30">
              <div className="flex items-start gap-4">
                <BarChart3 size={20} strokeWidth={1.5} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-light text-blue-800 mb-1">Output-Based Tracking</h4>
                  <p className="text-sm font-light text-blue-700/90">
                    This method focuses on tangible results rather than time spent. 
                    By tracking outputs, you prioritize meaningful progress over visible activity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Progress Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-6">Daily Progress</h3>
              
              <div className="space-y-6">
                {outputTypes.map((type) => {
                  const stats = getTypeStats(type.name);
                  return (
                    <div key={type.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getProgressColor(type.color)}`} />
                          <span className="text-sm font-medium text-gray-700 font-light">{type.name}</span>
                        </div>
                        <span className="text-sm text-gray-600 font-light">
                          {stats.todayTotal} / {stats.target} {type.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden">
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

            {/* Recent Output Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-6">Recent Output</h3>
              
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200/50 rounded-2xl bg-gray-50/30">
                  <div className="w-12 h-12 rounded-lg bg-gray-100/50 flex items-center justify-center mb-3 border border-gray-200/50">
                    <FileText className="text-gray-400" size={20} strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-500 text-sm font-light">No output entries yet</p>
                  <p className="text-sm text-gray-400 mt-1 font-light">Start tracking your productivity</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {entries.map((entry) => {
                    const type = outputTypes.find(t => t.name === entry.type);
                    const isToday = entry.date === currentDate;
                    
                    return (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-xl border ${
                          isToday
                            ? 'border-blue-200/50 bg-blue-50/30'
                            : 'border-gray-200/50 bg-gray-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getProgressColor(type?.color || 'gray')}`} />
                            <span className={`text-sm ${isToday ? 'text-blue-700' : 'text-gray-600'} font-light`}>
                              {entry.date === currentDate ? 'Today' : entry.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-lg ${getColorClasses(type?.color || 'gray')} font-light`}>
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
                          <span className="text-gray-800 font-light">{entry.type}</span>
                        </div>
                        
                        {entry.notes && (
                          <p className="text-sm text-gray-600 leading-relaxed font-light">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Streak Progress Card */}
            <div className="p-6 bg-gradient-to-r from-gray-50/20 to-gray-100/10 rounded-2xl border border-gray-200/50">
              <div className="flex items-start gap-4">
                <TrendingUp size={20} strokeWidth={1.5} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-light text-gray-800 mb-1">Streak Tracking</h4>
                  <p className="text-sm font-light text-gray-600 leading-relaxed">
                    You've maintained your output target for {streak} consecutive days. 
                    Consistency in tracking leads to meaningful progress over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Type Manager Modal */}
      {showTypeManager && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
            setShowTypeManager(false);
            setEditingType(null);
            setNewType({ name: '', unit: '', target: 1, color: 'blue' });
          }}></div>
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100/50 flex items-center justify-center border border-gray-200/50">
                    <Settings className="text-gray-600" size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-light text-gray-800">Manage Output Types</h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTypeManager(false);
                    setEditingType(null);
                    setNewType({ name: '', unit: '', target: 1, color: 'blue' });
                  }}
                  className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Current Types */}
                <div>
                  <h4 className="text-sm font-light text-gray-600 uppercase tracking-wider mb-4">
                    Current Types ({outputTypes.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outputTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`p-4 rounded-xl border ${getColorClasses(type.color)}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-lg font-light">{type.name}</div>
                            <div className="text-sm text-gray-600 mt-1 font-light">
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
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add/Edit Form */}
                <div className="bg-gray-50/50 rounded-2xl border border-gray-200/50 p-6">
                  <h3 className="text-lg font-light text-gray-700 mb-6">
                    {editingType ? 'Edit Output Type' : 'Add New Output Type'}
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-light">
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
                          className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-800 placeholder-gray-400 font-light bg-white/50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-light">
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
                          className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-800 placeholder-gray-400 font-light bg-white/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-light">
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
                            className="px-4 py-3 bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 rounded-l-xl font-light"
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
                            className="flex-1 px-4 py-3 border-y border-gray-200/50 text-center focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white/50 font-light"
                          />
                          <button
                            onClick={() => {
                              if (editingType) {
                                setEditingType({ ...editingType, target: editingType.target + 1 });
                              } else {
                                setNewType({ ...newType, target: newType.target + 1 });
                              }
                            }}
                            className="px-4 py-3 bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 rounded-r-xl font-light"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-light">
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
                              className={`p-2 rounded-lg border ${color.className} ${
                                (editingType ? editingType.color : newType.color) === color.value
                                  ? 'ring-2 ring-gray-800'
                                  : 'border-gray-200/50'
                              }`}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      {editingType && (
                        <button
                          onClick={() => setEditingType(null)}
                          className="px-6 py-3 bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 rounded-xl font-light transition-colors border border-gray-200/50"
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
                                ? 'bg-gray-800 hover:bg-gray-900 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                            : (newType.name.trim() && newType.unit.trim()
                                ? 'bg-gray-800 hover:bg-gray-900 text-white'
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
        </div>
      )}
    </>
  );
}