<!-- src/views/Flight.vue -->
<template>
  <div class="flight-page">
    <div class="container">
      <h1>✈️ 机票预订</h1>
      <p>此页面正在开发中...</p>
      <!-- 机票预订功能开发 -->
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  console.log("机票预订页面已加载");
});
</script>

<style scoped>
.flight-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.container {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #999;
}
</style>