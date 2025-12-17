const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(city = 'Manila') {
    try {
      if (!this.apiKey) {
        // Return mock data if no API key
        return this.getMockWeather();
      }

      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return {
        city: response.data.name,
        temperature: Math.round(response.data.main.temp),
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        icon: response.data.weather[0].icon
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      return this.getMockWeather();
    }
  }

  getMockWeather() {
    return {
      city: 'Manila',
      temperature: 28,
      description: 'partly cloudy',
      humidity: 75,
      windSpeed: 3.5,
      icon: '02d'
    };
  }
}

module.exports = new WeatherService();