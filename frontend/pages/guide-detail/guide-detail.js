const source = require('../../utils/data.js')

Page({
  data: {
    ready: false,
    guide: null,
    related: [],
    fav: false,
    followed: false,
    navSolid: false,
    navBarHeight: 64,
    showShare: false
  },

  onLoad(query) {
    const guide = source.getGuide(query.id)
    if (guide) source.addHistory(guide.id) // 记录浏览足迹，重开小程序仍可追溯
    const app = getApp()
    this.setData({
      ready: true,
      guide: guide,
      related: guide ? source.relatedGuides(guide, 3) : [],
      fav: guide ? source.isFavorite(guide.id) : false,
      navSolid: !guide,
      navBarHeight: app.globalData.navBarHeight || 64
    })
  },

  onShow() {
    if (this.data.guide) {
      this.setData({ fav: source.isFavorite(this.data.guide.id) })
    }
  },

  onPageScroll(e) {
    if (!this.data.guide) return
    const solid = e.scrollTop > 80
    if (solid !== this.data.navSolid) {
      this.setData({ navSolid: solid })
    }
  },

  onAnchor(e) {
    wx.pageScrollTo({
      selector: '#' + e.currentTarget.dataset.target,
      duration: 280,
      offsetTop: -((getApp().globalData.navBarHeight || 88) + 8)
    })
  },

  onFav() {
    if (!this.data.guide) return
    const fav = source.toggleFavorite(this.data.guide.id)
    this.setData({ fav: fav })
    wx.showToast({
      title: fav ? '已收藏，可在「我的」查看' : '已取消收藏',
      icon: 'none'
    })
  },

  openShare() {
    this.setData({ showShare: true })
  },

  closeShare() {
    this.setData({ showShare: false })
  },

  copyShare() {
    const guide = this.data.guide
    if (!guide) return
    const text = '漫途 · ' + guide.title + '\n/pages/guide-detail/guide-detail?id=' + guide.id
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'none' })
      },
      fail: () => {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' })
      }
    })
    this.closeShare()
  },

  tipTimeline() {
    this.closeShare()
    wx.showModal({
      title: '分享到朋友圈',
      content: '微信暂不支持在小程序内直接唤起朋友圈分享，请点击右上角「···」选择「分享到朋友圈」。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  noop() {},

  onFollow() {
    this.setData({ followed: !this.data.followed })
  },

  onPlan() {
    if (!this.data.guide) return
    const id = this.data.guide.id
    const added = source.addDraft(id)
    wx.showToast({
      title: added ? '已加入我的行程草案' : '已在你的行程草案中',
      icon: 'none'
    })
    setTimeout(() => {
      const url = '/pages/itinerary/itinerary?id=' + id
      wx.navigateTo({
        url: url,
        fail: function () {
          // 页面栈已满时改用 redirectTo，避免按钮看起来没反应
          wx.redirectTo({ url: url })
        }
      })
    }, added ? 500 : 0)
  },

  onAiGuide() {
    wx.navigateTo({
      url: '/pages/ai-guide/ai-guide?guideId=' + this.data.guide.id
    })
  },

  onGuide(e) {
    wx.navigateTo({
      url: '/pages/guide-detail/guide-detail?id=' + e.currentTarget.dataset.id
    })
  },

  onDest() {
    wx.navigateTo({
      url: '/pages/destination-detail/destination-detail?id=' + this.data.guide.destId
    })
  },

  goGuides() {
    wx.switchTab({ url: '/pages/guides/guides' })
  },

  onShareAppMessage() {
    const guide = this.data.guide
    return {
      title: guide ? guide.title : '漫途旅行攻略',
      path: '/pages/guide-detail/guide-detail?id=' + (guide ? guide.id : '')
    }
  },

  onShareTimeline() {
    const guide = this.data.guide
    return {
      title: guide ? guide.title : '漫途旅行攻略',
      query: 'id=' + (guide ? guide.id : '')
    }
  }
})
