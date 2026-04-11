// src/api/unsplash.js
import axios from 'axios'

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_KEY

const unsplashRequest = axios.create({
  baseURL: 'https://api.unsplash.com',
  headers: {
    'Authorization': `Client-ID ${UNSPLASH_KEY}`
  }
})

export const unsplashAPI = {
  // 搜索旅游图片
  async searchTravelImages(query, count = 10) {
    try {
      const response = await unsplashRequest.get('/search/photos', {
        params: {
          query: query,
          per_page: count,
          orientation: 'landscape'
        }
      })
      
      return response.data.results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        small: photo.urls.small,
        description: photo.description || query,
        author: photo.user.name,
        authorAvatar: photo.user.profile_image.small
      }))
    } catch (error) {
      console.error('获取图片失败', error)
      // 返回占位图
      return Array(count).fill(0).map((_, i) => ({
        id: `placeholder-${i}`,
        url: `https://picsum.photos/800/600?random=${i}`,
        thumb: `https://picsum.photos/400/300?random=${i}`,
        description: '旅游风景',
        author: 'Pexels'
      }))
    }
  },

  // 获取随机旅游图片
  async getRandomTravelImages(count = 5) {
    try {
      const response = await unsplashRequest.get('/photos/random', {
        params: {
          count: count,
          orientation: 'landscape',
          query: 'travel'
        }
      })
      
      return response.data.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        description: photo.description,
        author: photo.user.name
      }))
    } catch (error) {
      console.error('获取随机图片失败', error)
      return []
    }
  }
}