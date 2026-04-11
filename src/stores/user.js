// src/stores/user.js
import { defineStore } from 'pinia'

const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

const getUserKey = (userId, key) => `user_${userId}_${key}`

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    username: null,
    avatar: null,
    favorites: [],
    ratings: [],
    searchHistory: [],
    preferences: {
      categories: [],
      priceRange: [0, 1000],
      travelStyle: []
    }
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.userId,
    favoriteCount: (state) => state.favorites.length,
    favoriteIds: (state) => state.favorites.map(f => f.id),
    getRating: (state) => (spotId) => {
      const rating = state.ratings.find(r => r.spotId === spotId)
      return rating ? rating.value : null
    }
  },
  
  actions: {
    login(userInfo) {
      this.userId = userInfo.id
      this.username = userInfo.name
      this.avatar = userInfo.avatar
      
      // 加载用户特定的数据
      this.favorites = loadFromStorage(getUserKey(this.userId, 'favorites'), [])
      this.ratings = loadFromStorage(getUserKey(this.userId, 'ratings'), [])
      this.searchHistory = loadFromStorage(getUserKey(this.userId, 'searchHistory'), [])
      this.preferences = loadFromStorage(getUserKey(this.userId, 'preferences'), {
        categories: [],
        priceRange: [0, 1000],
        travelStyle: []
      })
    },
    
    logout() {
      // 保存当前用户数据（可选，因为每次操作都会保存）
      this.saveUserData()
      
      // 清除状态
      this.userId = null
      this.username = null
      this.avatar = null
      this.favorites = []
      this.ratings = []
      this.searchHistory = []
      this.preferences = {
        categories: [],
        priceRange: [0, 1000],
        travelStyle: []
      }
    },
    
    saveUserData() {
      if (this.userId) {
        saveToStorage(getUserKey(this.userId, 'favorites'), this.favorites)
        saveToStorage(getUserKey(this.userId, 'ratings'), this.ratings)
        saveToStorage(getUserKey(this.userId, 'searchHistory'), this.searchHistory)
        saveToStorage(getUserKey(this.userId, 'preferences'), this.preferences)
      }
    },
    
    addFavorite(spot) {
      if (!this.favorites.find(f => f.id === spot.id)) {
        this.favorites.push(spot)
        this.saveUserData()
      }
    },
    
    removeFavorite(spotId) {
      this.favorites = this.favorites.filter(f => f.id !== spotId)
      this.saveUserData()
    },
    
    addRating(spotId, rating) {
      const existing = this.ratings.find(r => r.spotId === spotId)
      if (existing) {
        existing.value = rating
      } else {
        this.ratings.push({ spotId, value: rating })
      }
      this.saveUserData()
    },
    
    addSearchHistory(keyword) {
      this.searchHistory = [
        keyword,
        ...this.searchHistory.filter(k => k !== keyword)
      ].slice(0, 10)
      this.saveUserData()
    },
    
    updatePreferences(preferences) {
      this.preferences = { ...this.preferences, ...preferences }
      this.saveUserData()
    }
  }
})