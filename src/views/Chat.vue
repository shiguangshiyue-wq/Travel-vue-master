<template>
  <div class="chat">
    <div class="chat-container">
      <div class="chat-header">
        <h2>智能对话助手</h2>
        <p>询问旅游相关问题，我会为您提供详细攻略</p>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div v-for="message in messages" :key="message.id" :class="['message', message.role]">
          <div class="message-content">
            <div v-if="message.role === 'assistant' && message.isLoading" class="loading">
              <span>正在思考...</span>
            </div>
            <div v-else v-html="formatMessage(message.content)"></div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="输入您的问题..."
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        >
        <button @click="sendMessage" :disabled="isLoading || !inputMessage.trim()">
          发送
        </button>
      </div>

      <!-- 建议弹窗 -->
      <div v-if="showSuggestions" class="suggestions-modal" @click.self="showSuggestions = false">
        <div class="modal-content">
          <h3>还需要什么帮助？</h3>
          <div class="suggestions">
            <button @click="selectSuggestion('附近美食')">附近美食信息</button>
            <button @click="selectSuggestion('附近酒店')">附近酒店信息</button>
            <button @click="selectSuggestion('交通指南')">交通指南</button>
            <button @click="selectSuggestion('更多景点')">更多景点推荐</button>
          </div>
          <button @click="showSuggestions = false" class="close-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { deepseekAPI } from '@/api/deepseek'
import { amapAPI } from '@/api/amap'
// 导入对话清洗工具
import { cleanAll } from '@/utils/recommendation.js'

const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const showSuggestions = ref(false)
const messagesContainer = ref(null)

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  // 清洗用户输入
  const cleanedInput = cleanAll(inputMessage.value)

  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: cleanedInput
  }
  messages.value.push(userMessage)
  inputMessage.value = ''

  isLoading.value = true
  const assistantMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    isLoading: true
  }
  messages.value.push(assistantMessage)

  await nextTick()
  scrollToBottom()

  try {
    const city = extractCity(userMessage.content)
    let response = ''

    if (city) {
      const spots = await amapAPI.searchScenicSpots('', city, 1)
      const weather = await amapAPI.getWeather(city)
      // const topSpots = spots.slice(0, 5)
      const prompt = buildTravelPrompt(userMessage.content, city, topSpots, weather)
      response = await deepseekAPI.chat([
        { role: 'system', content: '你是一个专业的旅游助手，请根据提供的信息为用户生成详细的旅游攻略。' },
        { role: 'user', content: prompt }
      ])
    } else {
      response = await deepseekAPI.chat([
        { role: 'system', content: '你是一个友好的AI助手，可以回答各种问题。' },
        { role: 'user', content: userMessage.content }
      ])
    }

    // 清洗AI返回内容，彻底去除###、**、---等格式符号
    assistantMessage.content = cleanAll(response)
    assistantMessage.isLoading = false

    if (city) {
      setTimeout(() => {
        showSuggestions.value = true
      }, 1000)
    }

  } catch (error) {
    assistantMessage.content = '抱歉，服务暂时不可用，请稍后再试。'
    assistantMessage.isLoading = false
  }

  isLoading.value = false
  await nextTick()
  scrollToBottom()
}

const extractCity = (message) => {
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '成都', '重庆', '武汉', '西安', '长沙', '郑州', '青岛', '济南', '沈阳', '大连', '厦门', '福州', '昆明', '贵阳', '南宁', '海口', '兰州', '西宁', '银川', '乌鲁木齐', '拉萨', '哈尔滨', '长春', '呼和浩特', '太原', '石家庄', '天津', '合肥', '南昌', '宁波', '温州', '嘉兴', '绍兴', '金华', '台州', '丽水', '舟山', '衢州']
  for (const city of cities) {
    if (message.includes(city)) {
      return city
    }
  }
  return null
}

const buildTravelPrompt = (userQuery, city, spots, weather) => {
  let prompt = `用户询问: "${userQuery}"\n\n`
  prompt += `城市: ${city}\n\n`

  if (weather && weather.forecasts && weather.forecasts[0]) {
    const today = weather.forecasts[0].casts[0]
    prompt += `今日天气: ${today.dayweather}, 温度: ${today.daytemp}°C/${today.nighttemp}°C, 风力: ${today.daypower}级\n\n`
  }

  prompt += `热门景点前5名:\n`
  spots.forEach((spot, index) => {
    prompt += `${index + 1}. ${spot.name}\n`
    prompt += `   地址: ${spot.address}\n`
    prompt += `   类型: ${spot.type}\n`
    if (spot.rating) prompt += `   评分: ${spot.rating}\n`
    prompt += `\n`
  })

  prompt += `请为用户提供详细的旅游攻略，包括:\n`
  prompt += `1. 每个景点的地理位置、历史信息、文化特色\n`
  prompt += `2. 游玩攻略和注意事项\n`
  prompt += `3. 结合天气情况的出行建议\n`
  prompt += `4. 其他实用信息\n\n`
  prompt += `请用友好的语气回答，结构清晰。`

  return prompt
}

const selectSuggestion = async (suggestion) => {
  showSuggestions.value = false
  const lastCity = extractCity(messages.value[messages.value.length - 2]?.content || '')
  if (!lastCity) return

  inputMessage.value = `${lastCity}${suggestion}`
  await sendMessage()
}

const formatMessage = (content) => {
  return content.replace(/\n/g, '<br>')
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  messages.value.push({
    id: 1,
    role: 'assistant',
    content: '您好！我是您的智能旅游助手。可以帮您查询景点信息、天气、攻略等。试试问我"北京哪里好玩啊"！'
  })
})
</script>

<style scoped>
.chat {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.chat-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 800px;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  text-align: center;
}

.chat-header h2 {
  margin: 0 0 5px 0;
  color: #333;
}

.chat-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
}

.message.user .message-content {
  background: #007bff;
  color: white;
}

.message.assistant .message-content {
  background: #f1f1f1;
  color: #333;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading::after {
  content: '';
  width: 8px;
  height: 8px;
  border: 2px solid #ccc;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 16px;
}

.chat-input input:disabled {
  background: #f5f5f5;
}

.chat-input button {
  padding: 12px 24px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
}

.chat-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.suggestions-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #333;
}

.suggestions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.suggestions button {
  padding: 10px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.suggestions button:hover {
  background: #e0e0e0;
}

.close-btn {
  padding: 8px 16px;
  background: #666;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>