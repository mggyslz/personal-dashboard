import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

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
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Weather</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Weather</h2>
        <p className="text-gray-500">Unable to load weather</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Weather</h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold">{weather.temperature}°C</span>
          <span className="text-gray-600 capitalize">{weather.description}</span>
        </div>
        <p className="text-gray-600">{weather.city}</p>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Humidity: {weather.humidity}%</span>
          <span>Wind: {weather.windSpeed} m/s</span>
        </div>
      </div>
    </div>
  );
}