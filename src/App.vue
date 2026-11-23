<!-- src/App.vue -->
<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo" @click="router.push('/')">
          🚀 智能旅游推荐
        </div>
        <div class="nav-links">
          <router-link to="/weather">天气查看</router-link>
          <router-link to="/">首页</router-link>
          <router-link to="/favorites">我的收藏</router-link>
          <router-link to="/chat">智能对话</router-link>
          <button v-if="!userStore.isLoggedIn" @click="showLogin = true" class="login-btn">
            登录
          </button>
          <div v-else class="user-info">
            <span>{{ userStore.username }}</span>
            <button @click="logout" class="logout-btn">退出</button>
          </div>
        </div>
      </div>
    </nav>
    
    <main>
      <router-view />
    </main>
    
    <!-- 登录弹窗 -->
    <div v-if="showLogin" class="login-modal" @click.self="showLogin = false">
      <div class="modal-content">
        <h2>登录</h2>
        <form @submit.prevent="handleLogin">
          <input v-model="loginName" type="text" placeholder="用户名" required>
          <input v-model="password" type="password" placeholder="密码" required>
          <div class="captcha-container">
            <span class="captcha-text">{{ captcha }}</span>
            <input v-model="captchaInput" type="text" placeholder="请输入验证码" required>
            <button type="button" @click="generateCaptcha" class="refresh-captcha">刷新</button>
          </div>
          <p class="register-link" @click="goToRegister">注册</p>
          <button type="submit">登录</button>
        </form>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const showLogin = ref(false)
const loginName = ref('')
const password = ref('')
const captcha = ref('')
const captchaInput = ref('')
const errorMessage = ref('')

const generateCaptcha = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captcha.value = result
}

const testAccounts = {
  'test1': 'pass1',
  'test2': 'pass2',
  'admin': 'admin123',
  'user': 'password'
}

const handleLogin = () => {
  errorMessage.value = ''
  if (!loginName.value.trim() || !password.value.trim()) {
    errorMessage.value = '请输入用户名和密码'
    return
  }
  if (captchaInput.value.toUpperCase() !== captcha.value) {
    errorMessage.value = '验证码错误'
    return
  }
  // 检查测试账号
  if (testAccounts[loginName.value] && testAccounts[loginName.value] === password.value) {
    userStore.login({
      id: loginName.value,
      username: loginName.value,
      avatar: `https://i.pravatar.cc/150?u=${loginName.value}`
    })
    showLogin.value = false
    loginName.value = ''
    password.value = ''
    captchaInput.value = ''
    generateCaptcha()
    router.push('/')
  } else {
    // 检查注册用户
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}')
    if (registeredUsers[loginName.value] && registeredUsers[loginName.value] === password.value) {
      userStore.login({
        id: loginName.value,
        username: loginName.value,
        avatar: `https://i.pravatar.cc/150?u=${loginName.value}`
      })
      showLogin.value = false
      loginName.value = ''
      password.value = ''
      captchaInput.value = ''
      generateCaptcha()
      router.push('/')
    } else {
      errorMessage.value = '用户名或密码错误'
    }
  }
}

const goToRegister = () => {
  showLogin.value = false
  router.push('/login')
}

const logout = () => {
  userStore.logout()
}

onMounted(() => {
  generateCaptcha()
  // 检查登录状态
  if (!userStore.isLoggedIn && route.path !== '/login') {
    showLogin.value = true
  }
})

// 监听路由变化
watch(() => route.path, (newPath) => {
  if (!userStore.isLoggedIn && newPath !== '/login') {
    showLogin.value = true
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.navbar {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-size: 20px;
  font-weight: bold;
  color: #42b983;
  cursor: pointer;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links a {
  text-decoration: none;
  color: #666;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #42b983;
}

.login-btn, .logout-btn {
  padding: 6px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.logout-btn {
  background: #ff6b6b;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  width: 300px;
  text-align: center;
}

.modal-content h2 {
  margin-bottom: 20px;
}

.modal-content input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.captcha-text {
  font-size: 18px;
  font-weight: bold;
  color: #42b983;
  background: #f0f0f0;
  padding: 8px 12px;
  border-radius: 4px;
  user-select: none;
}

.refresh-captcha {
  padding: 8px 12px;
  background: #ddd;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.refresh-captcha:hover {
  background: #ccc;
}

.modal-content button[type="submit"] {
  width: 100%;
  padding: 10px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.error {
  color: red;
  margin-top: 10px;
  font-size: 14px;
}

.register-link {
  color: #999;
  font-size: 12px;
  cursor: pointer;
  text-align: center;
  margin-bottom: 10px;
}

.register-link:hover {
  color: #666;
}

main {
  min-height: calc(100vh - 60px);
}
</style>