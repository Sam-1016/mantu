const source = require('../../utils/data.js')

/** 跳转容错：页面栈已满或 navigateTo 失败时改用 redirectTo，避免点击无响应 */
function nav(url) {
  wx.navigateTo({
    url: url,
    fail: function (err) {
      console.warn('[漫途] navigateTo 失败，改用 redirectTo：', url, err)
      wx.redirectTo({ url: url })
    }
  })
}

Page({
  data: {
    statusBarHeight: 20,
    topPad: 64,
    monthLabel: source.monthNames[new Date().getMonth()],
    quick: [
      { key: 'route', mark: '路', name: '路线推荐' },
      { key: 'photo', mark: '拍', name: '拍照识景' },
      { key: 'community', mark: '社', name: '旅行社区' },
      { key: 'itinerary', mark: '程', name: '行程草案' }
    ],
    entries: source.homeEntries,
    destinations: source.destinations,
    heroes: [],
    heroLabel: '01',
    heroTotal: 0,
    heroCurrent: 0,
    heroAuto: true,
    toc: [],
    bentoMain: {},
    bentoSide: [],
    guideTotal: source.guides.length
  },

  onLoad() {
    const app = getApp()
    // 首页内容分区复用攻略数据：轮播 3 篇、目录 3 篇、拼图 3 篇，互不重复
    const guides = source.guides || []
    const heroes = guides.slice(0, 3)
    const toc = guides.slice(3, 6)
    const bentoSide = guides.slice(7, 9)
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
      // 顶部内容避开右上角胶囊按钮：品牌在左，不与胶囊重叠
      topPad: (app.globalData.statusBarHeight || 20) + 8,
      heroes: heroes,
      heroTotal: heroes.length,
      toc: toc,
      bentoMain: guides[6] || {},
      bentoSide: bentoSide
    })
    this.syncMonth()
  },

  onShow() {
    this.syncMonth()
  },

  onHide() {
    this.clearMonthTimer()
    this.clearHeroTimer()
  },

  onUnload() {
    this.clearMonthTimer()
    this.clearHeroTimer()
  },

  /** 月份跟随系统时间：进入页面刷新一次，并每分钟校正，跨月也能自动更新 */
  syncMonth() {
    this.updateMonth()
    this.clearMonthTimer()
    this.monthTimer = setInterval(() => {
      this.updateMonth()
    }, 60000)
  },

  updateMonth() {
    const label = source.monthNames[new Date().getMonth()] || ''
    if (label && label !== this.data.monthLabel) {
      this.setData({ monthLabel: label })
    }
  },

  clearMonthTimer() {
    if (this.monthTimer) {
      clearInterval(this.monthTimer)
      this.monthTimer = null
    }
  },

  onHeroChange(e) {
    this.setHero(e.detail.current)
  },

  /** 手指按住时暂停自动轮播，避免手动滑动与自动切换互相抢动 */
  onHeroTouchStart() {
    this.clearHeroTimer()
    if (this.data.heroAuto) {
      this.setData({ heroAuto: false })
    }
  },

  /** 松手后停留 6 秒再恢复自动轮播，给用户留出阅读时间 */
  onHeroTouchEnd() {
    this.clearHeroTimer()
    this.heroTimer = setTimeout(() => {
      if (!this.data.heroAuto) {
        this.setData({ heroAuto: true })
      }
    }, 6000)
  },

  clearHeroTimer() {
    if (this.heroTimer) {
      clearTimeout(this.heroTimer)
      this.heroTimer = null
    }
  },

  onHeroPrev() {
    const total = this.data.heroes.length
    if (!total) return
    this.setHero((this.data.heroCurrent - 1 + total) % total)
    this.holdHeroAuto()
  },

  onHeroNext() {
    const total = this.data.heroes.length
    if (!total) return
    this.setHero((this.data.heroCurrent + 1) % total)
    this.holdHeroAuto()
  },

  /** 手动翻页后同样暂停自动轮播，6 秒后恢复 */
  holdHeroAuto() {
    this.onHeroTouchStart()
    this.onHeroTouchEnd()
  },

  setHero(index) {
    const i = index + 1
    this.setData({
      heroCurrent: index,
      heroLabel: i < 10 ? '0' + i : '' + i
    })
  },

  goSearch() {
    nav('/pages/search/search')
  },

  goMine() {
    wx.switchTab({ url: '/pages/mine/mine' })
  },

  onGuide(e) {
    nav('/pages/guide-detail/guide-detail?id=' + e.currentTarget.dataset.id)
  },

  onDest(e) {
    nav('/pages/destination-detail/destination-detail?id=' + e.currentTarget.dataset.id)
  },

  onQuick(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'route') {
      nav('/pages/route/route')
      return
    }
    if (key === 'photo') {
      this.goPhotoRecognize()
      return
    }
    if (key === 'community') {
      this.goCommunity()
      return
    }
    nav('/pages/itinerary/itinerary')
  },

  onEntry(e) {
    const app = getApp()
    const type = e.currentTarget.dataset.type
    const value = e.currentTarget.dataset.value
    if (type === 'guide') {
      app.globalData.guideFilter = value
      wx.switchTab({ url: '/pages/guides/guides' })
      return
    }
    app.globalData.destFilter = value
    wx.switchTab({ url: '/pages/destinations/destinations' })
  },

  goGuides() {
    wx.switchTab({ url: '/pages/guides/guides' })
  },

  goAiPlan() {
    nav('/pages/ai-plan/ai-plan')
  },

  goPhotoRecognize() {
    nav('/pages/photo-recognize/photo-recognize')
  },

  goMyGuides() {
    nav('/pages/guide-list/guide-list')
  },

  // 跳转攻略社区（社区页是 tabBar 页，必须用 switchTab）
  goCommunity() {
    wx.switchTab({ url: '/pages/community/community' })
  },

  goDests() {
    wx.switchTab({ url: '/pages/destinations/destinations' })
  }
})
