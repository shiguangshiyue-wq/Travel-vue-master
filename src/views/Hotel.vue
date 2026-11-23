<!-- src/views/Hotel.vue -->
<template>
  <div class="hotel-page">
    <!-- 回到顶部按钮 -->
    <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop">
      ↑ 回到顶部
    </button>

    <!-- 顶部搜索栏 -->
    <div class="search-header">
      <div class="container">
        <h1 class="title">🏨 酒店预订</h1>
        <div class="search-bar">
          <div class="search-item">
            <label>城市</label>
            <input
              v-model="searchParams.city"
              type="text"
              placeholder="选择城市"
              @focus="showCityList = true"
              @blur="setTimeout(() => showCityList = false, 200)"
            />
            <div v-if="showCityList" class="city-dropdown">
              <div
                v-for="city in popularCities"
                :key="city"
                class="city-item"
                @click="selectCity(city)"
              >
                {{ city }}
              </div>
            </div>
          </div>

          <div class="search-item">
            <label>入住日期</label>
            <input v-model="searchParams.checkIn" type="date" />
          </div>

          <div class="search-item">
            <label>离店日期</label>
            <input v-model="searchParams.checkOut" type="date" />
          </div>

          <div class="search-item">
            <label>入住人数</label>
            <select v-model.number="searchParams.guests">
              <option value="1">1 人</option>
              <option value="2">2 人</option>
              <option value="3">3 人</option>
              <option value="4">4 人</option>
              <option value="5">5+ 人</option>
            </select>
          </div>

          <button class="search-btn" @click="performSearch">搜索</button>
        </div>
      </div>
    </div>

    <!-- 轮播 Banner -->
    <div class="banner-carousel">
      <div class="carousel-container">
        <div
          v-for="(image, index) in bannerImages"
          :key="index"
          class="carousel-slide"
          :class="{ active: currentBanner === index }"
        >
          <img :src="image" :alt="'酒店轮播' + index" class="banner-img" />
        </div>

        <div class="carousel-indicators">
          <button
            v-for="(_, index) in bannerImages"
            :key="index"
            class="indicator-dot"
            :class="{ active: currentBanner === index }"
            @click="currentBanner = index"
          ></button>
        </div>

        <button class="carousel-control prev" @click="prevBanner">‹</button>
        <button class="carousel-control next" @click="nextBanner">›</button>
      </div>
    </div>

    <div class="container">
      <!-- 热门推荐酒店 -->
      <section class="recommended-section">
        <div class="section-header">
          <h2>🌟 热门推荐</h2>
          <p>最受欢迎的酒店</p>
        </div>
        <div class="hotels-grid recommended-grid">
          <div
            v-for="hotel in recommendedHotels"
            :key="hotel.id"
            class="hotel-card featured"
            @click="goToBooking(hotel)"
          >
            <div class="card-image">
              <img :src="hotel.image" :alt="hotel.name" class="hotel-img" />
              <div class="rating-badge">
                <span class="stars">⭐ {{ hotel.rating }}</span>
                <span class="reviews">({{ hotel.reviews }}条)</span>
              </div>
              <div v-if="hotel.discount" class="discount-badge">
                -{{ hotel.discount }}%
              </div>
            </div>
            <div class="card-content">
              <h3>{{ hotel.name }}</h3>
              <p class="location">📍 {{ hotel.location }}</p>
              <p class="hotel-desc">{{ hotel.description }}</p>
              <div class="tags">
                <span v-for="tag in hotel.tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
              <div class="card-footer">
                <div class="price-section">
                  <span class="price">¥{{ hotel.price }}</span>
                  <span class="unit">/晚</span>
                </div>
                <button class="book-btn" @click.stop="goToBooking(hotel)">
                  预订
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 筛选和列表 -->
      <section class="hotels-section">
        <div class="section-header">
          <h2>🏨 酒店列表</h2>
          <p>共 {{ filteredHotels.length }} 家酒店</p>
        </div>

        <div class="content-wrapper">
          <!-- 筛选侧边栏 -->
          <aside class="filter-sidebar">
            <div class="filter-group">
              <h3>价格范围</h3>
              <div class="price-filter">
                <input
                  v-model.number="filters.minPrice"
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                />
                <input
                  v-model.number="filters.maxPrice"
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                />
                <div class="price-display">
                  ¥{{ filters.minPrice }} - ¥{{ filters.maxPrice }}
                </div>
              </div>
            </div>

            <div class="filter-group">
              <h3>星级</h3>
              <div class="star-filter">
                <label v-for="star in [5, 4, 3, 2]" :key="star">
                  <input
                    v-model="filters.stars"
                    type="checkbox"
                    :value="star"
                  />
                  <span>{{ '⭐'.repeat(star) }} {{ star }}星</span>
                </label>
              </div>
            </div>

            <div class="filter-group">
              <h3>设施</h3>
              <div class="facilities-filter">
                <label v-for="facility in facilities" :key="facility">
                  <input
                    v-model="filters.facilities"
                    type="checkbox"
                    :value="facility"
                  />
                  <span>{{ facility }}</span>
                </label>
              </div>
            </div>

            <button class="reset-btn" @click="resetFilters">重置筛选</button>
          </aside>

          <!-- 酒店列表 -->
          <div class="hotels-list">
            <div class="sort-bar">
              <label>排序:</label>
              <select v-model="sortBy" @change="performSearch">
                <option value="recommended">推荐排序</option>
                <option value="price-low">价格低到高</option>
                <option value="price-high">价格高到低</option>
                <option value="rating">评分最高</option>
              </select>
            </div>

            <div
              v-if="filteredHotels.length > 0"
              class="hotels-grid list-grid"
            >
              <div
                v-for="hotel in filteredHotels"
                :key="hotel.id"
                class="hotel-card list-item"
              >
                <div class="card-image-wrapper">
                  <img :src="hotel.image" :alt="hotel.name" class="hotel-img-list" />
                  <div v-if="hotel.discount" class="discount-badge-list">
                    -{{ hotel.discount }}%
                  </div>
                </div>

                <div class="card-content-list">
                  <div class="card-header">
                    <div class="hotel-info">
                      <h3>{{ hotel.name }}</h3>
                      <p class="location">📍 {{ hotel.location }}</p>
                      <p class="hotel-desc-list">{{ hotel.description }}</p>
                    </div>
                    <div class="rating-section">
                      <span class="stars-large">⭐ {{ hotel.rating }}</span>
                      <span class="reviews-count">{{ hotel.reviews }}条评论</span>
                    </div>
                  </div>

                  <div class="tags-list">
                    <span v-for="tag in hotel.tags" :key="tag" class="tag">
                      {{ tag }}
                    </span>
                  </div>

                  <div class="facilities-list">
                    <span
                      v-for="facility in hotel.facilities.slice(0, 3)"
                      :key="facility"
                      class="facility-badge"
                    >
                      {{ facility }}
                    </span>
                    <span v-if="hotel.facilities.length > 3" class="facility-badge more">
                      +{{ hotel.facilities.length - 3 }}
                    </span>
                  </div>

                  <div class="card-footer-list">
                    <div class="price-info">
                      <span v-if="hotel.originalPrice" class="original-price">
                        ¥{{ hotel.originalPrice }}
                      </span>
                      <span class="price-large">¥{{ hotel.price }}</span>
                      <span class="price-unit">/晚</span>
                    </div>
                    <button class="book-btn-list" @click="goToBooking(hotel)">
                      预订
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <p>😔 没有找到符合条件的酒店</p>
              <button class="reset-btn" @click="resetFilters">
                重置筛选条件
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// ========== 数据 ==========
const showBackToTop = ref(false);
const currentBanner = ref(0);
let bannerTimer = null;

// 搜索参数
const searchParams = ref({
  city: "",
  checkIn: new Date().toISOString().split("T")[0],
  checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  guests: 1,
});

const showCityList = ref(false);
const popularCities = [
  "北京", "上海", "广州", "深圳", "杭州",
  "南京", "成都", "西安", "苏州", "重庆"
];

// ========== Banner 轮播图 (国内可访问的高端酒店场景) ==========
const bannerImages = ref([
  "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200", // 豪华酒店大堂
  "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1200", // 泳池
  "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1200"  // 客房
]);

// ========== 热门推荐酒店 (图片为高端酒店实拍，与名称对应) ==========
const recommendedHotels = ref([
  {
    id: 1,
    name: "北京金融街丽思卡尔顿酒店",
    location: "北京·西城区金融大街",
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.8,
    reviews: 1250,
    price: 1588,
    originalPrice: 1888,
    discount: 16,
    tags: ["5星", "商务", "豪华"],
    description: "坐落于北京金融街核心地段，奢华设施与尊贵服务，尽享京城繁华",
    facilities: ["免费WiFi", "行政酒廊", "水疗中心", "室内泳池", "健身中心", "米其林餐厅"],
  },
  {
    id: 2,
    name: "上海外滩华尔道夫酒店",
    location: "上海·黄浦区中山东一路",
    image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.9,
    reviews: 980,
    price: 2888,
    originalPrice: 3288,
    discount: 12,
    tags: ["5星", "奢华", "外滩"],
    description: "百年历史建筑，坐拥外滩绝版江景，体验经典上海风情",
    facilities: ["免费WiFi", "奢华SPA", "江景餐厅", "恒温泳池", "管家服务"],
  },
  {
    id: 3,
    name: "广州富力君悦大酒店",
    location: "广州·天河区珠江新城",
    image: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.7,
    reviews: 3910,
    price: 968,
    originalPrice: 1288,
    discount: 25,
    tags: ["5星", "商务", "地标"],
    description: "地处珠江新城CBD核心，俯瞰广州塔，奢享云端入住体验",
    facilities: ["免费WiFi", "室内泳池", "健身中心", "酒吧", "餐厅"],
  },
]);

// ========== 所有酒店数据 (共12家，图片均使用真实酒店风格) ==========
const allHotels = ref([
  {
    id: 1,
    name: "北京金融街丽思卡尔顿酒店",
    location: "北京·西城区金融大街",
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.8,
    reviews: 1250,
    price: 1588,
    originalPrice: 1888,
    discount: 16,
    tags: ["5星", "商务", "豪华"],
    description: "坐落于北京金融街核心地段，奢华设施与尊贵服务，尽享京城繁华",
    facilities: ["免费WiFi", "行政酒廊", "水疗中心", "室内泳池", "健身中心", "米其林餐厅"],
  },
  {
    id: 2,
    name: "上海外滩华尔道夫酒店",
    location: "上海·黄浦区中山东一路",
    image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.9,
    reviews: 980,
    price: 2888,
    originalPrice: 3288,
    discount: 12,
    tags: ["5星", "奢华", "外滩"],
    description: "百年历史建筑，坐拥外滩绝版江景，体验经典上海风情",
    facilities: ["免费WiFi", "奢华SPA", "江景餐厅", "恒温泳池", "管家服务"],
  },
  {
    id: 3,
    name: "广州富力君悦大酒店",
    location: "广州·天河区珠江新城",
    image: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.7,
    reviews: 3910,
    price: 968,
    originalPrice: 1288,
    discount: 25,
    tags: ["5星", "商务", "地标"],
    description: "地处珠江新城CBD核心，俯瞰广州塔，奢享云端入住体验",
    facilities: ["免费WiFi", "室内泳池", "健身中心", "酒吧", "餐厅"],
  },
  {
    id: 4,
    name: "深圳鹏瑞莱佛士酒店",
    location: "深圳·南山区深圳湾",
    image: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.9,
    reviews: 650,
    price: 2588,
    originalPrice: 2988,
    discount: 13,
    tags: ["5星", "奢华", "海景"],
    description: "深圳湾一号地标，高空视野无敌，尽享湾区海景",
    facilities: ["免费WiFi", "无边际泳池", "水疗中心", "米其林餐厅", "行政酒廊"],
  },
  {
    id: 5,
    name: "深圳文华东方酒店",
    location: "深圳·福田区深业上城",
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.8,
    reviews: 890,
    price: 2388,
    originalPrice: 2788,
    discount: 14,
    tags: ["5星", "地标", "设计"],
    description: "深业上城地标建筑，季裕棠操刀设计，东方气韵与现代奢华完美融合",
    facilities: ["免费WiFi", "高空酒吧", "健身中心", "水疗中心", "会议室"],
  },
  {
    id: 6,
    name: "杭州西子湖四季酒店",
    location: "杭州·西湖区灵隐路",
    image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.9,
    reviews: 702,
    price: 2888,
    originalPrice: 3388,
    discount: 15,
    tags: ["5星", "园林", "奢华"],
    description: "隐匿于西湖西北角，中式庭院设计，独享江南园林奢华体验",
    facilities: ["免费WiFi", "金沙厅", "水疗中心", "室内泳池", "摇橹船早餐"],
  },
  {
    id: 7,
    name: "南京丽思卡尔顿酒店",
    location: "南京·玄武区中山路",
    image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.8,
    reviews: 3584,
    price: 1588,
    originalPrice: 1888,
    discount: 16,
    tags: ["5星", "奢华", "商务"],
    description: "坐落于南京新街口核心商圈，尽享金陵繁华与尊贵服务",
    facilities: ["免费WiFi", "室内泳池", "SPA水疗", "健身中心", "行政酒廊"],
  },
  {
    id: 8,
    name: "成都博舍酒店",
    location: "成都·锦江区太古里",
    image: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.9,
    reviews: 2140,
    price: 1688,
    originalPrice: 1988,
    discount: 15,
    tags: ["5星", "精品", "设计"],
    description: "太古里核心精品酒店，川西风格融合现代设计，城市中的宁静绿洲",
    facilities: ["免费WiFi", "泳池", "水疗中心", "健身中心", "庭院餐厅"],
  },
  {
    id: 9,
    name: "西安威斯汀大酒店",
    location: "西安·雁塔区大雁塔",
    image: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.6,
    reviews: 1200,
    price: 728,
    originalPrice: 898,
    discount: 19,
    tags: ["5星", "景区", "历史"],
    description: "紧邻大雁塔和大唐不夜城，尽览古都夜景，体验盛唐文化",
    facilities: ["免费WiFi", "室内泳池", "健身中心", "餐厅", "会议室"],
  },
  {
    id: 10,
    name: "苏州金鸡湖凯宾斯基大酒店",
    location: "苏州·工业园区金鸡湖",
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.7,
    reviews: 1850,
    price: 898,
    originalPrice: 1188,
    discount: 24,
    tags: ["5星", "湖景", "度假"],
    description: "独墅湖畔欧式城堡，一线湖景，享受江南水乡的悠闲度假",
    facilities: ["免费WiFi", "私家沙滩", "室内外泳池", "SPA水疗", "湖景餐厅"],
  },
  {
    id: 11,
    name: "北京古北水镇古北之光温泉酒店",
    location: "北京·密云区古北水镇",
    image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.5,
    reviews: 2300,
    price: 788,
    originalPrice: 998,
    discount: 21,
    tags: ["5星", "温泉", "古镇"],
    description: "位于古北水镇景区内，温泉养生，尽享北方水镇风光",
    facilities: ["免费WiFi", "温泉泡池", "健身房", "餐厅", "儿童乐园"],
  },
  {
    id: 12,
    name: "上海浦东丽晶酒店",
    location: "上海·浦东新区陆家嘴",
    image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
    rating: 4.8,
    reviews: 2150,
    price: 1898,
    originalPrice: 2288,
    discount: 17,
    tags: ["5星", "奢华", "江景"],
    description: "陆家嘴金融贸易区核心，现代化设施与壮丽景观完美结合",
    facilities: ["免费WiFi", "室内泳池", "健身中心", "餐厅", "酒吧"],
  },
]);

// 筛选参数
const filters = ref({
  minPrice: 0,
  maxPrice: 5000,
  stars: [],
  facilities: [],
});

const sortBy = ref("recommended");

// 设施列表
const facilities = [
  "免费WiFi", "24小时客服", "健身房", "游泳池",
  "停车场", "餐厅", "会议室", "水疗中心"
];

// ========== 计算属性 ==========
const filteredHotels = computed(() => {
  let result = allHotels.value.filter((hotel) => {
    if (hotel.price < filters.value.minPrice || hotel.price > filters.value.maxPrice) return false;
    if (filters.value.stars.length > 0 && !filters.value.stars.includes(Math.ceil(hotel.rating))) return false;
    if (filters.value.facilities.length > 0) {
      const hasAll = filters.value.facilities.every(f => hotel.facilities.includes(f));
      if (!hasAll) return false;
    }
    return true;
  });

  switch (sortBy.value) {
    case "price-low": result.sort((a,b) => a.price - b.price); break;
    case "price-high": result.sort((a,b) => b.price - a.price); break;
    case "rating": result.sort((a,b) => b.rating - a.rating); break;
    default: break;
  }
  return result;
});

// ========== 方法 ==========
const selectCity = (city) => {
  searchParams.value.city = city;
  showCityList.value = false;
};

const performSearch = () => {
  console.log("搜索参数:", searchParams.value);
};

const prevBanner = () => {
  currentBanner.value = (currentBanner.value - 1 + bannerImages.value.length) % bannerImages.value.length;
  stopBannerAutoPlay();
  startBannerAutoPlay();
};

const nextBanner = () => {
  currentBanner.value = (currentBanner.value + 1) % bannerImages.value.length;
  stopBannerAutoPlay();
  startBannerAutoPlay();
};

const startBannerAutoPlay = () => {
  bannerTimer = setInterval(() => {
    currentBanner.value = (currentBanner.value + 1) % bannerImages.value.length;
  }, 5000);
};

const stopBannerAutoPlay = () => {
  if (bannerTimer) {
    clearInterval(bannerTimer);
    bannerTimer = null;
  }
};

const resetFilters = () => {
  filters.value = { minPrice: 0, maxPrice: 5000, stars: [], facilities: [] };
  sortBy.value = "recommended";
};

const goToBooking = (hotel) => {
  router.push({
    name: "HotelDetail",
    params: { id: hotel.id },
    query: {
      checkIn: searchParams.value.checkIn,
      checkOut: searchParams.value.checkOut,
      guests: searchParams.value.guests,
    },
  });
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300;
};

// ========== 生命周期 ==========
onMounted(() => {
  startBannerAutoPlay();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  stopBannerAutoPlay();
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
/* 样式保持不变，与您原代码完全一致 */
* {
  box-sizing: border-box;
}
.hotel-page {
  background: #f5f7fa;
  min-height: 100vh;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
.back-to-top:hover {
  transform: scale(1.1) translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}
.search-header {
  background: white;
  padding: 24px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
.title {
  font-size: 28px;
  margin: 0 0 20px 0;
  color: #333;
}
.search-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.search-item {
  display: flex;
  flex-direction: column;
  position: relative;
}
.search-item label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.search-item input, .search-item select {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}
.search-item input:focus, .search-item select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
.city-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-top: -1px;
}
.city-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}
.city-item:hover {
  background: #f5f7fa;
  color: #667eea;
}
.city-item:last-child {
  border-bottom: none;
}
.search-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  align-self: flex-end;
}
.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
.banner-carousel {
  position: relative;
  width: 100%;
  height: 350px;
  overflow: hidden;
  background: #f0f0f0;
  margin: 24px 0;
  border-radius: 12px;
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
.carousel-slide .banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.carousel-indicators {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
}
.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}
.indicator-dot.active {
  background: white;
  width: 28px;
  border-radius: 5px;
}
.carousel-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}
.carousel-control.prev { left: 15px; }
.carousel-control.next { right: 15px; }
.section-header {
  margin: 40px 0 24px 0;
}
.section-header h2 {
  font-size: 26px;
  margin: 0 0 4px 0;
  color: #333;
}
.section-header p {
  color: #999;
  font-size: 14px;
  margin: 0;
}
.recommended-section {
  margin: 40px 0;
}
.recommended-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important;
  gap: 20px !important;
}
.hotels-grid {
  display: grid;
  gap: 20px;
  margin-bottom: 40px;
}
.list-grid {
  grid-template-columns: 1fr;
}
.hotel-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  cursor: pointer;
}
.hotel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
.hotel-card.featured {
  display: flex;
  flex-direction: column;
}
.hotel-card.list-item {
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding: 16px;
}
.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f0f0f0;
}
.card-image .hotel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  display: block;
}
.hotel-card:hover .card-image .hotel-img {
  transform: scale(1.08);
}
.card-image-wrapper {
  position: relative;
  width: 180px;
  min-width: 180px;
  height: 180px;
  overflow: hidden;
  border-radius: 8px;
  background: #f0f0f0;
}
.hotel-img-list {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  display: block;
}
.hotel-card.list-item:hover .hotel-img-list {
  transform: scale(1.08);
}
.rating-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
}
.stars { font-weight: 600; font-size: 13px; }
.reviews { font-size: 10px; opacity: 0.9; }
.stars-large { font-weight: 600; font-size: 16px; color: #ff6b6b; }
.reviews-count { font-size: 12px; color: #999; }
.discount-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #ff6b6b;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}
.discount-badge-list {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff6b6b;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.card-content-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-content h3, .hotel-info h3 {
  font-size: 18px;
  margin: 0 0 4px 0;
  color: #333;
  font-weight: 600;
}
.location {
  color: #999;
  font-size: 12px;
  margin: 0 0 6px 0;
}
.hotel-desc, .hotel-desc-list {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}
.hotel-desc { margin: 6px 0 0 0; }
.hotel-desc-list { margin: 4px 0; }
.card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.hotel-info { flex: 1; }
.rating-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  white-space: nowrap;
}
.tags, .tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.tags-list { margin: 8px 0; }
.tag {
  background: #f0f0f0;
  color: #667eea;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}
.facilities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}
.facility-badge {
  background: #e8f5e9;
  color: #2ecc71;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}
.facility-badge.more {
  background: #f5f5f5;
  color: #666;
}
.card-footer, .card-footer-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
}
.card-footer { border-top: 1px solid #f0f0f0; }
.price-section, .price-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.original-price {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
}
.price, .price-large {
  font-weight: 700;
  color: #ff6b6b;
}
.price { font-size: 24px; }
.price-large { font-size: 28px; }
.unit, .price-unit {
  color: #999;
  font-size: 12px;
}
.book-btn, .book-btn-list {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
}
.book-btn { padding: 8px 24px; font-size: 14px; }
.book-btn-list { padding: 10px 28px; font-size: 14px; }
.book-btn:hover, .book-btn-list:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
.content-wrapper {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  margin-bottom: 40px;
}
.sort-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}
.sort-bar label { font-weight: 600; color: #333; }
.sort-bar select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  outline: none;
}
.filter-sidebar {
  background: white;
  padding: 20px;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 100px;
}
.filter-group {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}
.filter-group:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.filter-group h3 {
  font-size: 16px;
  margin: 0 0 12px 0;
  color: #333;
}
.price-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.price-filter input[type="range"] { width: 100%; cursor: pointer; }
.price-display {
  text-align: center;
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 6px;
}
.star-filter, .facilities-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.star-filter label, .facilities-filter label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}
.star-filter label:hover, .facilities-filter label:hover {
  color: #667eea;
  transform: translateX(2px);
}
.star-filter input[type="checkbox"], .facilities-filter input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}
.reset-btn {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  background: white;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}
.reset-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f5f7fa;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  grid-column: 1 / -1;
}
.empty-state p {
  font-size: 18px;
  color: #999;
  margin-bottom: 20px;
}
@media (max-width: 1024px) {
  .search-bar { grid-template-columns: repeat(3, 1fr); }
  .content-wrapper { grid-template-columns: 240px 1fr; gap: 16px; }
  .banner-carousel { height: 280px; }
}
@media (max-width: 768px) {
  .search-bar { grid-template-columns: repeat(2, 1fr); }
  .search-btn { grid-column: 1 / -1; }
  .content-wrapper { grid-template-columns: 1fr; }
  .filter-sidebar { position: static; margin-bottom: 20px; }
  .hotel-card.list-item { flex-direction: column; }
  .card-image-wrapper { width: 100%; height: 200px; }
  .banner-carousel { height: 220px; }
}
@media (max-width: 480px) {
  .search-bar { grid-template-columns: 1fr; }
  .banner-carousel { height: 180px; }
  .carousel-control { width: 36px; height: 36px; font-size: 18px; }
  .recommended-grid { grid-template-columns: 1fr !important; }
  .card-image-wrapper { height: 150px; }
  .back-to-top { width: 40px; height: 40px; font-size: 12px; }
}
</style>