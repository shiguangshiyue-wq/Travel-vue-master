<!-- src/views/Favorites.vue -->
<template>
  <div class="favorites">
    <h1>我的收藏</h1>
    <p class="count">共 {{ userStore.favorites.length }} 个收藏</p>
    
    <div v-if="userStore.favorites.length === 0" class="empty">
      <p>还没有收藏任何景点</p>
      <router-link to="/">去探索 →</router-link>
    </div>
    
    <div v-else class="spots-grid">
      <div v-for="spot in userStore.favorites" :key="spot.id" class="spot-card">
        <img :src="spot.image || getPlaceholderImage()" :alt="spot.name">
        <div class="info">
          <h3>{{ spot.name }}</h3>
          <p>{{ spot.address }}</p>
          <button @click="removeFavorite(spot.id)">移除收藏</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const getPlaceholderImage = () => {
  return `https://picsum.photos/400/300?random=${Math.random()}`
}

const removeFavorite = (id) => {
  userStore.removeFavorite(id)
}
</script>

<style scoped>
.favorites {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.favorites h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.count {
  color: #666;
  margin-bottom: 30px;
}

.spots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.spot-card {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.spot-card img {
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.info {
  padding: 12px;
  flex: 1;
}

.info h3 {
  margin-bottom: 8px;
}

.info p {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.info button {
  padding: 6px 16px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.empty {
  text-align: center;
  padding: 60px;
}

.empty a {
  color: #42b983;
  text-decoration: none;
  margin-top: 10px;
  display: inline-block;
}
</style>