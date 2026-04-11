<template>
  <div class="weather">
    <div class="search-container">
      <input
        v-model="city"
        type="text"
        placeholder="输入城市名称"
        @keyup.enter="searchWeather"
      >
      <button @click="searchWeather">搜索</button>
    </div>

    <div v-if="currentWeather" class="weather-content">
      <div class="current-weather">
        <div class="city-info">
          <h2>{{ currentWeather.city }}</h2>
          <div class="temp-info">
            <span class="temp">{{ currentWeather.daytemp }}°C</span>
            <span class="temp-range">{{ currentWeather.daytemp }}°/{{ currentWeather.nighttemp }}°C</span>
          </div>
          <div class="details">
            <p>湿度: {{ currentWeather.humidity }}%</p>
            <p>空气质量: {{ currentWeather.aqi }}</p>
            <p>风力: {{ currentWeather.windLevel }}</p>
          </div>
        </div>
      </div>

      <div class="forecast">
        <h3>未来五日天气</h3>
        <div class="forecast-list">
          <div v-for="day in forecast.slice(0, 5)" :key="day.date" class="forecast-item">
            <p class="date">{{ day.date }}</p>
            <p class="temp">{{ day.daytemp }}°/{{ day.nighttemp }}°C</p>
            <p class="humidity">湿度: {{ day.humidity }}%</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { amapAPI } from '@/api/amap'

const city = ref('北京')
const currentWeather = ref(null)
const forecast = ref([])
const loading = ref(false)
const error = ref('')

const searchWeather = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await amapAPI.getWeather(city.value)
    if (data && data.forecasts && data.forecasts.length > 0) {
      const forecastData = data.forecasts[0]
      currentWeather.value = {
        city: forecastData.city,
        daytemp: forecastData.casts[0].daytemp,
        nighttemp: forecastData.casts[0].nighttemp,
        humidity: Math.floor(Math.random() * 30 + 50), // 模拟湿度 50-80%
        aqi: ['优', '良', '轻度污染', '中度污染'][Math.floor(Math.random() * 4)], // 模拟空气质量
        windLevel: getWindLevel(forecastData.casts[0].daypower)
      }
      forecast.value = forecastData.casts.map(cast => ({
        date: cast.date,
        daytemp: cast.daytemp,
        nighttemp: cast.nighttemp,
        humidity: Math.floor(Math.random() * 30 + 50) // 模拟湿度
      }))
    } else {
      error.value = '未找到该城市的天气信息'
    }
  } catch (err) {
    error.value = '获取天气失败，请重试'
  }
  loading.value = false
}

const getWindLevel = (power) => {
  const p = parseInt(power)
  if (p === 0) return '无'
  if (p <= 3) return '弱'
  return '强'
}

onMounted(() => {
  searchWeather()
})
</script>

<style scoped>
.weather {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-container {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.search-container input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.search-container button {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-container button:hover {
  background: #369870;
}

.weather-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.current-weather {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  display: flex;
  justify-content: flex-start;
}

.city-info h2 {
  margin-bottom: 10px;
  font-size: 24px;
}

.temp-info {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 15px;
}

.temp {
  font-size: 48px;
  font-weight: bold;
}

.temp-range {
  font-size: 18px;
  opacity: 0.8;
}

.details {
  display: flex;
  gap: 20px;
}

.details p {
  margin: 0;
  font-size: 14px;
}

.forecast {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.forecast h3 {
  margin-bottom: 20px;
  color: #333;
}

.forecast-list {
  display: flex;
  gap: 15px;
  overflow-x: auto;
}

.forecast-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  min-width: 120px;
}

.forecast-item .date {
  font-weight: bold;
  margin-bottom: 10px;
  color: #666;
}

.forecast-item .temp {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.forecast-item .humidity {
  font-size: 12px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.error {
  text-align: center;
  padding: 20px;
  color: #e74c3c;
  background: #fdf2f2;
  border-radius: 4px;
}
</style>