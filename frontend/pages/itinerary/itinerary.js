const source = require('../../utils/data.js')
const ai = require('../../utils/ai.js')

Page({
  data: {
    mode: 'list',
    drafts: [],
    aiPlans: [],
    guide: null,
    stops: [],
    isAi: false
  },

  onLoad(query) {
    if (query.ai && query.id) {
      const plan = ai.getSavedPlan(query.id)
      this.setData({
        mode: 'plan',
        isAi: true,
        guide: plan,
        stops: plan ? plan.stops : []
      })
      return
    }
    if (query.id) {
      const guide = source.getGuide(query.id)
      this.setData({
        mode: 'plan',
        isAi: false,
        guide: guide,
        stops: guide ? guide.route.split(' → ') : []
      })
      return
    }
    this.loadList()
  },

  onShow() {
    if (this.data.mode === 'list') this.loadList()
  },

  loadList() {
    this.setData({
      mode: 'list',
      drafts: source.getDrafts(),
      aiPlans: ai.getSavedPlans()
    })
  },

  onOpen(e) {
    wx.navigateTo({
      url: '/pages/itinerary/itinerary?id=' + e.currentTarget.dataset.id
    })
  },

  onOpenAi(e) {
    wx.navigateTo({
      url: '/pages/itinerary/itinerary?ai=1&id=' + e.currentTarget.dataset.id
    })
  },

  onRemoveAi() {
    const guide = this.data.guide
    if (!guide) return
    wx.showModal({
      title: '删除这条 AI 行程？',
      content: guide.title,
      confirmText: '删除',
      confirmColor: '#c4622d',
      success: (res) => {
        if (!res.confirm) return
        ai.removeSavedPlan(guide.id)
        this.back()
      }
    })
  },

  // 上一页就是同一篇攻略时直接返回，避免反复 navigateTo 把页面栈堆满
  onGuide() {
    const guide = this.data.guide
    if (!guide) return
    const pages = getCurrentPages()
    const prev = pages[pages.length - 2]
    if (prev && prev.route === 'pages/guide-detail/guide-detail' && prev.options && prev.options.id === guide.id) {
      wx.navigateBack()
      return
    }
    const url = '/pages/guide-detail/guide-detail?id=' + guide.id
    wx.navigateTo({
      url: url,
      fail: function () {
        wx.redirectTo({ url: url })
      }
    })
  },

  back() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({
        fail: function () {
          wx.switchTab({ url: '/pages/index/index' })
        }
      })
      return
    }
    wx.switchTab({ url: '/pages/index/index' })
  },

  goAiPlan() {
    wx.navigateTo({ url: '/pages/ai-plan/ai-plan' })
  }
})
