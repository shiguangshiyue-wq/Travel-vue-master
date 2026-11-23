// src/utils/recommendation.js
import DOMPurify from 'dompurify';

export class CollaborativeFiltering {
  constructor() {
    this.userItemMatrix = new Map() // 用户-物品评分矩阵
    this.itemUsers = new Map() // 物品-用户映射
    this.userSimilarity = new Map() // 用户相似度矩阵
  }

  // 添加用户评分
  addRating(userId, itemId, rating) {
    if (!this.userItemMatrix.has(userId)) {
      this.userItemMatrix.set(userId, new Map())
    }
    this.userItemMatrix.get(userId).set(itemId, rating)
    
    if (!this.itemUsers.has(itemId)) {
      this.itemUsers.set(itemId, new Set())
    }
    this.itemUsers.get(itemId).add(userId)
  }

  // 计算用户相似度（皮尔逊相关系数）
  calculateSimilarity(user1, user2) {
    const ratings1 = this.userItemMatrix.get(user1)
    const ratings2 = this.userItemMatrix.get(user2)
    
    if (!ratings1 || !ratings2) return 0
    
    // 找出共同评分的物品
    const commonItems = []
    for (let [item, rating] of ratings1) {
      if (ratings2.has(item)) {
        commonItems.push(item)
      }
    }
    
    if (commonItems.length === 0) return 0
    
    // 计算平均评分
    let sum1 = 0, sum2 = 0
    for (let item of commonItems) {
      sum1 += ratings1.get(item)
      sum2 += ratings2.get(item)
    }
    const mean1 = sum1 / commonItems.length
    const mean2 = sum2 / commonItems.length
    
    // 计算皮尔逊相关系数
    let numerator = 0
    let denominator1 = 0
    let denominator2 = 0
    
    for (let item of commonItems) {
      const diff1 = ratings1.get(item) - mean1
      const diff2 = ratings2.get(item) - mean2
      numerator += diff1 * diff2
      denominator1 += diff1 * diff1
      denominator2 += diff2 * diff2
    }
    
    if (denominator1 === 0 || denominator2 === 0) return 0
    
    return numerator / (Math.sqrt(denominator1) * Math.sqrt(denominator2))
  }

  // 为用户推荐物品
  recommend(userId, topN = 10) {
    const userRatings = this.userItemMatrix.get(userId)
    if (!userRatings) return []
    
    // 找到最相似的用户
    const similarities = []
    for (let otherUser of this.userItemMatrix.keys()) {
      if (otherUser !== userId) {
        const similarity = this.calculateSimilarity(userId, otherUser)
        if (similarity > 0) {
          similarities.push({ user: otherUser, similarity })
        }
      }
    }
    
    // 按相似度排序
    similarities.sort((a, b) => b.similarity - a.similarity)
    
    // 获取Top K相似用户
    const topSimilarUsers = similarities.slice(0, 10)
    
    // 预测未评分物品的评分
    const predictions = new Map()
    for (let { user, similarity } of topSimilarUsers) {
      const otherRatings = this.userItemMatrix.get(user)
      for (let [item, rating] of otherRatings) {
        if (!userRatings.has(item)) {
          if (!predictions.has(item)) {
            predictions.set(item, { sum: 0, weight: 0 })
          }
          const pred = predictions.get(item)
          pred.sum += rating * similarity
          pred.weight += Math.abs(similarity)
        }
      }
    }
    
    // 计算预测评分
    const recommendations = []
    for (let [item, { sum, weight }] of predictions) {
      if (weight > 0) {
        const score = sum / weight
        recommendations.push({ itemId: item, score })
      }
    }
    
    // 按预测评分排序
    recommendations.sort((a, b) => b.score - a.score)
    return recommendations.slice(0, topN)
  }

  // 基于内容的推荐（基于标签）
  contentBasedRecommend(userHistory, allItems, userPreferences = {}) {
    // 提取用户偏好标签
    const preferences = {}
    
    userHistory.forEach(item => {
      item.tags?.forEach(tag => {
        preferences[tag] = (preferences[tag] || 0) + 1
      })
    })
    
    // 计算每个物品的匹配分数
    const scores = allItems.map(item => {
      let score = 0
      
      // 标签匹配
      if (item.tags) {
        item.tags.forEach(tag => {
          score += preferences[tag] || 0
        })
      }
      
      // 热度因素
      score += (item.rating || 0) * 0.3
      score += (item.comments || 0) / 100 * 0.2
      
      return { ...item, score }
    })
    
    // 排序并返回
    return scores.sort((a, b) => b.score - a.score)
  }
}

// 导出单例
export const recommendationEngine = new CollaborativeFiltering()

// ===================== 对话内容清洗工具（新增，不影响原有功能）=====================
/**
 * 1. 基础文本清洗
 */
export function cleanBasic(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ');
}

/**
 * 2. Markdown 格式清洗
 */
export function cleanMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`(.*?)`/g, '$1');
}

/**
 * 3. 敏感词过滤
 */
export function filterSensitive(str) {
  if (!str) return '';
  const sensitiveWords = [
    '敏感词1', '违规词2', '违法词3',
    '涉政词', '暴力词', '色情词'
  ];
  sensitiveWords.forEach(word => {
    const reg = new RegExp(word, 'gi');
    str = str.replace(reg, '*'.repeat(word.length));
  });
  return str;
}

/**
 * 4. XSS 安全清洗
 */
export function cleanXSS(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * 一站式全流程清洗
 */
export function cleanAll(content) {
  let result = cleanBasic(content);
  result = cleanMarkdown(result);
  result = filterSensitive(result);
  result = cleanXSS(result);
  return result;
}

export default {
  CollaborativeFiltering,
  recommendationEngine,
  cleanBasic,
  cleanMarkdown,
  filterSensitive,
  cleanXSS,
  cleanAll
};