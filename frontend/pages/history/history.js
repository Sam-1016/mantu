const source = require('../../utils/data.js')

Page({
  data: {
    list: []
  },

  /** 每次进入都重新读取，保证新产生的浏览痕迹立刻出现 */
  onShow() {
    this.setData({ list: source.getHistory() })
  },

  onGuide(e) {
    wx.navigateTo({
      url: '/pages/guide-detail/guide-detail?id=' + e.currentTarget.dataset.id
    })
  }
})
