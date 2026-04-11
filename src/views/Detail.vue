<template>
  <div class="detail" v-if="spot">
    <!-- 图片轮播 -->
    <div class="image-gallery">
      <div class="main-image">
        <img :src="currentImage" :alt="spot.name">
        <button class="favorite-btn" @click="toggleFavorite">
          {{ isFavorite ? '❤️' : '🤍' }}
        </button>
      </div>
      <div class="thumbnail-list">
        <div 
          v-for="(img, index) in images" 
          :key="index"
          class="thumbnail"
          :class="{ active: currentIndex === index }"
          @click="currentIndex = index"
        >
          <img :src="img.thumb || img.url" :alt="spot.name">
        </div>
      </div>
    </div>

    <!-- 景点信息 -->
    <div class="info-section">
      <h1>{{ spot.name }}</h1>
      <div class="rating">
        <span class="stars">⭐ {{ spot.rating || 4.5 }}</span>
        <span class="comments">{{ spot.comments || 0 }} 条评论</span>
      </div>
      <p class="address">📍 {{ spot.address }}</p>
      <p class="tel" v-if="spot.tel">📞 {{ spot.tel }}</p>
      
      <!-- 评分组件 -->
      <div class="rating-section">
        <h3>你的评分</h3>
        <div class="stars-input">
          <span 
            v-for="star in 5" 
            :key="star"
            class="star"
            :class="{ active: star <= userRating }"
            @click="rateSpot(star)"
          >
            ★
          </span>
        </div>
      </div>
      
      <!-- 智能路线规划 -->
      <div class="route-section">
        <div class="route-header">
          <h3>智能路线规划</h3>
          <button 
            class="generate-btn" 
            @click="generateRoute"
            :disabled="routeLoading"
          >
            {{ routeLoading ? '生成中...' : '一键生成游玩路线' }}
          </button>
        </div>
        <div v-if="routeLoading" class="route-loading">
          <div class="small-spinner"></div>
          <span>正在为你规划最佳路线...</span>
        </div>
        <div v-if="routeText" class="route-content">
          <pre class="route-text">{{ routeText }}</pre>
        </div>
      </div>

      <!-- 地图定位 & 导航（仅保留高德） -->
      <div class="map-section">
        <h3>地图定位 & 导航</h3>
        <div id="map-container" ref="mapRef"></div>
        <div class="map-buttons">
          <button class="nav-btn" @click="openAmapNav">
            🗺️ 打开高德地图导航
          </button>
        </div>
      </div>
      
      <!-- 景点描述 -->
      <div class="description">
        <h3>景点介绍</h3>
        <p>{{ spot.description || '这是一个美丽的旅游景点，拥有独特的自然风光和深厚的文化底蕴。无论是家庭出游还是朋友结伴，都是理想的选择。' }}</p>
      </div>
      
      <!-- 实用信息 -->
      <div class="tips">
        <h3>游玩贴士</h3>
        <ul>
          <li>🕐 开放时间：08:00 - 17:30</li>
          <li>💰 门票价格：根据季节变化</li>
          <li>🚌 交通方式：公交、地铁均可到达</li>
          <li>⏰ 建议游玩时间：2-3小时</li>
        </ul>
      </div>
      
      <!-- 评论区 -->
      <div class="comments-section">
        <h3>用户评论</h3>
        <div class="comment" v-for="comment in comments" :key="comment.id">
          <img :src="comment.avatar" class="comment-avatar">
          <div class="comment-content">
            <div class="comment-user">{{ comment.user }}</div>
            <div class="comment-rating">⭐ {{ comment.rating }}</div>
            <div class="comment-text">{{ comment.content }}</div>
            <div class="comment-date">{{ comment.date }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="loading">
    <div class="spinner"></div>
    <p>加载中...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { amapAPI } from '@/api/amap'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const spot = ref(null)
const images = ref([])
const currentIndex = ref(0)
const userRating = ref(0)

// 路线规划
const routeLoading = ref(false)
const routeText = ref('')

// 地图相关（仅高德）
const mapRef = ref(null)
let mapInstance = null

// 🔴 核心修复：上海文化广场真实经纬度 + 合理缩放级别
const spotLocation = ref({
  lng: 121.4750,
  lat: 31.2200
})

// 加载高德地图 JSAPI（兼容1.4.15稳定版，彻底解决2.0空白问题）
const loadMapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap)
      return
    }
    const script = document.createElement('script')
    script.type = 'text/javascript'
    // 改用1.4.15稳定版，兼容性拉满，本地开发零问题
    script.src = 'https://webapi.amap.com/maps?v=1.4.15&key=93c11045cc3f46952d0929f44d7a111e&plugin=AMap.Scale,AMap.ToolBar'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
        resolve(window.AMap)
      })
    }
    script.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(script)
  })
}

// 🔴 核心修复：初始化地图，设置合理缩放级别
const initMap = async () => {
  if (!spot.value) return
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 500))
  if (!mapRef.value) return

  try {
    const AMap = await loadMapScript()
    
    // 初始化地图：zoom=16（城市街景级，清晰显示建筑，避免10米级空白）
    mapInstance = new AMap.Map(mapRef.value, {
      zoom: 16,
      center: [spotLocation.value.lng, spotLocation.value.lat],
      resizeEnable: true,
      showLabel: true,
      viewMode: '2D'
    })

    // 添加比例尺、工具栏
    mapInstance.addControl(new AMap.Scale({ position: 'LB' }))
    mapInstance.addControl(new AMap.ToolBar({ position: 'RB' }))

    // 添加景点标记点
    const marker = new AMap.Marker({
      position: [spotLocation.value.lng, spotLocation.value.lat],
      title: spot.value.name
    })
    marker.setMap(mapInstance)

    // 添加信息窗体
    const infoWindow = new AMap.InfoWindow({
      content: `<div style="padding:10px;font-weight:bold">${spot.value.name}</div>`
    })
    infoWindow.open(mapInstance, marker.getPosition())

    // 强制地图渲染
    mapInstance.setFitView()
  } catch (err) {
    console.error('地图初始化失败:', err)
  }
}

// 打开高德地图导航
const openAmapNav = () => {
  const { lng, lat } = spotLocation.value
  const url = `https://ditu.amap.com/regeo?lng=${lng}&lat=${lat}&name=${encodeURIComponent(spot.value.name)}`
  window.open(url, '_blank')
}

const generateRoute = async () => {
  if (!spot.value) return
  routeLoading.value = true
  routeText.value = ''

  try {
    await new Promise(resolve => setTimeout(resolve, 1200))
    routeText.value = `【${spot.value.name} 游玩路线规划】

1. 入园 → 核心景观区（建议30分钟）
2. 文化体验区（建议40分钟）
3. 休闲观景步道（建议50分钟）
4. 特色打卡点（建议30分钟）
5. 出口返程

🕒 总耗时：约2.5～3小时
✅ 路线特点：轻松不累、看点密集
`
  } catch (err) {
    routeText.value = '路线生成失败，请稍后重试'
  } finally {
    routeLoading.value = false
  }
}

const currentImage = computed(() => {
  return images.value[currentIndex.value]?.url || images.value[0]?.url || ''
})

const isFavorite = computed(() => {
  return userStore.favoriteIds.includes(route.params.id)
})

const comments = ref([
  {
    id: 1,
    user: '旅行达人',
    avatar: 'https://i.pravatar.cc/150?u=1',
    rating: 5,
    content: '非常棒的景点，值得一游！风景优美，服务也很好。',
    date: '2024-01-15'
  },
  {
    id: 2,
    user: '背包客',
    avatar: 'https://i.pravatar.cc/150?u=2',
    rating: 4,
    content: '景色不错，就是人有点多，建议避开节假日。',
    date: '2024-01-10'
  }
])

const toggleFavorite = () => {
  if (isFavorite.value) {
    userStore.removeFavorite(route.params.id)
  } else {
    userStore.addFavorite(spot.value)
  }
}

const rateSpot = (rating) => {
  userRating.value = rating
  userStore.addRating(route.params.id, rating)
}

const loadSpotDetail = async () => {
  const id = route.params.id
  const detail = await amapAPI.getSpotDetail(id)
  if (detail) {
    spot.value = detail
    
    // 优先使用接口返回的真实经纬度
    if (detail.location) {
      const [lng, lat] = detail.location.split(',').map(Number)
      spotLocation.value = { lng, lat }
    }

    // ==============================================
    // 👇 核心：从高德 POI 拿真实景点图片（不影响任何功能）
    // ==============================================
    let amapImages = []
    if (detail.photos && detail.photos.length > 0) {
      amapImages = detail.photos.map(img => ({
        url: img.url,
        thumb: img.url
      }))
    }

    // 高德有图用高德，没图兜底（不破坏界面）
    // images.value = amapImages.length ? amapImages : [
    //   { url: `https://picsum.photos/800/600?random=1`, thumb: `https://picsum.photos/400/300?random=1` },
    //   { url: `https://picsum.photos/800/600?random=2`, thumb: `https://picsum.photos/400/300?random=2` }
    // ]

    images.value = spot.photos?.map(photo => photo.url) ?? [
      { url: `https://picsum.photos/800/600?random=1`, thumb: `https://picsum.photos/400/300?random=1` },
      { url: `https://picsum.photos/800/600?random=2`, thumb: `https://picsum.photos/400/300?random=2` }
    ]

    const existingRating = userStore.getRating(id)
    if (existingRating) userRating.value = existingRating

    // 初始化地图
    initMap()
  }
}

onMounted(() => {
  loadSpotDetail()
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style scoped>
.detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.image-gallery {
  margin-bottom: 30px;
}

.main-image {
  position: relative;
  height: 500px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.thumbnail-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.thumbnail {
  width: 100px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.thumbnail.active {
  opacity: 1;
  border: 2px solid #42b983;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-section {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.info-section h1 {
  font-size: 32px;
  margin-bottom: 16px;
}

.rating {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  color: #666;
}

.rating-section {
  margin: 20px 0;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
}

.stars-input {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.star {
  font-size: 30px;
  cursor: pointer;
  color: #ddd;
  transition: color 0.2s;
}

.star.active {
  color: #ffc107;
}

.star:hover {
  color: #ffc107;
}

/* 路线规划 */
.route-section {
  margin: 30px 0;
  padding: 24px;
  background: #fcfcfc;
  border-radius: 12px;
  border: 1px dashed #42b983;
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.generate-btn {
  padding: 8px 16px;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.generate-btn:disabled {
  background: #ccc;
}

.route-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
}

.small-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #eee;
  border-top: 2px solid #42b983;
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

.route-text {
  white-space: pre-wrap;
  line-height: 1.7;
  padding: 16px;
  background: #f6f6f6;
  border-radius: 8px;
}

/* 地图样式 */
.map-section {
  margin: 30px 0;
}

#map-container {
  width: 100%;
  height: 380px;
  border-radius: 12px;
  border: 1px solid #eee;
  margin-bottom: 16px;
  background: #f5f5f5;
}

.map-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 10px 20px;
  background: #217bf5;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.nav-btn:hover {
  opacity: 0.9;
}

.description, .tips, .comments-section {
  margin-top: 30px;
}

.description h3, .tips h3, .comments-section h3 {
  font-size: 20px;
  margin-bottom: 15px;
}

.description p {
  line-height: 1.6;
  color: #666;
}

.tips ul {
  list-style: none;
  padding: 0;
}

.tips li {
  padding: 8px 0;
  color: #666;
}

.comment {
  display: flex;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.comment-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.comment-content {
  flex: 1;
}

.comment-user {
  font-weight: bold;
  margin-bottom: 5px;
}

.comment-rating {
  color: #ffc107;
  margin-bottom: 5px;
}

.comment-text {
  color: #666;
  margin-bottom: 5px;
}

.comment-date {
  color: #999;
  font-size: 12px;
}

.loading {
  text-align: center;
  padding: 100px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .main-image {
    height: 300px;
  }
  .info-section h1 {
    font-size: 24px;
  }
  #map-container {
    height: 280px;
  }
}
</style>