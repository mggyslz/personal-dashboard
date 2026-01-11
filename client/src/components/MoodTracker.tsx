import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Smile, Frown, Meh, TrendingUp, Calendar, 
  BarChart3, ChevronUp, ChevronDown, Lightbulb,
  Activity, TrendingDown, Brain, Heart, Clock
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MoodData {
  entry_date: string;
  time: string | null;
  mood: string;
  value: number; // -3 to 3 for chart
  intensity: number;
  themes: string[];
  insights: string;
  journal_entry_id: number | null;
}

interface MoodSummary {
  currentMood: string | null;
  currentThemes: string[];
  currentInsights: string;
  moodDistribution: Record<string, number>;
  totalEntries: number;
  recommendations: string[];
}

interface MoodAnalysis {
  total: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageMood: string;
  positivePercentage: number;
  streak: number;
}

const moodValueMap: Record<string, number> = {
  'Very Positive': 3,
  'Positive': 2,
  'Slightly Positive': 1,
  'Neutral': 0,
  'Slightly Negative': -1,
  'Negative': -2,
  'Very Negative': -3
};

const moodEmojiMap: Record<string, string> = {
  'Very Positive': '😄',
  'Positive': '🙂',
  'Slightly Positive': '😊',
  'Neutral': '😐',
  'Slightly Negative': '😕',
  'Negative': '😔',
  'Very Negative': '😢'
};

const moodColorMap: Record<string, string> = {
  'Very Positive': 'bg-gradient-to-r from-green-500 to-emerald-400',
  'Positive': 'bg-gradient-to-r from-green-400 to-emerald-300',
  'Slightly Positive': 'bg-gradient-to-r from-emerald-400 to-teal-300',
  'Neutral': 'bg-gradient-to-r from-gray-400 to-gray-300',
  'Slightly Negative': 'bg-gradient-to-r from-amber-400 to-orange-300',
  'Negative': 'bg-gradient-to-r from-orange-400 to-red-300',
  'Very Negative': 'bg-gradient-to-r from-red-500 to-rose-400'
};

const moodBgColorMap: Record<string, string> = {
  'Very Positive': 'bg-green-50 border-green-200',
  'Positive': 'bg-emerald-50 border-emerald-200',
  'Slightly Positive': 'bg-teal-50 border-teal-200',
  'Neutral': 'bg-gray-50 border-gray-200',
  'Slightly Negative': 'bg-amber-50 border-amber-200',
  'Negative': 'bg-orange-50 border-orange-200',
  'Very Negative': 'bg-red-50 border-red-200'
};

export default function MoodTracker() {
  const [moodChartData, setMoodChartData] = useState<Array<{entry_date: string; time: string | null; mood: string; value: number; themes: string[]}>>([]);
  const [moodSummary, setMoodSummary] = useState<MoodSummary | null>(null);
  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showGraph, setShowGraph] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadMoodData();
  }, [timeRange]);

  const loadMoodData = async () => {
    try {
      setLoading(true);
      
      // Get days based on timeRange
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      // Load all data in parallel
      const [summary, analysis, chartData] = await Promise.all([
        api.getMoodSummary(),
        api.getMoodAnalysis(),
        api.getMoodChartData(days)
      ]);

      setMoodSummary(summary);
      setMoodAnalysis(analysis);
      setMoodChartData(chartData);
      
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString: string, timeString: string | null) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (timeString) {
      return `${dateFormatted} ${timeString}`;
    }
    return dateFormatted;
  };

  const getMoodChartData = () => {
    const labels = moodChartData.map(m => formatDateTime(m.entry_date, m.time)).reverse();
    const data = moodChartData.map(m => m.value).reverse();
    const colors = moodChartData.map(m => {
      if (m.value > 0) return '#10b981'; // Green for positive
      if (m.value < 0) return '#ef4444'; // Red for negative
      return '#6b7280'; // Gray for neutral
    }).reverse();

    return {
      labels,
      datasets: [
        {
          label: 'Mood',
          data,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors,
          pointBorderColor: colors,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const hasMoodData = moodChartData.length > 0;
  const currentMood = moodSummary?.currentMood;

  return (
    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <Heart className="text-indigo-600" size={16} />
          </div>
          <h2 className="text-lg font-light text-gray-700">Mood Tracker</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showGraph ? 'Hide Graph' : 'Show Graph'}
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="text-xs bg-gray-100 border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
          </select>
        </div>
      </div>

      {/* Current Mood Summary - Horizontal Layout */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
          <Calendar size={14} />
          Current Mood
        </h3>
        
        {hasMoodData && currentMood ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Mood Card */}
            <div className={`p-4 rounded-xl ${moodColorMap[currentMood]} text-white`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{moodEmojiMap[currentMood]}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{currentMood}</h4>
                  <div className="flex items-center gap-1 mt-1 text-white/80">
                    <Clock size={12} />
                    <span className="text-xs">
                      {moodChartData[0] ? formatDateTime(moodChartData[0].entry_date, moodChartData[0].time) : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mood Stats */}
            {moodAnalysis && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500">Positive Days</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {moodAnalysis.positiveCount}/{moodAnalysis.total}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500">Current Streak</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {moodAnalysis.streak} days
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
              <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                <Lightbulb size={14} />
                Quick Insight
              </h4>
              {moodSummary?.recommendations && moodSummary.recommendations.length > 0 ? (
                <p className="text-xs text-blue-800">{moodSummary.recommendations[0]}</p>
              ) : (
                <p className="text-xs text-blue-800">Track your mood patterns over time</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
              <Brain className="text-gray-400" size={20} />
            </div>
            <p className="text-gray-500 text-sm mb-3">No mood data available</p>
            <p className="text-gray-400 text-xs">Write a journal entry to track your mood</p>
          </div>
        )}
      </div>

      {/* Mood Graph */}
      {showGraph && hasMoodData && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            <BarChart3 size={14} />
            Mood Trend
          </h3>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <Line 
              data={getMoodChartData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                height: 200,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const moodEntry = moodChartData[moodChartData.length - 1 - context.dataIndex];
                        return `${moodEntry.mood} (${formatDateTime(moodEntry.entry_date, moodEntry.time)})`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    min: -3,
                    max: 3,
                    ticks: {
                      callback: (value) => {
                        const moodMap: Record<number, string> = {
                          '-3': 'Very Neg', '-2': 'Negative', '-1': 'Slight Neg',
                          '0': 'Neutral', '1': 'Slight Pos', '2': 'Positive', '3': 'Very Pos'
                        };
                        return moodMap[value as keyof typeof moodMap] || value;
                      }
                    }
                  },
                  x: {
                    ticks: {
                      maxTicksLimit: 8
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Mood History - Horizontal Cards */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-light mb-4 w-full"
      >
        {showDetails ? <ChevronUp size={18} strokeWidth={1.5} /> : <ChevronDown size={18} strokeWidth={1.5} />}
        {showDetails ? 'Hide' : 'View'} Recent Moods ({moodChartData.length})
      </button>

      {showDetails && hasMoodData && (
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2">
            {moodChartData.slice(0, 10).map((mood, idx) => (
              <div
                key={idx}
                className={`flex-shrink-0 w-48 p-4 rounded-lg ${moodBgColorMap[mood.mood] || 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{moodEmojiMap[mood.mood]}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {formatDate(mood.entry_date)}
                    </div>
                    {mood.time && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {mood.time}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-800 mb-2">{mood.mood}</div>
                {mood.themes && mood.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mood.themes.slice(0, 2).map((theme, themeIdx) => (
                      <span
                        key={themeIdx}
                        className="px-2 py-0.5 bg-white/80 text-gray-600 text-xs rounded-full"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasMoodData && (
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Your mood tracker uses your journal entries to understand your emotional state.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Write journal entries to see your mood patterns and get personalized suggestions.
          </p>
        </div>
      )}
    </div>
  );
}