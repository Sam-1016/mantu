/**
 * 页面：社区攻略详情
 * 数据来源：云开发数据库（云函数 community）；内置示例按 id 前缀 demo- 识别。
 * 支持点赞、收藏（需登录态 openid，由云函数处理），AI 优化建议写回作者自己的攻略。
 */

const community = require('../../utils/community.js')
const SEED_GUIDES = require('../../utils/seed-guides')
const api = require('../../utils/api.js')

function fmtTime(ts) {
  const d = new Date(ts)
  const hh = d.getHours() < 10 ? '0' + d.getHours() : '' + d.getHours()
  const mm = d.getMinutes() < 10 ? '0' + d.getMinutes() : '' + d.getMinutes()
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hh + ':' + mm
}

function decorate(guide) {
  const g = Object.assign({}, guide)
  g.timeLabel = g.createdAt ? fmtTime(g.createdAt) : '内置示例'
  g.keywordList = (g.keywords || '')
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean)
  return g
}

Page({
  data: {
    id: '',
    guide: null,
    isDemo: false,
    aiTips: '',
    aiLoading: false,
    liked: false,
    faved: false,
    likeCount: 0,
    favCount: 0,
    actionTip: '',
    loadError: ''
  },

  onLoad(options) {
    if (!options || !options.id) return
    const id = options.id
    this.setData({ id: id })

    if (id.indexOf('demo-') === 0) {
      const idx = parseInt(id.slice(5), 10)
      const seed = SEED_GUIDES[idx]
      if (!seed) {
        this.setData({ loadError: '示例内容不存在' })
        return
      }
      this.setData({
        guide: decorate(Object.assign({}, seed, { id: id })),
        isDemo: true,
        aiTips: seed.aiTips || ''
      })
      return
    }

    community.getPost(id).then((res) => {
      const post = decorate(res.post)
      this.setData({
        guide: post,
        aiTips: post.aiTips || '',
        liked: !!post.liked,
        faved: !!post.faved,
        likeCount: post.likeCount || 0,
        favCount: post.favCount || 0
      })
      if (!post.aiTips) this.fetchAi(post)
    }).catch((err) => {
      this.setData({ loadError: err.message || '加载失败，请稍后重试' })
    })
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      wx.switchTab({ url: '/pages/community/community' })
    }
  },

  /** 点赞：示例内容不支持，提示原因而不是假装成功 */
  onLike() {
    if (!this.data.guide) return
    if (this.data.isDemo) {
      wx.showToast({ title: '内置示例内容，不支持点赞', icon: 'none' })
      return
    }
    community.toggleLike(this.data.guide.id).then((res) => {
      const on = !!res.active
      this.setData({
        liked: on,
        likeCount: Math.max(0, this.data.likeCount + (on ? 1 : -1))
      })
    }).catch((err) => {
      wx.showToast({ title: err.message || '点赞失败', icon: 'none' })
    })
  },

  /** 收藏：写入云数据库，我的收藏页可跨设备看到 */
  onFav() {
    if (!this.data.guide) return
    if (this.data.isDemo) {
      wx.showToast({ title: '内置示例内容，不支持收藏', icon: 'none' })
      return
    }
    community.toggleFav(this.data.guide.id).then((res) => {
      const on = !!res.active
      this.setData({
        faved: on,
        favCount: Math.max(0, this.data.favCount + (on ? 1 : -1))
      })
      wx.showToast({ title: on ? '已收藏' : '已取消收藏', icon: 'none' })
    }).catch((err) => {
      wx.showToast({ title: err.message || '收藏失败', icon: 'none' })
    })
  },

  retryAi() {
    if (this.data.guide) this.fetchAi(this.data.guide)
  },

  fetchAi(guide) {
    this.setData({ aiLoading: true })
    const prompt =
      '你是一位文旅路线规划助手。请基于下面这条攻略的亮点关键词和详细行程，对攻略进行润色，' +
      '补充游玩建议、优化路线安排、补充避坑提示，输出精简的中文建议：\n' +
      '攻略标题：' + guide.title + '\n' +
      '目的地：' + guide.destination + '\n' +
      '亮点关键词：' + guide.keywords + '\n' +
      '详细行程：' + guide.detail + '\n' +
      '避雷提醒：' + guide.avoid

    api.chat(prompt).then((res) => {
      const tips = (res && res.reply) ? String(res.reply).replace(/<think>[\s\S]*?<\/think>/g, '').trim() : ''
      if (!tips) {
        this.setData({ aiLoading: false })
        return
      }
      this.setData({ aiTips: tips, aiLoading: false })
      if (!this.data.isDemo) {
        // 只有作者本人能写回，云函数会校验 openid
        community.updateAiTips(guide.id, tips).catch(() => {})
      }
    }).catch(() => {
      this.setData({ aiLoading: false })
    })
  }
})
