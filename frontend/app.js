/**
 * 云存储高清图运行时升级（内联在 app.js，避免新增文件触发开发者工具缓存问题）
 * 页面先用本地缩略图秒显，随后把已上传云存储的景点/美食图替换为高清地址。
 */
const CDN_PREFIX = 'cloud://cloud1-d2gu9ngyu916699c8.636c-cloud1-d2gu9ngyu916699c8-1533503224'
const cdnCache = {}
let cdnLastFail = 0

function cdnPathOf(local) {
  const s = String(local)
  let m = s.match(/^\/images\/spots\/(s(\d+))\.jpg$/)
  if (m && Number(m[2]) >= 23) return '/spots/' + m[1] + '.jpg'
  m = s.match(/^\/images\/foods\/(.+)\.jpg$/)
  if (m) return '/foods/' + m[1] + '.jpg'
  return ''
}

function cdnCollect(node, out, seen) {
  if (typeof node === 'string') {
    const p = cdnPathOf(node)
    if (p && !seen[p]) {
      seen[p] = true
      out.push(node)
    }
    return
  }
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach(function (x) { cdnCollect(x, out, seen) })
    return
  }
  Object.keys(node).forEach(function (k) { cdnCollect(node[k], out, seen) })
}

function cdnReplace(node) {
  if (typeof node === 'string') return cdnCache[node] || node
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(cdnReplace)
  const out = {}
  const keys = Object.keys(node)
  for (let i = 0; i < keys.length; i++) out[keys[i]] = cdnReplace(node[keys[i]])
  return out
}

function cdnApply(page) {
  const replaced = cdnReplace(page.data)
  const patch = {}
  Object.keys(replaced).forEach(function (k) {
    if (JSON.stringify(replaced[k]) !== JSON.stringify(page.data[k])) patch[k] = replaced[k]
  })
  if (Object.keys(patch).length) page.setData(patch)
}

function cdnUpgrade(page) {
  if (!page || !page.data || !wx.cloud) return
  if (Date.now() - cdnLastFail < 5 * 60 * 1000) return
  const list = []
  cdnCollect(page.data, list, {})
  if (!list.length) return
  const need = list.filter(function (p) { return !cdnCache[p] })
  if (!need.length) {
    cdnApply(page)
    return
  }
  wx.cloud.getTempFileURL({
    fileList: need.map(function (p) { return CDN_PREFIX + cdnPathOf(p) })
  }).then(function (res) {
    let ok = 0
    ;(res.fileList || []).forEach(function (f, i) {
      if (f.tempFileURL) {
        cdnCache[need[i]] = f.tempFileURL
        ok++
      }
    })
    if (!ok) {
      cdnLastFail = Date.now()
      return
    }
    cdnApply(page)
  }).catch(function () {
    cdnLastFail = Date.now()
  })
}

// 页面首次渲染后自动升级图片
const _Page = Page
Page = function (options) {
  const _onReady = options.onReady
  options.onReady = function () {
    if (_onReady) _onReady.apply(this, arguments)
    try { cdnUpgrade(this) } catch (e) {}
  }
  return _Page(options)
}

App({
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d2gu9ngyu916699c8',
        traceUser: true
      })
    }

    let info = {}
    try {
      info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    } catch (err) {
      info = wx.getSystemInfoSync()
    }
    const statusBarHeight = info.statusBarHeight || 20
    this.globalData.statusBarHeight = statusBarHeight
    this.globalData.navBarHeight = statusBarHeight + 44

    // 启动时从缓存恢复登录资料与收藏，保证重开小程序不重置
    try {
      const saved = wx.getStorageSync('user_profile')
      if (saved && saved.loggedIn) {
        this.globalData.profile = Object.assign({}, this.globalData.profile, saved)
      }
      const favIds = wx.getStorageSync('favorite_ids')
      if (Array.isArray(favIds)) {
        this.globalData.favoriteIds = favIds
      }
    } catch (e) {}

    // 首次启动时初始化社区数据库集合（已存在会跳过）
    if (wx.cloud && !wx.getStorageSync('community_db_ready')) {
      wx.cloud.callFunction({ name: 'community', data: { action: 'init' } })
        .then(() => { wx.setStorageSync('community_db_ready', 1) })
        .catch(() => {})
    }
  },
  globalData: {
    statusBarHeight: 20,
    navBarHeight: 64,
    guideFilter: '',
    destFilter: '',
    favoriteIds: ['dali-3d', 'kyoto-day', 'chengdu-48h', 'bali-5'],
    profile: {
      name: '林间客',
      bio: '住在上海，偏爱慢一点的路线',
      city: '上海',
      avatar: '/images/avatar-1.jpg'
    }
  }
})
