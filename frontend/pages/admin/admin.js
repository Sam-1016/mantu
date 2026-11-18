/**
 * ============================================================
 * 页面：攻略管理后台页（社区内容管理）
 * 功能：
 *   1. 读取社区攻略列表 —— 从小程序本地缓存读取；
 *   2. 删除攻略 —— 删除本地缓存中的对应条目；
 *   3. 重置演示数据 —— 一键恢复内置演示攻略
 *      （与社区广场页共用 utils/seed-guides.js 同一份数据）。
 * 入口：「我的」页菜单 -> 攻略管理后台。
 * ============================================================
 */

const STORAGE_KEY = 'community_guides' // 社区攻略列表缓存 key（与社区广场页一致）
const SEED_GUIDES = require('../../utils/seed-guides')

/**
 * 发布时间格式化（与社区广场页同一套展示规则）
 */
function fmtTime(ts) {
  const d = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + ' 分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前'
  if (diff < 86400000 * 7) return Math.floor(diff / 86400000) + ' 天前'
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

Page({
  data: {
    guides: [],   // 攻略列表
    total: 0,
    loading: true
  },

  onShow() {
    this.load()
  },

  /**
   * 加载列表：直接读取本地缓存
   */
  load() {
    this.setData({ loading: true })
    const list = wx.getStorageSync(STORAGE_KEY) || []
    this.renderList(list)
  },

  /** 预处理展示字段并渲染 */
  renderList(list) {
    const guides = list.map(item => {
      const kw = (item.keywords || '')
        .split(/[,，]/)
        .map(s => s.trim())
        .filter(Boolean)
      return Object.assign({}, item, {
        keywordList: kw,
        timeLabel: fmtTime(item.createdAt || Date.now())
      })
    })
    this.setData({ guides: guides, total: guides.length, loading: false })
  },

  /** 手动刷新 */
  onRefresh() {
    this.load()
  },

  /** 删除单条攻略 */
  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除攻略',
      content: '删除后不可恢复，确定删除该攻略吗？',
      confirmText: '删除',
      confirmColor: '#b3402a',
      success: res => {
        if (!res.confirm) return
        const list = (wx.getStorageSync(STORAGE_KEY) || []).filter(g => g.id !== id)
        wx.setStorageSync(STORAGE_KEY, list)
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  },

  /** 一键重置为内置演示数据 */
  onReset() {
    wx.showModal({
      title: '重置演示数据',
      content: '将清空当前全部攻略，恢复为内置演示攻略，确定吗？',
      confirmText: '重置',
      success: res => {
        if (!res.confirm) return
        const seed = SEED_GUIDES.slice()
        wx.setStorageSync(STORAGE_KEY, seed)
        this.load()
        wx.showToast({ title: '已重置', icon: 'success' })
      }
    })
  },

  /** 点击攻略卡片：跳转攻略详情页 */
  onCard(e) {
    wx.navigateTo({
      url: '/pages/community-detail/community-detail?id=' + e.currentTarget.dataset.id
    })
  }
})
