<template>
  <div class="register">
    <div class="register-container">
      <h2>{{ isLoginMode ? '登录账号' : '注册账号' }}</h2>
      <div class="mode-switch">
        <button 
          :class="{ active: isLoginMode }" 
          @click="isLoginMode = true"
        >
          登录
        </button>
        <button 
          :class="{ active: !isLoginMode }" 
          @click="isLoginMode = false"
        >
          注册
        </button>
      </div>
      <form @submit.prevent="isLoginMode ? handleLogin() : handleRegister()">
        <input v-model="username" type="text" placeholder="账号" required>
        <input v-model="password" type="password" placeholder="密码" required>
        <input v-if="!isLoginMode" v-model="confirmPassword" type="password" placeholder="确认密码" required>
        <div v-if="!isLoginMode" class="captcha-container">
          <span class="captcha-text">{{ captcha }}</span>
          <input v-model="captchaInput" type="text" placeholder="请输入验证码" required>
          <button type="button" @click="generateCaptcha" class="refresh-captcha">刷新</button>
        </div>
        <button type="submit">{{ isLoginMode ? '登录' : '注册' }}</button>
      </form>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLoginMode = ref(true) // 默认登录模式
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const captcha = ref('')
const captchaInput = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const generateCaptcha = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captcha.value = result
}

const handleLogin = () => {
  errorMessage.value = ''
  successMessage.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = '请填写账号和密码'
    return
  }
  // 检查账号是否存在
  const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}')
  if (!registeredUsers[username.value]) {
    errorMessage.value = '账号不存在'
    return
  }
  if (registeredUsers[username.value] !== password.value) {
    errorMessage.value = '密码错误'
    return
  }
  // 登录成功
  const userInfo = {
    id: username.value,
    username: username.value,
    avatar: `https://i.pravatar.cc/150?u=${username.value}`
  }
  userStore.login(userInfo)
  successMessage.value = '登录成功！'
  // 跳转到首页
  setTimeout(() => {
    router.push('/')
  }, 1000)
}

const handleRegister = () => {
  errorMessage.value = ''
  successMessage.value = ''
  if (!username.value.trim() || !password.value.trim() || !confirmPassword.value.trim()) {
    errorMessage.value = '请填写所有字段'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '密码不相同'
    return
  }
  if (captchaInput.value.toUpperCase() !== captcha.value) {
    errorMessage.value = '验证码错误'
    return
  }
  // 检查是否已注册
  const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}')
  if (registeredUsers[username.value]) {
    errorMessage.value = '账号已存在'
    return
  }
  // 存储账号和密码
  registeredUsers[username.value] = password.value
  localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers))
  successMessage.value = '注册成功！请登录使用。'
  // 清空表单
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  captchaInput.value = ''
  generateCaptcha()
}

onMounted(() => {
  generateCaptcha()
})
</script>

<style scoped>
.register {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
}

.register-container {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.register-container h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.mode-switch {
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.mode-switch button {
  flex: 1;
  padding: 10px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  transition: background 0.3s;
}

.mode-switch button.active {
  background: #42b983;
  color: white;
}

.register-container form {
  display: flex;
  flex-direction: column;
}

.register-container input {
  margin-bottom: 15px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.captcha-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.captcha-text {
  font-size: 18px;
  font-weight: bold;
  color: #42b983;
  margin-right: 10px;
  letter-spacing: 2px;
}

.refresh-captcha {
  margin-left: 10px;
  padding: 8px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-captcha:hover {
  background: #e0e0e0;
}

.register-container button[type="submit"] {
  padding: 12px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}

.register-container button[type="submit"]:hover {
  background: #369870;
}

.error {
  color: #e74c3c;
  text-align: center;
  margin-top: 10px;
}

.success {
  color: #27ae60;
  text-align: center;
  margin-top: 10px;
}
</style>