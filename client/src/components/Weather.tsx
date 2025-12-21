import { useState, useEffect } from 'react';
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

const WeatherIcon = ({ description }: { description: string }) => {
  const desc = description.toLowerCase();
  
  const iconProps = {
    className: "w-16 h-16",
    size: 64
  };

  if (desc.includes('clear')) return <WiDaySunny {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
  if (desc.includes('sun')) return <WiDaySunny {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
  if (desc.includes('cloud')) return <WiCloudy {...iconProps} className={`${iconProps.className} text-gray-500`} />;
  if (desc.includes('rain') || desc.includes('drizzle')) return <WiRain {...iconProps} className={`${iconProps.className} text-blue-500`} />;
  if (desc.includes('snow')) return <WiSnow {...iconProps} className={`${iconProps.className} text-blue-300`} />;
  if (desc.includes('wind')) return <WiWindy {...iconProps} className={`${iconProps.className} text-gray-400`} />;
  if (desc.includes('storm') || desc.includes('thunder')) return <WiThunderstorm {...iconProps} className={`${iconProps.className} text-purple-600`} />;
  if (desc.includes('fog') || desc.includes('mist')) return <WiFog {...iconProps} className={`${iconProps.className} text-gray-400`} />;
  
  return <WiDayCloudy {...iconProps} className={`${iconProps.className} text-gray-400`} />;
};

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const data = await api.getWeather();
      setWeather(data);
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200/50 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5">
        <h2 className="text-lg font-light text-gray-700 mb-4">Weather</h2>
        <p className="text-gray-400 font-light">Unable to load weather</p>
      </div>
    );
  }

  return (
    <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center">
          <WiDaySunny className="text-blue-400" size={20} />
        </div>
        <h2 className="text-lg font-light text-gray-700">Weather</h2>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-4">
            <p className="text-gray-700 font-medium text-xl">{weather.city}</p>
            <span className="text-gray-600 capitalize text-sm font-light">{weather.description}</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-5xl font-thin text-gray-900">{weather.temperature}°C</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 pt-6 mt-6 border-t border-gray-200/50">
            <div className="flex flex-col">
              <span className="font-light">Humidity</span>
              <span className="font-medium text-gray-700">{weather.humidity}%</span>
            </div>
            <div className="flex flex-col">
              <span className="font-light">Wind Speed</span>
              <span className="font-medium text-gray-700">{weather.windSpeed} m/s</span>
            </div>
          </div>
        </div>
        <div className="ml-4">
          <WeatherIcon description={weather.description} />
        </div>
      </div>
    </div>
  );
}