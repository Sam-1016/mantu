const source = require('../../utils/data.js')

// 热门目的地（按此顺序置顶）
const HOT_IDS = ['dali', 'kyoto', 'sanya', 'chengdu', 'xiamen']

function rank(a, b) {
  const ha = HOT_IDS.indexOf(a.id)
  const hb = HOT_IDS.indexOf(b.id)
  const wa = ha === -1 ? HOT_IDS.length : ha
  const wb = hb === -1 ? HOT_IDS.length : hb
  if (wa !== wb) return wa - wb
  return (b.guideCount || 0) - (a.guideCount || 0)
}

function splitList(filter) {
  let list = source.destinations
  if (filter === '国内' || filter === '国际') {
    list = list.filter(function (item) { return item.region === filter })
  } else if (filter !== '全部') {
    list = list.filter(function (item) { return item.group === filter })
  }
  // 热门置顶 + 攻略多的在前，同时给卡片打上热门标记
  list = list.slice().sort(rank).map(function (item) {
    return Object.assign({}, item, { hot: HOT_IDS.indexOf(item.id) >= 0 })
  })
  return {
    filter: filter,
    total: list.length,
    list: list
  }
}

Page({
  data: Object.assign({
    statusBarHeight: 20,
    topPad: 64,
    filters: source.destFilters
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
    const pending = app.globalData.destFilter
    if (pending) {
      app.globalData.destFilter = ''
      this.setData(splitList(pending))
    }
  },

  onFilter(e) {
    this.setData(splitList(e.currentTarget.dataset.filter))
  },

  onDest(e) {
    wx.navigateTo({
      url: '/pages/destination-detail/destination-detail?id=' + e.currentTarget.dataset.id
    })
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  }
})
