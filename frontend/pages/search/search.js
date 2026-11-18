const source = require('../../utils/data.js')
const routes = require('../../utils/routes.js')

Page({
  data: {
    keyword: '',
    recent: source.defaultRecent,
    hotWords: source.hotWords,
    guides: [],
    destinations: [],
    spots: [],        // 景点 + 知识命中
    searched: false
  },

  onInput(e) {
    this.update(e.detail.value || '', false)
  },

  onWord(e) {
    this.update(e.currentTarget.dataset.word, true)
  },

  onClear() {
    this.update('', false)
  },

  update(keyword, save) {
    const text = (keyword || '').trim()
    let recent = this.data.recent
    if (save && text) {
      recent = [text].concat(recent.filter(function (item) { return item !== text })).slice(0, 8)
    }
    if (!text) {
      this.setData({
        keyword: '',
        searched: false,
        guides: [],
        destinations: [],
        spots: [],
        recent: recent
      })
      return
    }
    const spots = source.filterSpots(text)
    this.setData({
      keyword: text,
      searched: true,
      guides: source.filterGuides(text),
      destinations: source.filterDestinations(text),
      spots: spots,
      recent: recent
    })
  },

  onGuide(e) {
    wx.navigateTo({
      url: '/pages/guide-detail/guide-detail?id=' + e.currentTarget.dataset.id
    })
  },

  onDest(e) {
    wx.navigateTo({
      url: '/pages/destination-detail/destination-detail?id=' + e.currentTarget.dataset.id
    })
  },

  onSpot(e) {
    const destId = e.currentTarget.dataset.dest
    const spot = e.currentTarget.dataset.spot
    wx.navigateTo({
      url: '/pages/route/route?destId=' + destId + '&spot=' + encodeURIComponent(spot)
    })
  }
})
