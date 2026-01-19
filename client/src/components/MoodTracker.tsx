import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Smile, Frown, Meh, TrendingUp, Calendar, 
  BarChart3, ChevronUp, ChevronDown, Lightbulb,
  Activity, TrendingDown, Brain, Heart, Clock,
  PieChart, LineChart, Target
} from 'lucide-react';

interface MoodData {
  entry_date: string;
  time: string | null;
  mood: string;
  value: number;
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

const moodEmojiMap: Record<string, string> = {
  'Very Positive': '😄',
  'Positive': '🙂',
  'Slightly Positive': '😊',
  'Neutral': '😐',
  'Slightly Negative': '😕',
  'Negative': '😔',
  'Very Negative': '😢'
};

// Color scheme for different mood categories
const moodColors: Record<string, string> = {
  'Very Positive': '#10B981', // Emerald
  'Positive': '#34D399',     // Green
  'Slightly Positive': '#6EE7B7', // Light Green
  'Neutral': '#9CA3AF',      // Gray
  'Slightly Negative': '#FBBF24', // Amber
  'Negative': '#F59E0B',     // Orange
  'Very Negative': '#EF4444' // Red
};

const chartColors = {
  insight: '#3B82F6',      // Blue
  viewRecent: '#8B5CF6',   // Violet
  positive: '#10B981',     // Emerald
  veryPositive: '#059669', // Darker Emerald
  neutral: '#6B7280',      // Gray
  negative: '#F59E0B',     // Orange
  veryNegative: '#DC2626'  // Red
};

export default function MoodTracker() {
  const [moodChartData, setMoodChartData] = useState<MoodData[]>([]);
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
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      const [summary, analysis, chartData] = await Promise.all([
        api.getMoodSummary(),
        api.getMoodAnalysis(),
        api.getMoodChartData(days)
      ]);

      setMoodSummary(summary);
      setMoodAnalysis(analysis);
      
      // Sort chart data by date in descending order (newest first)
      const sortedData = chartData.sort((a, b) => 
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
      );
      setMoodChartData(sortedData);
      
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Return date in format "Jan 16"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get today's date in format for comparison
  const getTodayDateString = () => {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate mood distribution for pie chart
  const getMoodDistribution = () => {
    const distribution: Record<string, number> = {};
    moodChartData.forEach(mood => {
      distribution[mood.mood] = (distribution[mood.mood] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / moodChartData.length) * 100),
        color: moodColors[mood] || '#9CA3AF'
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Generate line chart data - FIXED to show proper dates in correct order
  const getLineChartData = () => {
    // Get the most recent 14 entries in chronological order (oldest to newest)
    const recentData = [...moodChartData]
      .slice(-14) // Take last 14 entries (oldest)
      .map(mood => ({
        date: formatDate(mood.entry_date),
        fullDate: new Date(mood.entry_date),
        mood: mood.mood,
        value: mood.value,
        color: moodColors[mood.mood] || '#9CA3AF'
      }))
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime()); // Sort chronologically
    
    // Calculate trend line more accurately
    const values = recentData.map(d => d.value);
    if (values.length < 2) {
      return { data: recentData, trend: 'neutral', average: 4 };
    }
    
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Calculate linear regression for trend
    const x = Array.from({ length: values.length }, (_, i) => i);
    const y = values;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const trend = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'neutral';
    
    return { data: recentData, trend, average };
  };

  // Get the insight from the most recent journal entry
  const getRecentInsight = () => {
    if (!moodChartData.length || !moodChartData[0].insights) {
      return "Track your mood patterns to gain insights";
    }
    
    // Get the most recent mood entry (which is the first in the sorted array)
    const mostRecentMood = moodChartData[0];
    
    // Create insight text combining insights and themes
    let insightText = mostRecentMood.insights;
    
    // Add themes if available
    if (mostRecentMood.themes && mostRecentMood.themes.length > 0) {
      const themesText = mostRecentMood.themes.join(' • ');
      insightText = insightText ? `${insightText} | ${themesText}` : themesText;
    }
    
    return insightText;
  };

  const hasMoodData = moodChartData.length > 0;
  const currentMood = moodSummary?.currentMood;
  const moodDistribution = getMoodDistribution();
  const lineChartData = getLineChartData();
  const recentInsight = getRecentInsight();

  return (
    <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-black">
            <Heart className="text-black" size={20} />
          </div>
          <h2 className="text-xl font-black text-black">MOOD TRACKER</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="border-2 border-black bg-white px-3 py-1 text-sm font-bold hover:bg-black hover:text-white transition-all flex items-center gap-2"
          >
            {showGraph ? <PieChart size={14} /> : <LineChart size={14} />}
            {showGraph ? 'HIDE GRAPH' : 'SHOW GRAPH'}
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border-2 border-black bg-white px-3 py-1 text-sm font-bold hover:bg-black hover:text-white transition-all"
          >
            <option value="7d">7 DAYS</option>
            <option value="30d">30 DAYS</option>
            <option value="90d">90 DAYS</option>
          </select>
        </div>
      </div>

      {hasMoodData && currentMood ? (
        <div className="mb-6">
          <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <Calendar size={18} />
            CURRENT MOOD
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Current Mood Card */}
            <div className="border-2 border-black bg-white p-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{moodEmojiMap[currentMood]}</span>
                <div className="flex-1">
                  <h4 
                    className="font-black text-xl"
                    style={{ color: moodColors[currentMood] || '#000' }}
                  >
                    {currentMood}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={12} className="text-gray-600" />
                    <span className="text-xs font-bold text-gray-600">
                      {moodChartData[0] ? formatDate(moodChartData[0].entry_date) : 'RECENT'}
                      {formatDate(moodChartData[0].entry_date) === getTodayDateString() && ' • TODAY'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mood Stats */}
            {moodAnalysis && (
              <div className="grid grid-cols-2 gap-2">
                <div 
                  className="border-2 border-black p-3 hover:scale-[1.02] transition-transform duration-200"
                >
                  <div className="text-xs font-bold text-gray-600">POSITIVE DAYS</div>
                  <div 
                    className="text-xl font-black"
                    style={{ color: chartColors.positive }}
                  >
                    {moodAnalysis.positiveCount}/{moodAnalysis.total}
                  </div>
                </div>
                <div 
                  className="border-2 border-black p-3 hover:scale-[1.02] transition-transform duration-200"
                >
                  <div className="text-xs font-bold text-gray-600">CURRENT STREAK</div>
                  <div 
                    className="text-xl font-black"
                    style={{ color: chartColors.veryPositive }}
                  >
                    {moodAnalysis.streak} DAYS
                  </div>
                </div>
              </div>
            )}

            {/* INSIGHT Card - Using recent journal insight */}
            <div 
              className="border-2 border-black p-4 hover:scale-[1.02] transition-transform duration-200"
            >
              <h4 className="text-sm font-black mb-2 flex items-center gap-2">
                <Lightbulb 
                  size={14} 
                  className="text-blue-600"
                />
                <span className="text-blue-600">INSIGHT</span>
              </h4>
              <p className="text-xs font-medium">
                {moodChartData[0]?.themes && moodChartData[0].themes.length > 0 
                  ? moodChartData[0].themes.join(' • ')
                  : recentInsight
                }
              </p>
              {moodChartData[0]?.insights && (
                <p className="text-xs text-gray-600 mt-1">
                  {moodChartData[0].insights}
                </p>
              )}
            </div>
          </div>

          {/* Graph Section */}
          {showGraph && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-black flex items-center gap-2">
                  <BarChart3 size={18} />
                  MOOD VISUALIZATION
                </h3>
                <div className="flex gap-2 overflow-x-auto max-w-[300px]">
                  {Object.entries(moodColors).map(([mood, color]) => (
                    <div key={mood} className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-black" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-bold whitespace-nowrap">{mood.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fixed Line Chart with proper date alignment */}
                <div className="border-2 border-black p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-black text-sm flex items-center gap-2">
                      <TrendingUp size={14} />
                      MOOD TREND
                    </h4>
                    <span className="text-xs font-bold px-2 py-1 border-2 border-black">
                      {timeRange.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="relative h-48">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-between text-xs font-bold">
                      <span>7</span>
                      <span>6</span>
                      <span>5</span>
                      <span>4</span>
                      <span>3</span>
                      <span>2</span>
                      <span>1</span>
                    </div>
                    
                    {/* Chart area */}
                    <div className="ml-6 h-full relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between">
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="border-t border-gray-300" />
                        ))}
                      </div>
                      
                      {/* SVG Line Chart - FIXED coordinate calculation and date alignment */}
                      {lineChartData.data.length > 1 && (
                        <svg 
                          className="absolute inset-0 w-full h-full overflow-visible" 
                          preserveAspectRatio="none"
                        >
                          {/* Background average line */}
                          <line
                            x1="0"
                            x2="100%"
                            y1={`${100 - ((lineChartData.average - 1) / 6) * 100}%`}
                            y2={`${100 - ((lineChartData.average - 1) / 6) * 100}%`}
                            stroke="#E5E7EB"
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                          
                          {/* Main line connecting all points */}
                          <polyline
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={lineChartData.data
                              .map((point, index) => {
                                const x = (index / (lineChartData.data.length - 1)) * 100;
                                // Scale value from 1-7 to chart height (0% = value 1, 100% = value 7)
                                const y = 100 - ((point.value - 1) / 6) * 100;
                                return `${x}%,${y}%`;
                              })
                              .join(' ')}
                          />
                          
                          {/* Data points */}
                          {lineChartData.data.map((point, index) => {
                            const x = (index / (lineChartData.data.length - 1)) * 100;
                            const y = 100 - ((point.value - 1) / 6) * 100;
                            return (
                              <g key={index} className="cursor-pointer">
                                <circle
                                  cx={`${x}%`}
                                  cy={`${y}%`}
                                  r="6"
                                  fill={point.color}
                                  stroke="white"
                                  strokeWidth="2"
                                  className="hover:r-8 transition-all"
                                />
                                <text
                                  x={`${x}%`}
                                  y={`${y - 5}%`}
                                  textAnchor="middle"
                                  className="text-xs font-bold fill-black pointer-events-none"
                                >
                                  {point.value}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      )}
                      
                      {/* X-axis labels - FIXED to not overlap and show properly */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                        {lineChartData.data.map((point, index) => (
                          <div
                            key={index}
                            className="text-xs font-bold"
                            style={{ 
                              transform: 'translateX(-50%)',
                              position: 'absolute',
                              left: `${(index / (lineChartData.data.length - 1)) * 100}%`,
                              bottom: '-20px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {point.date}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Trend indicator */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {lineChartData.trend === 'up' ? (
                        <>
                          <TrendingUp size={14} className="text-green-600" />
                          <span className="text-xs font-bold text-green-600">UP TREND</span>
                        </>
                      ) : lineChartData.trend === 'down' ? (
                        <>
                          <TrendingDown size={14} className="text-red-600" />
                          <span className="text-xs font-bold text-red-600">DOWN TREND</span>
                        </>
                      ) : (
                        <>
                          <Activity size={14} className="text-gray-600" />
                          <span className="text-xs font-bold text-gray-600">STABLE</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pie Chart / Distribution */}
                <div className="border-2 border-black p-4">
                  <h4 className="font-black text-sm mb-3 flex items-center gap-2">
                    <PieChart size={14} />
                    MOOD DISTRIBUTION
                  </h4>
                  <div className="flex flex-col gap-2">
                    {moodDistribution.map((item) => (
                      <div key={item.mood} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-sm border border-black"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-bold whitespace-nowrap">{item.mood}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-4 bg-gray-200 border border-black overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500"
                              style={{ 
                                backgroundColor: item.color,
                                width: `${item.percentage}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-black min-w-8">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-black mb-6">
          <div className="w-12 h-12 border-2 border-black flex items-center justify-center mx-auto mb-3">
            <Brain className="text-black" size={24} />
          </div>
          <p className="text-gray-600 text-sm font-bold mb-3">NO MOOD DATA</p>
          <p className="text-gray-600 text-xs">WRITE A JOURNAL ENTRY</p>
        </div>
      )}

      {/* Mood History */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 font-black mb-4 w-full justify-center border-2 border-black px-4 py-2 hover:bg-opacity-10 transition-all"
        style={{ 
          color: showDetails ? 'white' : chartColors.viewRecent,
          backgroundColor: showDetails ? chartColors.viewRecent : 'transparent',
        }}
      >
        {showDetails ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
        {showDetails ? 'HIDE' : 'VIEW'} RECENT MOODS ({moodChartData.length})
      </button>

      {showDetails && hasMoodData && (
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2">
            {moodChartData.slice(0, 10).map((mood, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-48 border-2 border-black bg-white p-4 hover:scale-[1.02] transition-transform duration-200"
                style={{ borderLeftColor: moodColors[mood.mood] || '#000', borderLeftWidth: '4px' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{moodEmojiMap[mood.mood]}</span>
                  <div>
                    <div 
                      className="text-sm font-black"
                      style={{ color: moodColors[mood.mood] || '#000' }}
                    >
                      {formatDate(mood.entry_date)}
                    </div>
                    {mood.time && (
                      <div className="text-xs text-gray-600 flex items-center gap-1 font-bold">
                        <Clock size={10} />
                        {mood.time}
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  className="text-sm font-black mb-2"
                  style={{ color: moodColors[mood.mood] || '#000' }}
                >
                  {mood.mood}
                </div>
                {mood.themes && mood.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mood.themes.slice(0, 2).map((theme, themeIdx) => (
                      <span
                        key={themeIdx}
                        className="px-2 py-0.5 text-xs font-bold border-2 border-black"
                        style={{ 
                          backgroundColor: moodColors[mood.mood] || '#000',
                          color: 'white'
                        }}
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
        <div className="text-center py-6 border-t-2 border-black">
          <p className="text-gray-600 text-sm font-bold">
            YOUR MOOD TRACKER USES JOURNAL ENTRIES
          </p>
          <p className="text-gray-600 text-xs mt-1 font-bold">
            WRITE JOURNAL ENTRIES TO SEE PATTERNS
          </p>
        </div>
      )}
    </div>
  );
}