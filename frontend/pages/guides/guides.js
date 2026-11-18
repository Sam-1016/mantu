const source = require('../../utils/data.js')

function splitList(filter) {
  const sourceList = filter === '全部'
    ? source.guides
    : source.guides.filter(function (item) { return item.category === filter })
  return {
    filter: filter,
    total: sourceList.length,
    featured: filter === '全部' ? sourceList[0] : null,
    list: filter === '全部' ? sourceList.slice(1) : sourceList
  }
}

Page({
  data: Object.assign({
    statusBarHeight: 20,
    topPad: 64,
    filters: source.guideFilters
  }, splitList('全部')),

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
      topPad: app.globalData.navBarHeight || 64
    })
  },

  onShow() {
    const app = getApp()
    const pending = app.globalData.guideFilter
    if (pending) {
      app.globalData.guideFilter = ''
      this.setData(splitList(pending))
    }
  },

  onFilter(e) {
    this.setData(splitList(e.currentTarget.dataset.filter))
  },

  onGuide(e) {
    wx.navigateTo({
      url: '/pages/guide-detail/guide-detail?id=' + e.currentTarget.dataset.id
    })
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  }
})
