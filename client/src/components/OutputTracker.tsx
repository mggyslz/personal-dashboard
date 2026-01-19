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
    color: 'black'
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
      setNewType({ name: '', unit: '', target: 1, color: 'black' });
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
      'black': 'bg-white text-black border-2 border-black',
      'blue': 'bg-blue-100 text-blue-900 border-2 border-blue-600',
      'green': 'bg-green-100 text-green-900 border-2 border-green-600',
      'purple': 'bg-purple-100 text-purple-900 border-2 border-purple-600',
      'orange': 'bg-orange-100 text-orange-900 border-2 border-orange-600',
      'red': 'bg-red-100 text-red-900 border-2 border-red-600',
      'yellow': 'bg-yellow-100 text-yellow-900 border-2 border-yellow-600',
      'pink': 'bg-pink-100 text-pink-900 border-2 border-pink-600',
      'indigo': 'bg-indigo-100 text-indigo-900 border-2 border-indigo-600',
    };
    return colorMap[color] || 'bg-white text-black border-2 border-black';
  };

  const getProgressColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'black': 'bg-black',
      'blue': 'bg-blue-600',
      'green': 'bg-green-600',
      'purple': 'bg-purple-600',
      'orange': 'bg-orange-600',
      'red': 'bg-red-600',
      'yellow': 'bg-yellow-600',
      'pink': 'bg-pink-600',
      'indigo': 'bg-indigo-600',
    };
    return colorMap[color] || 'bg-black';
  };

  const todayEntries = entries.filter(e => e.date === currentDate);
  const todayTotalOutput = todayEntries.reduce((sum, entry) => sum + entry.count, 0);

  const colorOptions = [
    { value: 'black', label: 'Black', className: 'bg-black' },
    { value: 'blue', label: 'Blue', className: 'bg-blue-600' },
    { value: 'green', label: 'Green', className: 'bg-green-600' },
    { value: 'purple', label: 'Purple', className: 'bg-purple-600' },
    { value: 'orange', label: 'Orange', className: 'bg-orange-600' },
    { value: 'red', label: 'Red', className: 'bg-red-600' },
    { value: 'yellow', label: 'Yellow', className: 'bg-yellow-600' },
    { value: 'pink', label: 'Pink', className: 'bg-pink-600' },
    { value: 'indigo', label: 'Indigo', className: 'bg-indigo-600' },
  ];

  if (isLoading) {
    return (
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
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
      {/* Main Component with Neobrutalism Style */}
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-black">
              <BarChart3 className="text-black" size={20} strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black text-black">OUTPUT TRACKER</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTypeManager(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
            >
              <Settings size={16} strokeWidth={2} />
              MANAGE TYPES
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="border-2 border-black bg-white p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border-2 border-black">
                  <div className="text-2xl font-black text-black mb-1">{todayTotalOutput}</div>
                  <div className="text-sm text-black font-black">TODAY'S OUTPUT</div>
                </div>
                <div className="text-center p-4 border-2 border-black">
                  <div className="text-2xl font-black text-black mb-1">{streak}</div>
                  <div className="text-sm text-black font-black">DAY STREAK</div>
                </div>
                <div className="text-center p-4 border-2 border-black">
                  <div className="text-2xl font-black text-black mb-1">{todayEntries.length}</div>
                  <div className="text-sm text-black font-black">ENTRIES TODAY</div>
                </div>
              </div>
            </div>

            {/* Output Input Card */}
            <div className="border-2 border-black bg-white p-6">
              <h3 className="text-lg font-black text-black mb-4">ADD OUTPUT</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-black mb-3">
                    OUTPUT TYPE
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {outputTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.name)}
                        className={`p-4 text-left transition-all font-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                          selectedType === type.name
                            ? 'border-2 border-black bg-black text-white'
                            : getColorClasses(type.color)
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Hash size={16} strokeWidth={2} />
                          <span className="text-sm">{type.name}</span>
                        </div>
                        <div className="text-xs text-black">TARGET: {type.target} {type.unit}/DAY</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      QUANTITY
                    </label>
                    <div className="flex items-center">
                      <button
                        onClick={() => setCount(Math.max(1, count - 1))}
                        className="px-4 py-3 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all font-black"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={count}
                        onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-4 py-3 border-y-2 border-black text-center focus:outline-none font-black"
                      />
                      <button
                        onClick={() => setCount(count + 1)}
                        className="px-4 py-3 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-black mb-2">
                      UNIT
                    </label>
                    <div className="px-4 py-3 border-2 border-black bg-white">
                      <span className="text-black font-black">
                        {outputTypes.find(t => t.name === selectedType)?.unit || 'units'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    NOTES (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brief description of what you produced..."
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 text-black placeholder-gray-500 font-black"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={addOutputEntry}
                    disabled={!selectedType || count < 1}
                    className={`px-8 py-3 border-2 font-black transition-all text-lg flex items-center gap-2 ${
                      selectedType && count > 0
                        ? 'border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-none'
                    }`}
                  >
                    <Plus size={20} strokeWidth={2} />
                    ADD OUTPUT ENTRY
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="border-2 border-black bg-white p-6">
              <h3 className="text-lg font-black text-black mb-6">DAILY PROGRESS</h3>
              
              <div className="space-y-6">
                {outputTypes.map((type) => {
                  const stats = getTypeStats(type.name);
                  return (
                    <div key={type.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 ${getProgressColor(type.color)}`} />
                          <span className="text-sm font-black text-black">{type.name}</span>
                        </div>
                        <span className="text-sm text-black font-black">
                          {stats.todayTotal} / {stats.target} {type.unit}
                        </span>
                      </div>
                      <div className="h-4 bg-white border-2 border-black overflow-hidden">
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
        </div>
      </div>

      {/* Type Manager Modal - Neobrutalism Style */}
      {showTypeManager && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowTypeManager(false);
            setEditingType(null);
            setNewType({ name: '', unit: '', target: 1, color: 'black' });
          }}></div>
          
          {/* Modal container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-black flex items-center justify-center">
                    <Settings className="text-black" size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black">MANAGE OUTPUT TYPES</h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTypeManager(false);
                    setEditingType(null);
                    setNewType({ name: '', unit: '', target: 1, color: 'black' });
                  }}
                  className="p-1.5 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Current Types */}
                <div>
                  <h4 className="text-sm font-black text-black uppercase tracking-wider mb-4">
                    CURRENT TYPES ({outputTypes.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outputTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`p-4 border-2 ${getColorClasses(type.color)}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-lg font-black">{type.name}</div>
                            <div className="text-sm text-black mt-1 font-black">
                              TARGET: {type.target} {type.unit}/DAY
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingType({ ...type })}
                              className="p-1 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all"
                              title="Edit type"
                            >
                              <Edit2 size={16} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => deleteOutputType(type.id, type.name)}
                              className="p-1 border-2 border-red-600 bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all"
                              title="Delete type"
                            >
                              <Trash2 size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add/Edit Form */}
                <div className="border-2 border-black bg-white p-6">
                  <h3 className="text-lg font-black text-black mb-6">
                    {editingType ? 'EDIT OUTPUT TYPE' : 'ADD NEW OUTPUT TYPE'}
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-black text-black mb-2">
                          TYPE NAME *
                        </label>
                        <input
                          type="text"
                          value={editingType ? editingType.name : newType.name}
                          onChange={(e) => 
                            editingType 
                              ? setEditingType({ ...editingType, name: e.target.value })
                              : setNewType({ ...newType, name: e.target.value })
                          }
                          placeholder="e.g., CODE COMMITS"
                          className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 text-black placeholder-gray-500 font-black"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-black text-black mb-2">
                          UNIT *
                        </label>
                        <input
                          type="text"
                          value={editingType ? editingType.unit : newType.unit}
                          onChange={(e) => 
                            editingType 
                              ? setEditingType({ ...editingType, unit: e.target.value })
                              : setNewType({ ...newType, unit: e.target.value })
                          }
                          placeholder="e.g., COMMITS"
                          className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 text-black placeholder-gray-500 font-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-black text-black mb-2">
                          DAILY TARGET *
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
                            className="px-4 py-3 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all font-black"
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
                            className="flex-1 px-4 py-3 border-y-2 border-black text-center focus:outline-none font-black"
                          />
                          <button
                            onClick={() => {
                              if (editingType) {
                                setEditingType({ ...editingType, target: editingType.target + 1 });
                              } else {
                                setNewType({ ...newType, target: newType.target + 1 });
                              }
                            }}
                            className="px-4 py-3 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all font-black"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-black text-black mb-2">
                          COLOR
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
                              className={`p-2 border-2 ${color.className} ${
                                (editingType ? editingType.color : newType.color) === color.value
                                  ? 'border-black ring-2 ring-black'
                                  : 'border-black'
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
                          className="px-6 py-3 border-2 border-black bg-white text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
                        >
                          CANCEL
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
                        className={`px-6 py-3 border-2 font-black transition-all ${
                          editingType
                            ? (editingType.name.trim() && editingType.unit.trim()
                                ? 'border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                : 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-none')
                            : (newType.name.trim() && newType.unit.trim()
                                ? 'border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                : 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-none')
                        }`}
                      >
                        {editingType ? 'UPDATE TYPE' : 'ADD TYPE'}
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