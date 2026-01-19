const axios = require('axios');

class WeatherService {
  constructor() {
    this.geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
    this.weatherUrl = 'https://api.open-meteo.com/v1/forecast';
    
    // Cache storage
    this.coordinatesCache = new Map();
    this.weatherCache = new Map();
    
    // Cache TTL in milliseconds (5 minutes for coordinates, 10 minutes for weather)
    this.COORDINATES_CACHE_TTL = 5 * 60 * 1000;
    this.WEATHER_CACHE_TTL = 10 * 60 * 1000;
  }

  // Get coordinates for a city with caching
  async getCoordinates(city) {
    const cacheKey = city.toLowerCase().trim();
    const cached = this.coordinatesCache.get(cacheKey);
    
    // Return cached coordinates if still valid
    if (cached && (Date.now() - cached.timestamp) < this.COORDINATES_CACHE_TTL) {
      console.log('Using cached coordinates for:', city);
      return cached.data;
    }

    try {
      const response = await axios.get(this.geocodingUrl, {
        params: {
          name: city,
          count: 1,
          language: 'en',
          format: 'json'
        },
        timeout: 5000 // 5 second timeout
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error(`City not found: ${city}`);
      }

      const result = response.data.results[0];
      const coordinates = {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country
      };

      // Cache the coordinates
      this.coordinatesCache.set(cacheKey, {
        data: coordinates,
        timestamp: Date.now()
      });

      console.log('Fetched new coordinates for:', city);
      return coordinates;
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw error;
    }
  }

  // Get weather description based on WMO weather code
  getWeatherDescription(code) {
    const weatherCodes = {
      0: 'clear sky',
      1: 'mainly clear',
      2: 'partly cloudy',
      3: 'overcast',
      45: 'foggy',
      48: 'depositing rime fog',
      51: 'light drizzle',
      53: 'moderate drizzle',
      55: 'dense drizzle',
      56: 'light freezing drizzle',
      57: 'dense freezing drizzle',
      61: 'slight rain',
      63: 'moderate rain',
      65: 'heavy rain',
      66: 'light freezing rain',
      67: 'heavy freezing rain',
      71: 'slight snow',
      73: 'moderate snow',
      75: 'heavy snow',
      77: 'snow grains',
      80: 'slight rain showers',
      81: 'moderate rain showers',
      82: 'violent rain showers',
      85: 'slight snow showers',
      86: 'heavy snow showers',
      95: 'thunderstorm',
      96: 'thunderstorm with slight hail',
      99: 'thunderstorm with heavy hail'
    };

    return weatherCodes[code] || 'unknown';
  }

  // Get weather with caching
  async getCurrentWeather(city = 'Manila') {
    const normalizedCity = city.toLowerCase().trim();
    const cacheKey = normalizedCity;
    const cached = this.weatherCache.get(cacheKey);
    
    // Return cached weather if still valid
    if (cached && (Date.now() - cached.timestamp) < this.WEATHER_CACHE_TTL) {
      console.log('Using cached weather for:', city);
      return cached.data;
    }

    try {
      // Get coordinates for the city
      const location = await this.getCoordinates(city);

      // Get weather data from Open-Meteo
      const response = await axios.get(this.weatherUrl, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
          timezone: 'auto',
          forecast_days: 1
        },
        timeout: 5000 // 5 second timeout
      });

      if (!response.data.current) {
        throw new Error('Invalid weather data received');
      }

      const current = response.data.current;

      const weatherData = {
        city: `${location.name}, ${location.country}`,
        temperature: Math.round(current.temperature_2m),
        description: this.getWeatherDescription(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10, // Round to 1 decimal
        weatherCode: current.weather_code
      };

      // Cache the weather data
      this.weatherCache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      console.log('Fetched new weather for:', city);
      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error.message);
      
      // Return mock data if API fails AND there's no cache
      const cached = this.weatherCache.get(cacheKey);
      if (cached) {
        console.log('API failed, using stale cache for:', city);
        return cached.data;
      }
      
      return this.getMockWeather(city);
    }
  }

  // Clear cache (optional, useful for testing)
  clearCache() {
    this.coordinatesCache.clear();
    this.weatherCache.clear();
  }

  getMockWeather(city = 'Manila') {
    return {
      city: `${city}, Unknown`,
      temperature: 28,
      description: 'partly cloudy',
      humidity: 75,
      windSpeed: 3.5,
      weatherCode: 2
    };
  }
}

module.exports = new WeatherService();