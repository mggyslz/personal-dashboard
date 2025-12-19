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
  WiDayCloudy,
  WiNightClear 
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
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Weather</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Weather</h2>
        <p className="text-gray-500">Unable to load weather</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Weather</h2>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2">
            <p className="text-gray-700 font-medium text-xl">{weather.city}</p>
            <span className="text-gray-600 capitalize text-sm">{weather.description}</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-gray-800">{weather.temperature}°C</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 pt-4 mt-4 border-t">
            <div className="flex flex-col">
              <span className="font-medium">Humidity</span>
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Wind Speed</span>
              <span>{weather.windSpeed} m/s</span>
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