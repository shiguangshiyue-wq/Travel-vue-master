<!-- src/views/Search.vue -->
<template>
  <div class="search-page">
    <div class="search-header">
      <input 
        v-model="keyword"
        type="text" 
        placeholder="搜索景点、城市..."
        @keyup.enter="handleSearch"
      >
      <button @click="handleSearch">搜索</button>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="results.length" class="results">
      <h2>找到 {{ results.length }} 个结果</h2>
      <div class="spots-grid">
        <div 
          v-for="spot in results" 
          :key="spot.id"
          class="spot-card"
          @click="goToDetail(spot)"
        >
          <img :src="spot.image || getPlaceholderImage()" :alt="spot.name">
          <div class="info">
            <h3>{{ spot.name }}</h3>
            <p>{{ spot.address }}</p>
            <div class="stats">
              <span>⭐ {{ spot.rating || 4.5 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty">
      <p>没有找到相关结果</p>
      <p class="suggestion">试试其他关键词吧~</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { amapAPI } from '@/api/amap'
import { unsplashAPI } from '@/api/unsplash'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const results = ref([])
const loading = ref(false)

const getPlaceholderImage = () => {
  return `https://picsum.photos/400/300?random=${Math.random()}`
}

const handleSearch = async () => {
  if (!keyword.value.trim()) return
  
  loading.value = true
  try {
    const spots = await amapAPI.searchScenicSpots(keyword.value)
    results.value = spots
    
    // 获取图片
    for (let spot of results.value) {
      const images = await unsplashAPI.searchTravelImages(spot.name, 1)
      if (images.length) {
        spot.image = images[0].thumb
      }
    }
  } catch (error) {
    console.error('搜索失败', error)
  } finally {
    loading.value = false
  }
}

const goToDetail = (spot) => {
  router.push(`/detail/${spot.id}`)
}

onMounted(() => {
  if (route.query.q) {
    keyword.value = route.query.q
    handleSearch()
  }
})
</script>

<style scoped>
.search-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-header {
  display: flex;
  gap: 15px;
  margin-bottom: 40px;
}

.search-header input {
  flex: 1;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.search-header button {
  padding: 15px 30px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.spots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.spot-card {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.spot-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.spot-card img {
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.spot-card .info {
  padding: 12px;
  flex: 1;
}

.spot-card h3 {
  margin-bottom: 8px;
  font-size: 16px;
}

.spot-card p {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.stats {
  color: #999;
  font-size: 12px;
}

.loading, .empty {
  text-align: center;
  padding: 50px;
  color: #666;
}

.suggestion {
  margin-top: 10px;
  color: #999;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>