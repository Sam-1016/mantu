const api = require('../../utils/api.js')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 64,
    stage: 'idle', // idle | loading | result
    imageSrc: '',
    name: '',
    intro: '',
    matched: false,
    destId: '',
    spotId: '',
    errorMsg: '',
    recording: false, // 录像识别采集中
    recordHint: '',
    uncertain: false,
    // 评价分析
    reviewLoading: false,
    review: null,
    platformText: '',
    shots: []
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
      navBarHeight: app.globalData.navBarHeight || 64
    })
  },

  /** 拍照 */
  onCamera() {
    this.chooseMedia(['camera'])
  },

  /** 从相册选择 */
  onAlbum() {
    this.chooseMedia(['album'])
  },

  chooseMedia(sourceType) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: sourceType,
      sizeType: ['compressed'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        this.setData({ imageSrc: tempPath, stage: 'loading', errorMsg: '' })
        this.readImages([tempPath])
      },
      fail: () => {
        // 用户取消
      }
    })
  },

  /** 先压缩再转 base64；质量 80、宽 1280 保留细节，超出云函数入参上限时改走云存储 */
  readImages(paths) {
    const compressed = []
    let pending = paths.length
    paths.forEach((p, i) => {
      wx.compressImage({
        src: p,
        quality: 80,
        compressedWidth: 1280,
        success: (r) => { compressed[i] = r.tempFilePath },
        fail: () => { compressed[i] = p },
        complete: () => {
          pending -= 1
          if (pending === 0) this.toBase64(compressed.filter(Boolean))
        }
      })
    })
  },

  toBase64(paths) {
    const fs = wx.getFileSystemManager()
    const list = []
    let pending = paths.length
    paths.forEach((p, i) => {
      fs.readFile({
        filePath: p,
        encoding: 'base64',
        success: (res) => { list[i] = res.data },
        complete: () => {
          pending -= 1
          if (pending > 0) return
          const valid = list.filter(Boolean)
          if (!valid.length) {
            this.setData({ stage: 'result', name: '图片读取失败', matched: false })
            return
          }
          // 云函数入参上限 1MB，超过 700KB 改为先上传云存储再传 fileID
          const total = valid.reduce((sum, x) => sum + x.length, 0)
          if (total > 700 * 1024) {
            this.uploadAndRecognize(paths)
            return
          }
          api.recognize(valid.length > 1 ? valid : valid[0])
            .then(d => this.showResult(d))
            .catch(e => this.showError(e))
        }
      })
    })
  },

  /** 图片较大时走云存储：上传后把 fileID 交给云函数读取 */
  uploadAndRecognize(paths) {
    wx.showLoading({ title: '上传图片…', mask: true })
    const ids = []
    let pending = paths.length
    paths.forEach((p, i) => {
      wx.cloud.uploadFile({
        cloudPath: 'recognize/' + Date.now() + '-' + i + '.jpg',
        filePath: p,
        success: (r) => { ids[i] = r.fileID },
        complete: () => {
          pending -= 1
          if (pending > 0) return
          wx.hideLoading()
          const valid = ids.filter(Boolean)
          if (!valid.length) {
            this.showError(new Error('图片上传失败，请重试'))
            return
          }
          api.recognizeByFile(valid)
            .then(d => this.showResult(d))
            .catch(e => this.showError(e))
        }
      })
    })
  },

  /** 统一展示识别结果 */
  showResult(data) {
    const uncertain = !!data.uncertain
    const name = uncertain ? '未能确定景点' : (data.name || '未识别出景点')
    this.setData({
      stage: 'result',
      name: name,
      intro: data.intro || '',
      matched: !!data.matched,
      uncertain: uncertain,
      destId: data.destId || '',
      spotId: data.spotId || '',
      review: null,
      reviewLoading: false,
      shots: []
    })
    // 识别成功后自动进入评价聚合分析
    if (data.matched && name) this.loadReview(name)
  },

  /** 未收录景点：进入 AI 探索（介绍 / 继续提问） */
  onExploreAI() {
    const name = this.data.name
    if (!name || this.data.uncertain) return
    wx.navigateTo({
      url: '/pages/ai-guide/ai-guide?spot=' + encodeURIComponent(name) +
        '&destId=' + encodeURIComponent(this.data.destId || '')
    })
  },

  /** 拉取该景点的多平台评价分析 */
  loadReview(name) {
    this.setData({ reviewLoading: true })
    api.spotReview(name)
      .then(d => {
        this.setData({
          review: d,
          reviewLoading: false,
          platformText: (d.sample && d.sample.platforms) ? d.sample.platforms.join(' · ') : ''
        })
        this.loadShots(name)
      })
      .catch(() => {
        this.setData({ reviewLoading: false, review: { enough: false, summary: '评价分析暂时不可用，请稍后重试。' } })
      })
  },

  /** 读取用户补充的评论截图 */
  loadShots(name) {
    if (!wx.cloud) return
    try {
      wx.cloud.database().collection('review_shots').where({ spot: name }).limit(9).get({
        success: res => { this.setData({ shots: res.data || [] }) },
        fail: () => {}
      })
    } catch (e) { /* 集合未创建时忽略 */ }
  },

  /** 上传评论截图作为佐证素材 */
  onAddShot() {
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        res.tempFiles.forEach(f => this.uploadShot(f.tempFilePath))
      }
    })
  },

  uploadShot(filePath) {
    const name = this.data.name
    const cloudPath = 'review-shots/' + Date.now() + '-' + Math.floor(Math.random() * 1000) + '.jpg'
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: res => {
        const shot = { spot: name, fileID: res.fileID, ts: Date.now() }
        this.setData({ shots: this.data.shots.concat([shot]) })
        try {
          wx.cloud.database().collection('review_shots').add({ data: shot }).catch(() => {})
        } catch (e) {}
        wx.showToast({ title: '截图已上传', icon: 'success' })
      },
      fail: () => wx.showToast({ title: '上传失败', icon: 'none' })
    })
  },

  /** 预览截图 */
  onPreviewShot(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: this.data.shots.map(s => s.fileID),
      current: url
    })
  },

  /** 复制评价原帖链接（小程序内不能直接打开外链） */
  onCopyUrl(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '链接已复制', icon: 'none' })
    })
  },

  showError(e) {
    this.setData({
      stage: 'result',
      name: '识别失败',
      intro: e.message || '请重试',
      matched: false,
      errorMsg: e.message
    })
  },

  /** 录像识别：先校验相机权限，再采集多帧 */
  onRecord() {
    wx.getSetting({
      success: (st) => {
        if (st.authSetting['scope.camera']) { this.startRecord(); return }
        wx.authorize({
          scope: 'scope.camera',
          success: () => this.startRecord(),
          fail: () => wx.showToast({ title: '需要相机权限', icon: 'none' })
        })
      }
    })
  },

  startRecord() {
    this._frames = []
    this.setData({ recording: true, recordHint: '对准景点，即将采集画面…', errorMsg: '' })
    setTimeout(() => {
      if (!this.data.recording) return
      this._ctx = wx.createCameraContext()
      this.captureFrame(0)
    }, 600)
  },

  captureFrame(i) {
    if (!this.data.recording) return
    const total = 3
    if (i >= total) { this.finishRecord(); return }
    this.setData({ recordHint: '对准景点，正在采集第 ' + (i + 1) + '/' + total + ' 帧…' })
    this._ctx.takePhoto({
      quality: 'low',
      success: (r) => { this._frames.push(r.tempImagePath) },
      complete: () => { setTimeout(() => this.captureFrame(i + 1), 900) }
    })
  },

  finishRecord() {
    const frames = this._frames.slice()
    const cover = frames[Math.floor(frames.length / 2)] || frames[0] || ''
    this.setData({ recording: false, stage: 'loading', imageSrc: cover })
    if (!frames.length) {
      this.setData({ stage: 'result', name: '录制失败', intro: '未能采集到画面', matched: false })
      return
    }
    this.readImages(frames)
  },

  onRecordCancel() {
    this.setData({ recording: false })
  },

  onCamError() {
    this.setData({ recording: false })
    wx.showToast({ title: '相机不可用', icon: 'none' })
  },

  /** 进入 AI 讲解 */
  goGuide() {
    if (!this.data.spotId) return
    wx.navigateTo({
      url: '/pages/ai-guide/ai-guide?spotId=' + this.data.spotId
    })
  },

  /** 重新拍摄 */
  onRetry() {
    this.setData({
      stage: 'idle', imageSrc: '', name: '', intro: '', errorMsg: '',
      uncertain: false, review: null, reviewLoading: false, platformText: '', shots: []
    })
  }
})
