import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

import { 
  WiDaySunny, 
  WiCloudy, 
  WiRain, 
  WiSnow, 
  WiWindy, 
  WiThunderstorm,
  WiFog,
  WiDayCloudy
} from 'react-icons/wi';

interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

const WeatherIcon = ({ description }: { description: string }) => {
  const desc = description.toLowerCase();
  
  const iconProps = {
    className: "w-20 h-20",
    size: 80
  };

  if (desc.includes('clear')) return <WiDaySunny {...iconProps} />;
  if (desc.includes('sun')) return <WiDaySunny {...iconProps} />;
  if (desc.includes('cloud')) return <WiCloudy {...iconProps} />;
  if (desc.includes('rain') || desc.includes('drizzle')) return <WiRain {...iconProps} />;
  if (desc.includes('snow')) return <WiSnow {...iconProps} />;
  if (desc.includes('wind')) return <WiWindy {...iconProps} />;
  if (desc.includes('storm') || desc.includes('thunder')) return <WiThunderstorm {...iconProps} />;
  if (desc.includes('fog') || desc.includes('mist')) return <WiFog {...iconProps} />;
  
  return <WiDayCloudy {...iconProps} />;
};

// Cache in the frontend for additional protection
const LOCAL_CACHE_KEY = 'weather_app_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Load from local storage cache
  const getCachedWeather = useCallback((): WeatherCache | null => {
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (!cached) return null;
      
      const parsed: WeatherCache = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed;
      }
      
      // Clear expired cache
      localStorage.removeItem(LOCAL_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }, []);

  // Save to local storage cache
  const saveToCache = useCallback((data: WeatherData) => {
    try {
      const cache: WeatherCache = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }, []);

  const loadWeather = useCallback(async (forceRefresh = false) => {
    // If not forcing refresh, check local cache first
    if (!forceRefresh) {
      const cached = getCachedWeather();
      if (cached) {
        console.log('Using local cache');
        setWeather(cached.data);
        setLastUpdated(new Date(cached.timestamp).toLocaleTimeString());
        setLoading(false);
        
        // Still refresh in background for updated data
        setTimeout(() => loadWeather(true), 1000);
        return;
      }
    }

    try {
      setLoading(true);
      const data = await api.getWeather();
      setWeather(data);
      saveToCache(data);
      setLastUpdated(new Date().toLocaleTimeString());
      
      console.log('Fetched fresh weather data');
    } catch (error) {
      console.error('Error loading weather:', error);
      
      // If fresh fetch fails, try to use expired cache as fallback
      const cached = getCachedWeather();
      if (cached) {
        console.log('Using expired cache as fallback');
        setWeather(cached.data);
        setLastUpdated(new Date(cached.timestamp).toLocaleTimeString() + ' (cached)');
      }
    } finally {
      setLoading(false);
    }
  }, [getCachedWeather, saveToCache]);

  useEffect(() => {
    // Initial load
    loadWeather();
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing weather data');
      loadWeather(true);
    }, REFRESH_INTERVAL);
    
    // Refresh on focus (when user returns to tab)
    const handleFocus = () => {
      const cached = getCachedWeather();
      if (!cached || (Date.now() - cached.timestamp > CACHE_TTL)) {
        console.log('Tab focused, refreshing weather if needed');
        loadWeather(true);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadWeather, getCachedWeather]);

  const handleRefresh = () => {
    loadWeather(true);
  };

  if (loading && !weather) {
    return (
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 rounded w-1/3"></div>
            <div className="h-6 rounded w-16"></div>
          </div>
          <div className="h-20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 h-full bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">WEATHER</h2>
          <div className="px-3 py-1 border-2 border-black text-sm font-bold">
            OFFLINE
          </div>
        </div>
        <p className="font-black border-2 border-black p-2 mb-4">UNABLE TO LOAD DATA</p>
        <button 
          onClick={handleRefresh}
          className="border-2 border-black font-bold px-4 py-2 transition-colors"
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 h-full bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black">WEATHER</h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs font-bold">
              Updated: {lastUpdated}
            </span>
          )}
          <div className="px-3 py-1 border-2 border-black text-sm font-bold">
            LIVE
          </div>
          <button 
            onClick={handleRefresh}
            className="px-2 py-1 border-2 border-black text-sm font-bold transition-colors"
            title="Refresh weather data"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-4">
            <p className="text-2xl font-black mb-1">{weather.city.toUpperCase()}</p>
            <span className="uppercase text-sm font-bold border-2 border-black px-2 py-1 inline-block">
              {weather.description}
            </span>
          </div>
          <div className="flex items-baseline mb-6">
            <span className="text-6xl font-black">{weather.temperature}°C</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-black">
            <div className="p-3 border-2 border-black">
              <span className="text-sm font-black block mb-1">HUMIDITY</span>
              <span className="text-xl font-black">{weather.humidity}%</span>
            </div>
            <div className="p-3 border-2 border-black">
              <span className="text-sm font-black block mb-1">WIND SPEED</span>
              <span className="text-xl font-black">{weather.windSpeed} M/S</span>
            </div>
          </div>
        </div>
        <div className="ml-4 border-2 border-black p-2 rounded-md flex items-center justify-center">
          <WeatherIcon description={weather.description} />
        </div>
      </div>
    </div>
  );
}