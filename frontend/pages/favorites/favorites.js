const source = require('../../utils/data.js')
const community = require('../../utils/community.js')

Page({
  data: {
    list: [],
    communityList: []
  },

  onShow() {
    this.setData({ list: source.getFavorites() })
    // 社区收藏来自云数据库，可跨设备查看
    community.myFavPosts().then((res) => {
      this.setData({ communityList: res.posts || [] })
    }).catch(() => {
      this.setData({ communityList: [] })
    })
  },

  onCommunity(e) {
    wx.navigateTo({
      url: '/pages/community-detail/community-detail?id=' + e.currentTarget.dataset.id
    })
  },

  onGuide(e) {
    wx.navigateTo({
      url: '/pages/guide-detail/guide-detail?id=' + e.currentTarget.dataset.id
    })
  },

  onUnfav(e) {
    source.toggleFavorite(e.currentTarget.dataset.id)
    this.setData({ list: source.getFavorites() })
  },

  goGuides() {
    wx.switchTab({ url: '/pages/guides/guides' })
  }
})
