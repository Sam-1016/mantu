Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    solid: {
      type: Boolean,
      value: true
    },
    theme: {
      type: String,
      value: 'dark'
    },
    placeholder: {
      type: Boolean,
      value: true
    },
    align: {
      type: String,
      value: 'center'
    }
  },
  data: {
    statusBarHeight: 20
  },
  lifetimes: {
    attached() {
      const app = getApp()
      this.setData({
        statusBarHeight: app.globalData.statusBarHeight || 20
      })
    }
  },
  methods: {
    onBack() {
      const pages = getCurrentPages()
      // 页面栈只剩当前页（如从分享卡片、redirectTo 进入）时直接回首页
      if (pages.length > 1) {
        wx.navigateBack({
          fail: function () {
            wx.switchTab({ url: '/pages/index/index' })
          }
        })
        return
      }
      wx.switchTab({
        url: '/pages/index/index',
        fail: function () {
          wx.reLaunch({ url: '/pages/index/index' })
        }
      })
    }
  }
})
