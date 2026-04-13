<!-- src/views/Home.vue -->
<template>
  <div class="home">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="navbar-container">
        <div class="logo">🌍 Travel</div>
        <div class="nav-buttons">
          <button class="nav-btn" @click="navigateTo('/favorites')">
            <span class="icon">❤️</span> 收藏
          </button>
          <button class="nav-btn" @click="navigateTo('/chat')">
            <span class="icon">💬</span> 智能助手
          </button>
          <button class="nav-btn" @click="navigateTo('/weather')">
            <span class="icon">🌤️</span> 天气
          </button>
          <button class="nav-btn hotel-btn" @click="navigateTo('/hotel')">
            <span class="icon">🏨</span> 酒店预订
          </button>
          <button class="nav-btn flight-btn" @click="navigateTo('/flight')">
            <span class="icon">✈️</span> 机票预订
          </button>
        </div>
      </div>
    </nav>

    <!-- 轮播图区域 -->
    <div class="banner-carousel">
      <div class="carousel-container">
        <!-- 轮播图 -->
        <div class="carousel-slide" 
          v-for="(image, index) in carouselImages" 
          :key="index"
          :class="{ active: currentSlide === index }">
          <img :src="image.url" :alt="image.title" />
          <div class="slide-overlay">
            <div class="slide-text">
              <h3>{{ image.title }}</h3>
              <p>{{ image.description }}</p>
            </div>
          </div>
        </div>

        <!-- 轮播指示器 - 圆形圆点 -->
        <div class="carousel-indicators">
          <button
            v-for="(_, index) in carouselImages"
            :key="index"
            :class="{ active: currentSlide === index }"
            @click="currentSlide = index"
            class="indicator-dot"
            :title="`切换到第 ${index + 1} 张`"
          ></button>
        </div>

        <!-- 轮播控制按钮 -->
        <button class="carousel-control prev" @click="prevSlide">‹</button>
        <button class="carousel-control next" @click="nextSlide">›</button>
      </div>

      <!-- 搜索框覆盖在轮播图上 -->
      <div class="search-overlay">
        <h2>发现你的下一个目的地</h2>
        <p>基于智能算法的个性化旅游推荐</p>
        <div class="search-box">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索城市、景点..."
            @keyup.enter="handleSearch"
            @focus="showSearchSuggestions = true"
            @blur="setTimeout(() => showSearchSuggestions = false, 200)"
          />
          <button @click="handleSearch" class="search-btn">搜索</button>

          <!-- 智能搜索下拉建议 -->
          <div v-if="showSearchSuggestions" class="search-suggestions">
            <!-- 热门搜索 -->
            <div v-if="!searchKeyword && hotSearches.length" class="suggestion-group">
              <div class="group-title">🔥 热门搜索</div>
              <div
                v-for="keyword in hotSearches"
                :key="keyword"
                class="suggestion-item"
                @click="searchKeyword = keyword; handleSearch()"
              >
                {{ keyword }}
              </div>
            </div>

            <!-- 搜索历史 -->
            <div v-if="!searchKeyword && searchHistory.length" class="suggestion-group">
              <div class="group-title">⏱️ 搜索历史</div>
              <div
                v-for="keyword in searchHistory.slice(0, 5)"
                :key="keyword"
                class="suggestion-item"
                @click="searchKeyword = keyword; handleSearch()"
              >
                {{ keyword }}
              </div>
            </div>

            <!-- 模糊匹配结果 -->
            <div v-if="searchKeyword && fuzzyResults.length" class="suggestion-group">
              <div class="group-title">🔍 搜索结果</div>
              <div
                v-for="spot in fuzzyResults.slice(0, 5)"
                :key="spot.id"
                class="suggestion-item"
                @click="goToDetail(spot)"
              >
                {{ spot.name }} <span class="location-text">{{ spot.address }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 个性化推荐 -->
    <div class="recommendations-section" v-if="recommendations.length">
      <div class="section-header">
        <h2>🎯 为你推荐</h2>
        <p>基于你的浏览和收藏历史</p>
      </div>

      <div class="spots-grid">
        <div
          v-for="spot in recommendations"
          :key="spot.id"
          class="spot-card"
          @click="goToDetail(spot)"
        >
          <div class="card-image">
            <img
              :src="spot.image || spot.photos?.[0]?.url || getPlaceholderImage()"
              :alt="spot.name"
            />
            <div class="match-badge" v-if="spot.score">
              {{ Math.round(spot.score * 100) }}% 匹配
            </div>
            <button class="favorite-btn" @click.stop="toggleFavorite(spot)">
              {{ isFavorite(spot.id) ? "❤️" : "🤍" }}
            </button>
          </div>
          <div class="card-content">
            <h3>{{ spot.name }}</h3>
            <p class="location">{{ spot.address || spot.cityname }}</p>
            <div class="tags">
              <span v-for="tag in spot.tags" :key="tag" class="tag">{{
                tag
              }}</span>
            </div>
            <div class="stats">
              <span>⭐ {{ spot.rating || 4.5 }}</span>
              <span>💬 {{ spot.comments || 0 }} 评论</span>
            </div>
            <p class="reason">{{ spot.reason || "热门推荐" }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门目的地 -->
    <div class="destinations-section">
      <div class="section-header">
        <h2>🌟 热门目的地</h2>
        <p>最受欢迎的旅游城市</p>
      </div>

      <div class="destinations-grid">
        <div
          v-for="city in popularDestinations"
          :key="city.id"
          class="destination-card"
          @click="searchByCity(city.name)"
        >
          <img :src="city.image" :alt="city.name" />
          <div class="destination-info">
            <h3>{{ city.name }}</h3>
            <p>{{ city.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐路线 -->
    <div class="routes-section">
      <div class="section-header">
        <h2>🗺️ 推荐路线</h2>
        <p>精选旅游路线</p>
      </div>

      <div class="routes-grid">
        <div
          v-for="route in recommendedRoutes"
          :key="route.id"
          class="route-card"
        >
          <div class="route-header">
            <h3>{{ route.name }}</h3>
            <span class="duration">{{ route.duration }}天</span>
          </div>
          <p class="route-description">{{ route.description }}</p>
          <div class="route-cities">
            <span v-for="city in route.cities" :key="city" class="city-tag">
              {{ city }}
            </span>
          </div>
          <div class="route-footer">
            <span class="price">¥{{ route.price }}</span>
            <button class="detail-btn" @click="viewRouteDetail(route)">查看详情</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主题分类 -->
    <div class="categories-section">
      <div class="section-header">
        <h2>🎨 主题分类</h2>
        <p>按主题探索旅游目地</p>
      </div>

      <div class="categories-grid">
        <div
          v-for="category in travelCategories"
          :key="category.id"
          class="category-card"
          @click="searchByCategory(category.name)"
        >
          <div class="category-icon">{{ category.icon }}</div>
          <h3>{{ category.name }}</h3>
          <p>{{ category.count }} 个景点</p>
        </div>
      </div>
    </div>

    <!-- 热门景点 -->
    <div class="popular-section">
      <div class="section-header">
        <h2>🔥 热门景点</h2>
        <p>大家都在看</p>
      </div>

      <div class="spots-grid">
        <div
          v-for="spot in popularSpots"
          :key="spot.id"
          class="spot-card"
          @click="goToDetail(spot)"
        >
          <div class="card-image">
            <img :src="spot.image || getPlaceholderImage()" :alt="spot.name" />
          </div>
          <div class="card-content">
            <h3>{{ spot.name }}</h3>
            <p class="location">{{ spot.address }}</p>
            <div class="stats">
              <span>⭐ {{ spot.rating || 4.5 }}</span>
              <span>👀 {{ spot.views || 0 }} 浏览</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useRecommendationStore } from "@/stores/recommendation";
import { amapAPI } from "@/api/amap";

const router = useRouter();
const userStore = useUserStore();
const recommendationStore = useRecommendationStore();

const searchKeyword = ref("");
const showSearchSuggestions = ref(false);
const popularSpots = ref([]);
const allSpots = ref([]);
const currentSlide = ref(0);
let carouselTimer = null;

// ========== 轮播图配置 ==========
// 支持在线图片URL - 推荐使用这种方式
const carouselImages = ref([
  {
    title: "古都风韵",
    description: "探索历史文化名城",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop"
  },
  {
    title: "江南水乡",
    description: "感受诗意的古镇风情",
    url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop"
  },
  {
    title: "山水风景",
    description: "领略大自然的壮美",
    url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=400&fit=crop"
  },
  {
    title: "海滨度假",
    description: "享受碧海蓝天的惬意",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop"
  }
]);

// 热门搜索关键词
const hotSearches = ref([
  "北京",
  "上海",
  "杭州",
  "南京",
  "成都",
  "西安",
  "苏州",
]);

// 搜索历史
const searchHistory = computed(() => userStore.searchHistory || []);

// 热门目的地
const popularDestinations = ref([
  {
    id: 1,
    name: "北京",
    description: "帝都文化之旅",
    image: "https://images.unsplash.com/photo-1508747755944-15f163d1047b?w=300&h=250&fit=crop"
  },
  {
    id: 2,
    name: "上海",
    description: "魔都现代生活",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&h=250&fit=crop"
  },
  {
    id: 3,
    name: "杭州",
    description: "江南诗意古城",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&h=250&fit=crop"
  },
  {
    id: 4,
    name: "南京",
    description: "历史文化名城",
    image: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=300&h=250&fit=crop"
  },
  {
    id: 5,
    name: "成都",
    description: "天府之国休闲游",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=250&fit=crop"
  },
]);

// 推荐路线
const recommendedRoutes = ref([
  {
    id: 1,
    name: "江南古城3日游",
    description: "感受江南水乡的诗意",
    cities: ["杭州", "苏州", "南京"],
    duration: 3,
    price: 1299,
  },
  {
    id: 2,
    name: "西部探险5日游",
    description: "探索西部自然风光",
    cities: ["成都", "拉萨", "香格里拉"],
    duration: 5,
    price: 2499,
  },
  {
    id: 3,
    name: "北京深度游4日游",
    description: "领略帝都文化底蕴",
    cities: ["北京", "八达岭", "颐和园"],
    duration: 4,
    price: 1899,
  },
]);

// 旅游主题分类
const travelCategories = ref([
  { id: 1, name: "文化古迹", icon: "🏛️", count: 1234 },
  { id: 2, name: "自然风景", icon: "🏔️", count: 2156 },
  { id: 3, name: "美食体验", icon: "🍜", count: 891 },
  { id: 4, name: "冒险运动", icon: "🚴", count: 567 },
  { id: 5, name: "海滨度假", icon: "🏖️", count: 743 },
  { id: 6, name: "亲子游", icon: "👨‍👩‍👧‍👦", count: 892 },
]);

const recommendations = computed(() => recommendationStore.recommendations);

// 模糊搜索结果
const fuzzyResults = computed(() => {
  if (!searchKeyword.value) return [];
  const keyword = searchKeyword.value.toLowerCase();
  return allSpots.value.filter(
    (spot) =>
      spot.name.toLowerCase().includes(keyword) ||
      spot.address?.toLowerCase().includes(keyword)
  );
});

// ========== 轮播逻辑 ==========
const startCarouselAutoPlay = () => {
  carouselTimer = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % carouselImages.value.length;
  }, 5000);
};

const stopCarouselAutoPlay = () => {
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
};

const prevSlide = () => {
  currentSlide.value =
    (currentSlide.value - 1 + carouselImages.value.length) %
    carouselImages.value.length;
  stopCarouselAutoPlay();
  startCarouselAutoPlay();
};

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % carouselImages.value.length;
  stopCarouselAutoPlay();
  startCarouselAutoPlay();
};

// ========== 其他逻辑 ==========
const isFavorite = (spotId) => {
  return userStore.favoriteIds.includes(spotId);
};

const getPlaceholderImage = () => {
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop";
};

const toggleFavorite = (spot) => {
  if (isFavorite(spot.id)) {
    userStore.removeFavorite(spot.id);
  } else {
    userStore.addFavorite(spot);
  }
};

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    userStore.addSearchHistory(searchKeyword.value);
    showSearchSuggestions.value = false;
    router.push(`/search?q=${encodeURIComponent(searchKeyword.value)}`);
  }
};

const goToDetail = (spot) => {
  router.push(`/detail/${spot.id}`);
};

const navigateTo = (path) => {
  router.push(path);
};

const searchByCity = (cityName) => {
  searchKeyword.value = cityName;
  handleSearch();
};

const searchByCategory = (categoryName) => {
  searchKeyword.value = categoryName;
  handleSearch();
};

const viewRouteDetail = (route) => {
  console.log("查看路线详情:", route);
};

const loadPopularSpots = async () => {
  const cities = ["北京", "上海", "南京", "杭州", "成都"];
  const spots = [];
  for (let city of cities) {
    const results = await amapAPI.searchScenicSpots(city, city, 1);
    spots.push(...results.slice(0, 3));
  }
  popularSpots.value = spots;
  allSpots.value = spots;

  for (let spot of spots) {
    if (spot.photos && spot.photos.length > 0) {
      spot.image = spot.photos[0].url;
    } else {
      spot.image = getPlaceholderImage();
    }
  }
};

const initRecommendations = async () => {
  await loadPopularSpots();

  if (userStore.isLoggedIn && allSpots.value.length) {
    await recommendationStore.generateRecommendations(allSpots.value);
  } else {
    recommendationStore.recommendations = popularSpots.value.map((spot) => ({
      ...spot,
      score: 0.8,
      reason: "热门推荐",
    }));
  }
};

onMounted(() => {
  initRecommendations();
  startCarouselAutoPlay();
});

onUnmounted(() => {
  stopCarouselAutoPlay();
});
</script>

<style scoped>
.home {
  width: 100%;
  overflow-x: hidden;
}

/* ========== 导航栏样式 ========== */
.navbar {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 40px;
  gap: 20px;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  justify-content: flex-end;
}

.nav-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.nav-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.hotel-btn,
.flight-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-weight: 600;
}

.hotel-btn:hover,
.flight-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.icon {
  font-size: 16px;
}

/* ========== 轮播图区域 ========== */
.banner-carousel {
  position: relative;
  width: 100%;
  height: 450px;
  overflow: hidden;
  background: #f5f5f5;
}

.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.carousel-slide {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
}

.carousel-slide.active {
  opacity: 1;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.slide-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
  color: white;
  padding: 40px 20px 20px;
  text-align: center;
}

.slide-text h3 {
  font-size: 24px;
  margin-bottom: 8px;
}

.slide-text p {
  font-size: 14px;
  opacity: 0.9;
}

/* 轮播指示器 - 圆形圆点 */
.carousel-indicators {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.indicator-dot:hover {
  background: rgba(255, 255, 255, 0.8);
}

.indicator-dot.active {
  background: white;
  width: 32px;
  border-radius: 6px;
}

/* 轮播控制按钮 */
.carousel-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.carousel-control:hover {
  background: rgba(0, 0, 0, 0.6);
}

.carousel-control.prev {
  left: 20px;
}

.carousel-control.next {
  right: 20px;
}

/* 搜索框覆盖层 */
.search-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  width: 90%;
  max-width: 700px;
  z-index: 8;
}

.search-overlay h2 {
  font-size: 36px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  font-weight: 700;
}

.search-overlay p {
  font-size: 16px;
  margin-bottom: 25px;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.search-box {
  position: relative;
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 6px;
  border-radius: 30px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.search-box input {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
  color: #333;
}

.search-box input::placeholder {
  color: #999;
}

.search-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: transform 0.2s;
  white-space: nowrap;
}

.search-btn:hover {
  transform: scale(1.05);
}

/* 智能搜索下拉建议 */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 12px 12px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 20;
  margin-top: -8px;
  padding-top: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.suggestion-group {
  padding: 8px 0;
}

.group-title {
  padding: 8px 16px;
  font-size: 12px;
  color: #999;
  font-weight: 600;
  text-transform: uppercase;
}

.suggestion-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
  color: #333;
  font-size: 14px;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.location-text {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}

/* ========== 页面章节 ========== */
.recommendations-section,
.popular-section,
.destinations-section,
.routes-section,
.categories-section {
  max-width: 1400px;
  margin: 60px auto;
  padding: 0 40px;
}

.section-header {
  margin-bottom: 40px;
}

.section-header h2 {
  font-size: 32px;
  margin-bottom: 8px;
  color: #333;
}

.section-header p {
  color: #999;
  font-size: 16px;
}

/* 热门目的地 */
.destinations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.destination-card {
  position: relative;
  height: 250px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.destination-card:hover {
  transform: scale(1.05);
}

.destination-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.destination-card:hover img {
  transform: scale(1.1);
}

.destination-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
  color: white;
  padding: 20px;
}

.destination-info h3 {
  font-size: 18px;
  margin-bottom: 4px;
}

.destination-info p {
  font-size: 12px;
  opacity: 0.9;
}

/* 推荐路线 */
.routes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 50px;
}

.route-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s;
}

.route-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.route-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.duration {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.route-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.route-cities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.city-tag {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #667eea;
}

.route-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}

.detail-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 14px;
}

.detail-btn:hover {
  transform: scale(1.05);
}

/* 主题分类 */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.category-card {
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.category-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.category-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.category-card h3 {
  font-size: 16px;
  margin-bottom: 4px;
  color: #333;
}

.category-card p {
  font-size: 12px;
  color: #999;
}

/* 景点卡片 */
.spots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 50px;
}

.spot-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.spot-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.spot-card:hover .card-image img {
  transform: scale(1.1);
}

.match-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #42b983 0%, #2ecc71 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.favorite-btn:hover {
  transform: scale(1.15);
}

.card-content {
  padding: 16px;
}

.card-content h3 {
  font-size: 18px;
  margin-bottom: 8px;
  color: #333;
}

.location {
  color: #999;
  font-size: 13px;
  margin-bottom: 10px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag {
  background: #f0f0f0;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  color: #666;
}

.stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.reason {
  color: #667eea;
  font-size: 13px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .navbar-container {
    padding: 12px 24px;
  }

  .nav-buttons {
    gap: 8px;
  }

  .nav-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .banner-carousel {
    height: 350px;
  }

  .search-overlay h2 {
    font-size: 28px;
  }

  .recommendations-section,
  .popular-section,
  .destinations-section,
  .routes-section,
  .categories-section {
    margin: 40px auto;
    padding: 0 24px;
  }

  .spots-grid,
  .destinations-grid,
  .routes-grid,
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .navbar {
    position: relative;
  }

  .navbar-container {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .nav-buttons {
    width: 100%;
    justify-content: center;
  }

  .banner-carousel {
    height: 280px;
  }

  .search-overlay h2 {
    font-size: 22px;
  }

  .search-overlay p {
    font-size: 13px;
    margin-bottom: 15px;
  }

  .search-box {
    flex-direction: column;
    gap: 10px;
  }

  .search-box input,
  .search-btn {
    width: 100%;
  }

  .carousel-control {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .indicator-dot.active {
    width: 24px;
  }

  .spots-grid,
  .destinations-grid,
  .routes-grid,
  .categories-grid {
    grid-template-columns: 1fr;
  }

  .recommendations-section,
  .popular-section,
  .destinations-section,
  .routes-section,
  .categories-section {
    margin: 30px auto;
    padding: 0 16px;
  }

  .section-header h2 {
    font-size: 24px;
  }
}
</style>