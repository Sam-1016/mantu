const api = require('../../utils/api.js')

Page({
  data: {
    checking: false,
    checked: false,
    ok: null,
    checks: [],
    config: null,
    modelsLoading: false,
    modelsLoaded: false,
    models: [],
    modelsError: '',
    probeLoading: false,
    cdnPrefix: ''
  },

  /** AI 连接自检：运行时 / Key / 接口地址 / 文本模型 / 视觉模型 */
  onSelfCheck() {
    if (this.data.checking) return
    this.setData({ checking: true, modelsError: '' })
    api.health(true)
      .then(res => {
        this.setData({
          checking: false,
          checked: true,
          ok: !!res.ok,
          checks: res.checks || [],
          config: res.config || null
        })
      })
      .catch(err => {
        this.setData({
          checking: false,
          checked: true,
          ok: false,
          checks: [{
            name: 'cloudRuntime',
            label: '云函数调用',
            ok: false,
            type: 'CALL_FAILED',
            message: err.message || '云函数调用失败'
          }]
        })
      })
  },

  /** 拉取账号可用模型，核对环境变量里的模型名是否存在 */
  onLoadModels() {
    if (this.data.modelsLoading) return
    this.setData({ modelsLoading: true, modelsError: '' })
    api.listModels()
      .then(res => {
        const ids = res.ids || []
        const config = this.data.config
        const used = config ? [config.chatModel, config.visionModel, config.ttsModel] : []
        const models = ids.slice(0, 40).map(id => ({
          id: id,
          used: used.indexOf(id) >= 0
        }))
        this.setData({ modelsLoading: false, modelsLoaded: true, models: models, modelTotal: ids.length })
      })
      .catch(err => {
        this.setData({
          modelsLoading: false,
          modelsLoaded: true,
          modelsError: err.message || '模型列表获取失败'
        })
      })
  },

  onCopyModel(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.id })
  },

  /** 探测云存储前缀，用于拼接高清图地址 */
  onProbeCdn() {
    if (this.data.probeLoading) return
    this.setData({ probeLoading: true })
    api.storageProbe()
      .then(res => {
        this.setData({ probeLoading: false, cdnPrefix: res.prefix || '' })
        wx.setClipboardData({ data: res.prefix || '' })
      })
      .catch(err => {
        this.setData({ probeLoading: false })
        wx.showToast({ title: err.message || '探测失败', icon: 'none' })
      })
  }
})
