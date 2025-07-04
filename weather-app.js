class WeatherApp {
    constructor() {
        this.apiKey = '03dee663868ce53bdbc6d1f8da7de2fc';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.units = 'metric';
        this.currentData = null;
        this.forecastData = null;
        this.favorites = JSON.parse(localStorage.getItem('weatherFavorites') || '[]');
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDefaultLocation();
    }

    bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        const cityInput = document.getElementById('cityInput');
        const locationBtn = document.getElementById('locationBtn');
        const metricBtn = document.getElementById('metricBtn');
        const imperialBtn = document.getElementById('imperialBtn');
        const dailyTab = document.getElementById('dailyTab');
        const hourlyTab = document.getElementById('hourlyTab');
        const favoritesBtn = document.getElementById('favoritesBtn');

        searchBtn.addEventListener('click', () => this.searchWeather());
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWeather();
            }
        });
        locationBtn.addEventListener('click', () => this.getCurrentLocation());
        metricBtn.addEventListener('click', () => this.setUnits('metric'));
        imperialBtn.addEventListener('click', () => this.setUnits('imperial'));
        dailyTab.addEventListener('click', () => this.showDailyForecast());
        hourlyTab.addEventListener('click', () => this.showHourlyForecast());
        favoritesBtn.addEventListener('click', () => this.toggleFavorite());
    }

    async loadDefaultLocation() {
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        this.getWeatherByCoords(latitude, longitude);
                    },
                    () => {
                        // If geolocation fails, load weather for a default city
                        this.getWeatherByCity('London');
                    }
                );
            } else {
                this.getWeatherByCity('London');
            }
        } catch (error) {
            console.error('Error loading default location:', error);
            this.getWeatherByCity('London');
        }
    }

    async searchWeather() {
        const cityInput = document.getElementById('cityInput');
        const city = cityInput.value.trim();

        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        await this.getWeatherByCity(city);
    }

    async getWeatherByCity(city) {
        try {
            this.showLoading();
            
            const currentWeatherUrl = `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=${this.units}`;
            const forecastUrl = `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=${this.units}`;
            const uvUrl = `${this.baseUrl}/uvi?appid=${this.apiKey}`;

            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(currentWeatherUrl),
                fetch(forecastUrl)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('City not found');
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();
            
            // Get UV index
            const uvResponse = await fetch(`${uvUrl}&lat=${currentData.coord.lat}&lon=${currentData.coord.lon}`);
            const uvData = uvResponse.ok ? await uvResponse.json() : null;

            this.currentData = currentData;
            this.forecastData = forecastData;
            
            this.updateCurrentWeather(currentData, uvData);
            this.updateForecast(forecastData);
            this.updateHourlyForecast(forecastData);
            this.updateBackground(currentData.weather[0].main);
            this.updateFavoriteButton();
            this.hideLoading();

        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError('Unable to fetch weather data. Please check the city name and try again.');
            this.hideLoading();
        }
    }

    async getWeatherByCoords(lat, lon) {
        try {
            this.showLoading();
            
            const currentWeatherUrl = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`;
            const forecastUrl = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`;
            const uvUrl = `${this.baseUrl}/uvi?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;

            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(currentWeatherUrl),
                fetch(forecastUrl)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('Location not found');
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();
            
            // Get UV index
            const uvResponse = await fetch(uvUrl);
            const uvData = uvResponse.ok ? await uvResponse.json() : null;

            this.currentData = currentData;
            this.forecastData = forecastData;
            
            this.updateCurrentWeather(currentData, uvData);
            this.updateForecast(forecastData);
            this.updateHourlyForecast(forecastData);
            this.updateBackground(currentData.weather[0].main);
            this.updateFavoriteButton();
            this.hideLoading();

        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError('Unable to fetch weather data for your location.');
            this.hideLoading();
        }
    }

    updateCurrentWeather(data, uvData) {
        const cityName = document.getElementById('cityName');
        const temperature = document.getElementById('temperature');
        const weatherDesc = document.getElementById('weatherDesc');
        const weatherSymbol = document.getElementById('weatherSymbol');
        const feelsLike = document.getElementById('feelsLike');
        const humidity = document.getElementById('humidity');
        const windSpeed = document.getElementById('windSpeed');
        const pressure = document.getElementById('pressure');
        const uvIndex = document.getElementById('uvIndex');
        const visibility = document.getElementById('visibility');

        const tempUnit = this.units === 'metric' ? '°C' : '°F';
        const windUnit = this.units === 'metric' ? 'km/h' : 'mph';
        const visibilityUnit = this.units === 'metric' ? 'km' : 'mi';
        const windSpeedValue = this.units === 'metric' ? data.wind.speed * 3.6 : data.wind.speed * 2.237;
        const visibilityValue = this.units === 'metric' ? data.visibility / 1000 : data.visibility / 1609;

        cityName.textContent = `${data.name}, ${data.sys.country}`;
        temperature.textContent = `${Math.round(data.main.temp)}${tempUnit}`;
        weatherDesc.textContent = data.weather[0].description;
        weatherSymbol.textContent = this.getWeatherIcon(data.weather[0].main);
        feelsLike.textContent = `${Math.round(data.main.feels_like)}${tempUnit}`;
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${Math.round(windSpeedValue)} ${windUnit}`;
        pressure.textContent = `${data.main.pressure} hPa`;
        uvIndex.textContent = uvData ? Math.round(uvData.value) : '--';
        visibility.textContent = `${Math.round(visibilityValue)} ${visibilityUnit}`;
    }

    updateForecast(data) {
        const forecastContainer = document.getElementById('forecastContainer');
        forecastContainer.innerHTML = '';

        // Get daily forecasts (every 8th item since API returns 3-hour intervals)
        const dailyForecasts = data.list.filter((item, index) => index % 8 === 0).slice(0, 5);
        const tempUnit = this.units === 'metric' ? '°C' : '°F';

        dailyForecasts.forEach((forecast, index) => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            const date = new Date(forecast.dt * 1000);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            
            forecastItem.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-weather">
                    <span class="forecast-icon">${this.getWeatherIcon(forecast.weather[0].main)}</span>
                    <span class="forecast-desc">${forecast.weather[0].description}</span>
                </div>
                <div class="forecast-temps">
                    <span class="temp-high">${Math.round(forecast.main.temp_max)}°</span>
                    <span class="temp-low">${Math.round(forecast.main.temp_min)}°</span>
                </div>
            `;
            
            forecastContainer.appendChild(forecastItem);
        });
    }

    updateHourlyForecast(data) {
        const hourlyContainer = document.getElementById('hourlyContainer');
        hourlyContainer.innerHTML = '';

        // Get next 24 hours (8 items since API returns 3-hour intervals)
        const hourlyForecasts = data.list.slice(0, 8);
        const tempUnit = this.units === 'metric' ? '°C' : '°F';

        hourlyForecasts.forEach((forecast, index) => {
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            
            const date = new Date(forecast.dt * 1000);
            const timeString = index === 0 ? 'Now' : date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                hour12: true 
            });
            
            hourlyItem.innerHTML = `
                <div class="hourly-time">${timeString}</div>
                <div class="hourly-icon">${this.getWeatherIcon(forecast.weather[0].main)}</div>
                <div class="hourly-temp">${Math.round(forecast.main.temp)}°</div>
                <div class="hourly-desc">${forecast.weather[0].description}</div>
            `;
            
            hourlyContainer.appendChild(hourlyItem);
        });
    }

    updateBackground(weatherMain) {
        const animatedBg = document.getElementById('animatedBg');
        animatedBg.className = 'animated-bg';
        
        setTimeout(() => {
            switch (weatherMain.toLowerCase()) {
                case 'clear':
                    animatedBg.classList.add('sunny');
                    break;
                case 'clouds':
                    animatedBg.classList.add('cloudy');
                    break;
                case 'rain':
                case 'drizzle':
                case 'thunderstorm':
                    animatedBg.classList.add('rainy');
                    break;
                case 'snow':
                    animatedBg.classList.add('snowy');
                    break;
                default:
                    // Keep default animation
                    break;
            }
        }, 100);
    }

    getWeatherIcon(weatherMain) {
        const icons = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️',
            'Smoke': '🌫️',
            'Dust': '🌫️',
            'Sand': '🌫️',
            'Ash': '🌫️',
            'Squall': '💨',
            'Tornado': '🌪️'
        };
        return icons[weatherMain] || '🌤️';
    }

    showLoading() {
        const currentWeather = document.getElementById('currentWeather');
        const forecastSection = document.getElementById('forecastSection');
        
        currentWeather.innerHTML = '<div class="loading">Loading weather data...</div>';
        forecastSection.style.display = 'none';
    }

    hideLoading() {
        const forecastSection = document.getElementById('forecastSection');
        forecastSection.style.display = 'block';
    }

    showError(message) {
        const currentWeather = document.getElementById('currentWeather');
        currentWeather.innerHTML = `<div class="error">${message}</div>`;
        
        const forecastSection = document.getElementById('forecastSection');
        const hourlySection = document.getElementById('hourlySection');
        const alertsSection = document.getElementById('alertsSection');
        
        forecastSection.style.display = 'none';
        hourlySection.style.display = 'none';
        alertsSection.style.display = 'none';
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.getWeatherByCoords(latitude, longitude);
                },
                (error) => {
                    this.showError('Unable to get your location. Please enter a city name.');
                }
            );
        } else {
            this.showError('Geolocation is not supported by this browser.');
        }
    }

    setUnits(units) {
        this.units = units;
        
        const metricBtn = document.getElementById('metricBtn');
        const imperialBtn = document.getElementById('imperialBtn');
        
        if (units === 'metric') {
            metricBtn.classList.add('active');
            imperialBtn.classList.remove('active');
        } else {
            imperialBtn.classList.add('active');
            metricBtn.classList.remove('active');
        }

        // Refresh weather data with new units
        if (this.currentData) {
            const cityName = this.currentData.name;
            this.getWeatherByCity(cityName);
        }
    }

    showDailyForecast() {
        const dailyTab = document.getElementById('dailyTab');
        const hourlyTab = document.getElementById('hourlyTab');
        const forecastSection = document.getElementById('forecastSection');
        const hourlySection = document.getElementById('hourlySection');
        
        dailyTab.classList.add('active');
        hourlyTab.classList.remove('active');
        forecastSection.style.display = 'block';
        hourlySection.style.display = 'none';
    }

    showHourlyForecast() {
        const dailyTab = document.getElementById('dailyTab');
        const hourlyTab = document.getElementById('hourlyTab');
        const forecastSection = document.getElementById('forecastSection');
        const hourlySection = document.getElementById('hourlySection');
        
        hourlyTab.classList.add('active');
        dailyTab.classList.remove('active');
        forecastSection.style.display = 'none';
        hourlySection.style.display = 'block';
    }

    toggleFavorite() {
        if (!this.currentData) return;
        
        const cityName = `${this.currentData.name}, ${this.currentData.sys.country}`;
        const cityId = this.currentData.id;
        
        const favoriteIndex = this.favorites.findIndex(fav => fav.id === cityId);
        
        if (favoriteIndex > -1) {
            // Remove from favorites
            this.favorites.splice(favoriteIndex, 1);
            document.getElementById('favoritesBtn').textContent = '⭐';
        } else {
            // Add to favorites
            this.favorites.push({
                id: cityId,
                name: cityName,
                coord: this.currentData.coord
            });
            document.getElementById('favoritesBtn').textContent = '🌟';
        }
        
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
    }

    updateFavoriteButton() {
        if (!this.currentData) return;
        
        const cityId = this.currentData.id;
        const isFavorite = this.favorites.some(fav => fav.id === cityId);
        
        document.getElementById('favoritesBtn').textContent = isFavorite ? '🌟' : '⭐';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Demo mode for testing without API key
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Demo mode: Replace YOUR_API_KEY with your actual OpenWeatherMap API key');
    console.log('Get your free API key at: https://openweathermap.org/api');
}