import { useState, useEffect } from 'react';
import { BarChart3, Plus, Target, TrendingUp, Calendar, Hash, FileText } from 'lucide-react';

interface OutputEntry {
  id: string;
  date: string;
  type: string;
  count: number;
  notes?: string;
}

interface OutputType {
  id: string;
  name: string;
  unit: string;
  target: number;
  color: string;
}

export default function OutputTracker() {
  const [outputTypes, setOutputTypes] = useState<OutputType[]>([
    { id: '1', name: 'Code Commits', unit: 'commits', target: 3, color: 'blue' },
    { id: '2', name: 'Pages Written', unit: 'pages', target: 5, color: 'green' },
    { id: '3', name: 'Problems Solved', unit: 'problems', target: 10, color: 'purple' },
    { id: '4', name: 'Design Comps', unit: 'comps', target: 2, color: 'orange' },
  ]);

  const [entries, setEntries] = useState<OutputEntry[]>([
    { id: '1', date: '2024-01-18', type: 'Code Commits', count: 4, notes: 'Implemented authentication' },
    { id: '2', date: '2024-01-18', type: 'Pages Written', count: 3, notes: 'Chapter 3 draft' },
    { id: '3', date: '2024-01-17', type: 'Code Commits', count: 5, notes: 'API integration' },
    { id: '4', date: '2024-01-17', type: 'Problems Solved', count: 12, notes: 'Algorithm practice' },
  ]);

  const [selectedType, setSelectedType] = useState<string>('Code Commits');
  const [count, setCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [streak, setStreak] = useState<number>(0);

  const currentDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Calculate streak based on daily target achievement
    const dates = [...new Set(entries.map(e => e.date))].sort((a, b) => b.localeCompare(a));
    let currentStreak = 0;
    
    for (const date of dates) {
      const dailyEntries = entries.filter(e => e.date === date);
      const dailyTargets = outputTypes.map(type => {
        const typeEntries = dailyEntries.filter(e => e.type === type.name);
        const total = typeEntries.reduce((sum, entry) => sum + entry.count, 0);
        return { type: type.name, total, target: type.target };
      });
      
      const allTargetsMet = dailyTargets.every(t => t.total >= t.target);
      if (allTargetsMet) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  }, [entries, outputTypes]);

  const addOutputEntry = () => {
    if (count > 0) {
      const newEntry: OutputEntry = {
        id: Date.now().toString(),
        date: currentDate,
        type: selectedType,
        count,
        notes: notes.trim() || undefined,
      };
      
      setEntries(prev => [newEntry, ...prev]);
      setCount(1);
      setNotes('');
    }
  };

  const getTypeStats = (typeName: string) => {
    const todayEntries = entries.filter(e => e.date === currentDate && e.type === typeName);
    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.count, 0);
    
    const type = outputTypes.find(t => t.name === typeName);
    const target = type?.target || 0;
    
    return { todayTotal, target, percentage: Math.min((todayTotal / target) * 100, 100) };
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getProgressColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      purple: 'bg-purple-600',
      orange: 'bg-orange-600',
    };
    return colorMap[color] || 'bg-gray-600';
  };

  const todayEntries = entries.filter(e => e.date === currentDate);
  const todayTotalOutput = todayEntries.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
        <div className="p-6 md:p-8">
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
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-light transition-colors flex items-center gap-2"
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
                        <div className={`px-3 py-1 rounded-lg ${
                          getColorClasses(type?.color || 'gray')
                        }`}>
                          <span className="text-sm font-medium">{entry.count}</span>
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
    </div>
  );
}