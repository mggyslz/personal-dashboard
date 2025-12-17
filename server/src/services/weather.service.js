const axios = require('axios');

class WeatherService {
  constructor() {
    this.geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
    this.weatherUrl = 'https://api.open-meteo.com/v1/forecast';
  }

  // Get coordinates for a city using Open-Meteo Geocoding API
  async getCoordinates(city) {
    try {
      const response = await axios.get(this.geocodingUrl, {
        params: {
          name: city,
          count: 1,
          language: 'en',
          format: 'json'
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error(`City not found: ${city}`);
      }

      const result = response.data.results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country
      };
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

  async getCurrentWeather(city = 'Manila') {
    try {
      // Get coordinates for the city
      const location = await this.getCoordinates(city);

      // Get weather data from Open-Meteo
      const response = await axios.get(this.weatherUrl, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
          timezone: 'auto'
        }
      });

      const current = response.data.current;

      return {
        city: `${location.name}, ${location.country}`,
        temperature: Math.round(current.temperature_2m),
        description: this.getWeatherDescription(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10, // Round to 1 decimal
        weatherCode: current.weather_code
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      return this.getMockWeather();
    }
  }

  getMockWeather() {
    return {
      city: 'Manila, Philippines',
      temperature: 28,
      description: 'partly cloudy',
      humidity: 75,
      windSpeed: 3.5,
      weatherCode: 2
    };
  }
}

module.exports = new WeatherService();