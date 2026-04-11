// src/stores/recommendation.js
import { defineStore } from 'pinia'
import { recommendationEngine } from '@/utils/recommendation'
import { useUserStore } from './user'

export const useRecommendationStore = defineStore('recommendation', {
  state: () => ({
    recommendations: [],
    loading: false,
    lastUpdate: null
  }),
  
  actions: {
    async generateRecommendations(allSpots) {
      this.loading = true
      const userStore = useUserStore()
      
      try {
        // 添加用户评分到推荐引擎
        userStore.ratings.forEach(rating => {
          recommendationEngine.addRating(userStore.userId, rating.spotId, rating.value)
        })
        
        // 获取协同过滤推荐
        const cfRecommendations = recommendationEngine.recommend(userStore.userId, 10)
        
        // 获取内容推荐
        const contentRecommendations = recommendationEngine.contentBasedRecommend(
          userStore.favorites,
          allSpots,
          userStore.preferences
        )
        
        // 合并推荐结果
        const merged = new Map()
        
        // 协同过滤推荐权重 0.6
        cfRecommendations.forEach(rec => {
          const spot = allSpots.find(s => s.id === rec.itemId)
          if (spot) {
            merged.set(spot.id, {
              ...spot,
              score: rec.score * 0.6,
              reason: '基于相似用户的推荐'
            })
          }
        })
        
        // 内容推荐权重 0.4
        contentRecommendations.forEach(rec => {
          if (merged.has(rec.id)) {
            merged.get(rec.id).score += rec.score * 0.4
            merged.get(rec.id).reason = '综合推荐'
          } else {
            merged.set(rec.id, {
              ...rec,
              score: rec.score * 0.4,
              reason: '基于您的喜好推荐'
            })
          }
        })
        
        // 转换为数组并排序
        this.recommendations = Array.from(merged.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 20)
        
        this.lastUpdate = new Date()
      } catch (error) {
        console.error('生成推荐失败', error)
      } finally {
        this.loading = false
      }
    },
    
    clearRecommendations() {
      this.recommendations = []
      this.lastUpdate = null
    }
  }
})