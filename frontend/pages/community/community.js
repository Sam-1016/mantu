/**
 * 页面：社区广场（公共 UGC 社区）
 * 数据来源：云开发数据库 community_posts（云函数 community 读写）。
 * 项目内置的示例攻略单独标记为「内置示例」，与真实用户发布内容区分。
 */

const community = require('../../utils/community.js')
const SEED_GUIDES = require('../../utils/seed-guides')

function fmtTime(ts) {
  const d = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + ' 分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前'
  if (diff < 86400000 * 7) return Math.floor(diff / 86400000) + ' 天前'
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

function prep(item, demo) {
  const kw = (item.keywords || '')
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean)
  const excerpt = (item.detail || '').replace(/\n/g, ' ').slice(0, 45)
  return Object.assign({}, item, {
    demo: !!demo,
    keywordList: kw,
    excerpt: excerpt + ((item.detail || '').length > 45 ? '…' : ''),
    timeLabel: item.createdAt ? fmtTime(item.createdAt) : '示例内容',
    likeCount: item.likeCount || 0
  })
}

Page({
  data: {
    guides: [],
    total: 0,
    realCount: 0,
    loading: true,
    offlineTip: ''
  },

  onShow() {
    this.render()
  },

  onPullDownRefresh() {
    this.render(() => wx.stopPullDownRefresh())
  },

  render(done) {
    community.listPosts(30).then((res) => {
      const real = (res.posts || []).map(p => prep(p, false))
      const demo = SEED_GUIDES.map((g, i) => prep(Object.assign({}, g, {
        id: 'demo-' + i,
        createdAt: 0
      }), true))
      const list = real.concat(demo)
      this.setData({
        guides: list,
        total: list.length,
        realCount: real.length,
        loading: false,
        offlineTip: ''
      })
      if (done) done()
    }).catch(() => {
      // 云端不可用时只展示内置示例，并明确提示
      const demo = SEED_GUIDES.map((g, i) => prep(Object.assign({}, g, {
        id: 'demo-' + i,
        createdAt: 0
      }), true))
      this.setData({
        guides: demo,
        total: demo.length,
        realCount: 0,
        loading: false,
        offlineTip: '云端社区暂不可用，当前仅展示内置示例内容'
      })
      if (done) done()
    })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' })
  },

  onCard(e) {
    wx.navigateTo({
      url: '/pages/community-detail/community-detail?id=' + e.currentTarget.dataset.id
    })
  }
})
