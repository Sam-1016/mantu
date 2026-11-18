const source = require('../../utils/data.js')
const ai = require('../../utils/ai.js')

Page({
  data: {
    statusBarHeight: 20,
    topPad: 64,
    profile: {
      name: '林间客',
      bio: '住在上海，偏爱慢一点的路线',
      city: '上海',
      avatar: '/images/avatar-1.jpg'
    },
    favCount: 4,
    footCount: 6,
    draftCount: 2,
    footprints: source.destinations.slice(0, 6),
    menus: [
      { title: '我的收藏', desc: '想走、还没走的路线', url: '/pages/favorites/favorites' },
      { title: '浏览足迹', desc: '最近翻过的攻略', url: '/pages/history/history' },
      { title: '行程草案', desc: '按天数排好的路线', url: '/pages/itinerary/itinerary' },
      { title: '偏好设置', desc: '提醒、图片与阅读', url: '/pages/settings/settings' },
      { title: '攻略管理后台', desc: '社区攻略的删除与重置', url: '/pages/admin/admin' },
      { title: '关于漫途', desc: '版本与内容说明', url: '/pages/about/about' }
    ]
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
      topPad: app.globalData.navBarHeight || 64
    })
  },

  onShow() {
    const app = getApp()
    const p = app.globalData.profile || {}
    const loggedIn = !!p.loggedIn
    this.setData({
      loggedIn: loggedIn,
      // 未登录时展示引导占位，登录后展示真实资料（缓存恢复，重开不丢）
      profile: loggedIn ? p : {
        name: '未登录',
        bio: '点击头像登录，同步你的资料与足迹',
        city: '',
        avatar: '/images/avatar-1.jpg'
      },
      favCount: source.getFavorites().length,
      // 当前登录为本地演示身份，未接入微信授权登录，界面需如实标注
      identityNote: loggedIn ? '演示身份 · 未接入微信登录' : '演示模式 · 未接入微信登录',
      footCount: this.data.footprints.length,
      draftCount: source.getDrafts().length + ai.getSavedPlans().length
    })
  },

  /** 点头像区域：未登录去登录页，已登录去资料页 */
  onProfileTap() {
    wx.navigateTo({
      url: this.data.loggedIn ? '/pages/profile/profile' : '/pages/login/login'
    })
  },

  goProfile() {
    this.onProfileTap()
  },

  goFav() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  goDrafts() {
    wx.navigateTo({ url: '/pages/itinerary/itinerary' })
  },

  onMenu(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  },

  onFoot(e) {
    wx.navigateTo({
      url: '/pages/destination-detail/destination-detail?id=' + e.currentTarget.dataset.id
    })
  }
})
