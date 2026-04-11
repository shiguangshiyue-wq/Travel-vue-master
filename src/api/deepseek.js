// src/api/deepseek.js
import axios from 'axios'

const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_KEY

const deepseekRequest = axios.create({
  baseURL: 'https://api.deepseek.com/v1',
  timeout: 60000,
  headers: {
    'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    'Content-Type': 'application/json'
  }
})

export const deepseekAPI = {
  // 发送消息到DeepSeek
  async chat(messages) {
    try {
      const response = await deepseekRequest.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
      
      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content
      }
      return '抱歉，我无法理解您的问题。'
    } catch (error) {
      console.error('DeepSeek API调用失败', error)
      return '抱歉，AI服务暂时不可用，请稍后再试。'
    }
  }
}