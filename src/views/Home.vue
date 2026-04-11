<!-- src/views/Home.vue -->
<template>
  <div class="home">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <h1>发现你的下一个目的地</h1>
        <p>基于智能算法的个性化旅游推荐</p>
        <div class="search-box">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索城市、景点..."
            @keyup.enter="handleSearch"
          />
          <button @click="handleSearch">搜索</button>
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
              :src="
                spot.image || spot.photos?.[0]?.url || getPlaceholderImage()
              "
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useRecommendationStore } from "@/stores/recommendation";
import { amapAPI } from "@/api/amap";


const router = useRouter();
const userStore = useUserStore();
const recommendationStore = useRecommendationStore();

const searchKeyword = ref("");
const popularSpots = ref([]);
const allSpots = ref([]);

const recommendations = computed(() => recommendationStore.recommendations);

const isFavorite = (spotId) => {
  return userStore.favoriteIds.includes(spotId);
};

// 本地自定义占位图，仅在高德没有图片时使用
const getPlaceholderImage = () => {
  return '/default-placeholder.jpg'   // 项目public目录下自备占位图
}
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
    router.push(`/search?q=${encodeURIComponent(searchKeyword.value)}`);
  }
};

const goToDetail = (spot) => {
  router.push(`/detail/${spot.id}`);
};

const loadPopularSpots = async () => {
  // 加载热门城市景点
  const cities = ["北京", "上海", "南京", "杭州", "成都"];
  const spots = [];
  for (let city of cities) {
    const results = await amapAPI.searchScenicSpots(city, city, 1);
    spots.push(...results.slice(0, 3));
  }
  popularSpots.value = spots;
  allSpots.value = spots;

  // 获取图片
  for (let spot of spots) {
    // 只使用高德返回的高清图片
    if (spot.photos && spot.photos.length > 0) {
      spot.image = spot.photos[0].url; // 高德返回的图片字段就是高清
    } else {
      spot.image = getPlaceholderImage(); // 本地占位符，不要用Unsplash/picsum
    }
  }
};

const initRecommendations = async () => {
  await loadPopularSpots();

  // 生成个性化推荐
  if (userStore.isLoggedIn && allSpots.value.length) {
    await recommendationStore.generateRecommendations(allSpots.value);
  } else {
    // 未登录时显示热门推荐
    recommendationStore.recommendations = popularSpots.value.map((spot) => ({
      ...spot,
      score: 0.8,
      reason: "热门推荐",
    }));
  }
};

onMounted(() => {
  initRecommendations();
});
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 60px 40px;
  margin-bottom: 40px;
  text-align: center;
  color: white;
}

.welcome-banner h1 {
  font-size: 48px;
  margin-bottom: 16px;
}

.welcome-banner p {
  font-size: 18px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.search-box {
  display: flex;
  max-width: 500px;
  margin: 0 auto;
  gap: 10px;
}

.search-box input {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  outline: none;
}

.search-box button {
  padding: 12px 30px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.2s;
}

.search-box button:hover {
  transform: scale(1.05);
}

.section-header {
  margin-bottom: 30px;
}

.section-header h2 {
  font-size: 32px;
  margin-bottom: 8px;
}

.section-header p {
  color: #666;
}

.spots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
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
  top: 10px;
  left: 10px;
  background: #42b983;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.favorite-btn:hover {
  transform: scale(1.1);
}

.card-content {
  padding: 16px;
}

.card-content h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.location {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.tag {
  background: #f0f0f0;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 12px;
  color: #666;
}

.stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #999;
  margin-bottom: 10px;
}

.reason {
  color: #42b983;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 40px 20px;
  }

  .welcome-banner h1 {
    font-size: 32px;
  }

  .spots-grid {
    grid-template-columns: 1fr;
  }
}
</style>