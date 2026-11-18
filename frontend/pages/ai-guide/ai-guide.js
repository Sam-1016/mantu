const ai = require('../../utils/ai.js')
const api = require('../../utils/api.js')
const spots = require('../../utils/spots.js')

const STYLES = ['历史学者', '故事讲述者', '趣味导游']
const DEFAULT_FAQS = [
  '这里有什么历史故事？',
  '最佳游玩时间是几点？',
  '有什么必看的亮点？',
  '附近有什么好吃的？'
]

Page({
  data: {
    navBarHeight: 64,
    ready: false,
    found: true,
    title: '',
    sub: '',
    cover: '',
    spotName: '',
    spotId: '',
    destId: '',
    styles: STYLES,
    styleIndex: 0,
    topics: [],
    faqs: DEFAULT_FAQS,
    sources: null,
    legendTag: '',
    sourceOpen: false,
    messages: [],
    input: '',
    sending: false,
    audio: { url: '', playing: false, loading: false, duration: 0 },
    durationMode: 'quick', // quick | fun | deep
    panelOpen: true // 顶部信息面板是否展开
  },

  audioCtx: null,
  panelTouchY: 0,

  onLoad(query) {
    const app = getApp()
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 })

    const spotName = query.spot ? decodeURIComponent(query.spot) : ''
    const spotId = query.spotId || ''
    const destId = query.destId || ''
    const presetQ = query.q ? decodeURIComponent(query.q) : ''

    // 景点讲解模式
    if (spotName) {
      const spot = spots.getSpotById(spotId) || spots.getSpot(destId, spotName)
      const k = (spot && spot.knowledge) || {}
      const title = spot ? spot.name : spotName
      this.setData({
        ready: true,
        found: true,
        title: title,
        sub: (spot ? spot.destName : '') + (spot ? ' · 景点讲解' : ''),
        cover: spot ? spot.image : '',
        spotName: spotName,
        spotId: spotId || (spot ? spot.id : ''),
        destId: spot ? spot.destId : destId,
        faqs: (k.faqs && k.faqs.length) ? k.faqs : DEFAULT_FAQS,
        sources: spots.getSources(title),
        legendTag: spots.legendTag(),
        sourceOpen: false
      })
      // 从常见问题进入时直接提问，否则自动生成开场白讲解
      if (presetQ) {
        this.pushAndAsk(presetQ)
      } else {
        this.sendAutoIntro()
      }
      return
    }

    // 攻略/目的地讲解模式（兼容原有 buildNarration）
    const payload = ai.buildNarration({ guideId: query.guideId || '', destId: destId })
    if (!payload || !payload.topics.length) {
      this.setData({ ready: true, found: false })
      return
    }
    this.setData({
      ready: true,
      found: true,
      title: payload.title,
      sub: payload.sub,
      cover: payload.cover,
      topics: payload.topics
    })
    // 把 5 主题作为首条消息展示
    const first = payload.topics[0]
    this.setData({
      messages: [{ role: 'assistant', content: first.paras.join('\n\n') }]
    })
  },

  onUnload() {
    this.destroyAudio()
  },

  destroyAudio() {
    this.clearDockTimer()
    if (this.audioCtx) {
      try { this.audioCtx.destroy() } catch (e) {}
      this.audioCtx = null
    }
  },

  /** 语音不再播放后 5 秒自动收起底部播放器 */
  scheduleDockHide() {
    this.clearDockTimer()
    this.dockTimer = setTimeout(() => {
      this.dockTimer = null
      this.destroyAudio()
      this.setData({ 'audio.url': '', 'audio.playing': false, 'audio.loading': false })
    }, 5000)
  },

  clearDockTimer() {
    if (this.dockTimer) {
      clearTimeout(this.dockTimer)
      this.dockTimer = null
    }
  },

  /** 自动开场白：根据景点知识生成一段介绍 */
  sendAutoIntro() {
    const style = STYLES[this.data.styleIndex]
    const prompt = '请用「' + style + '」的风格，介绍一下' + this.data.title +
      '，包括历史由来和文化背景，150 字左右。'
    this.pushAndAsk(prompt)
  },

  /** 推送一条用户消息并请求 AI */
  pushAndAsk(content) {
    if (!content) return
    const messages = this.data.messages.concat([{ role: 'user', content: content }])
    this.setData({ messages: messages, sending: true, input: '' })
    this.callAi(messages)
  },

  /** 调用后端多轮对话 */
  callAi(messages) {
    const style = STYLES[this.data.styleIndex]
    api.spotChat(messages, this.data.spotId, style, this.data.spotName).then((res) => {
      const reply = res.reply || '（AI 暂时没有回答）'
      this.setData({
        messages: messages.concat([{ role: 'assistant', content: reply }]),
        sending: false
      })
    }).catch((e) => {
      this.setData({
        messages: messages.concat([{ role: 'assistant', content: 'AI 服务暂时不可用：' + (e.message || '请稍后重试') }]),
        sending: false
      })
    })
  },

  /** 发送输入框消息 */
  onSend() {
    const text = this.data.input.trim()
    if (!text || this.data.sending) return
    this.pushAndAsk(text)
  },

  onInput(e) {
    this.setData({ input: e.detail.value })
  },

  /** 点击常见问题 */
  onFaq(e) {
    if (this.data.sending) return
    this.pushAndAsk(e.currentTarget.dataset.q)
  },

  /** 点击原有主题 pill（总览/怎么走/吃什么/住哪里/避坑） */
  onTopic(e) {
    if (this.data.sending) return
    const key = e.currentTarget.dataset.key
    const map = {
      overview: '请介绍这个景点的整体情况和亮点',
      route: '推荐怎么游玩这个景点？路线怎么走？',
      food: '这个景点附近有什么好吃的？',
      stay: '在这附近住哪里比较方便？',
      tips: '游玩这个景点有什么需要注意的避坑建议？'
    }
    this.pushAndAsk(map[key] || '请介绍一下')
  },

  /** 切换讲解风格 */
  onStyle(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ styleIndex: idx })
  },

  /** 切换时长模式 */
  onDuration(e) {
    this.setData({ durationMode: e.currentTarget.dataset.mode })
  },

  /** 展开/收起顶部面板 */
  onTogglePanel() {
    this.setData({ panelOpen: !this.data.panelOpen })
  },

  /** 记录手指起点，用于判断上滑手势 */
  onPanelTouchStart(e) {
    this.panelTouchY = e.touches[0].clientY
  },

  /** 上滑收起面板，下滑展开 */
  onPanelTouchEnd(e) {
    const dy = e.changedTouches[0].clientY - this.panelTouchY
    if (dy < -30 && this.data.panelOpen) this.setData({ panelOpen: false })
    else if (dy > 30 && !this.data.panelOpen) this.setData({ panelOpen: true })
  },

  /** 播放某条 AI 回复的语音 */
  onPlayVoice(e) {
    const idx = e.currentTarget.dataset.index
    const msg = this.data.messages[idx]
    if (!msg || msg.role !== 'assistant') return
    let text = msg.content
    const mode = this.data.durationMode
    // 按时长模式截取文本
    if (mode === 'quick') text = text.slice(0, 120)
    else if (mode === 'fun') text = text.slice(0, 240)
    else text = text.slice(0, 400)

    this.destroyAudio()
    this.setData({ 'audio.loading': true, 'audio.playing': false, 'audio.url': '' })
    api.tts(text).then((res) => {
      if (!res.audioUrl) {
        this.setData({ 'audio.loading': false })
        wx.showToast({ title: '语音合成失败', icon: 'none' })
        return
      }
      const ctx = wx.createInnerAudioContext()
      ctx.src = res.audioUrl
      ctx.onPlay(() => {
        this.clearDockTimer()
        this.setData({ 'audio.playing': true, 'audio.loading': false })
      })
      ctx.onPause(() => {
        this.setData({ 'audio.playing': false })
        this.scheduleDockHide()
      })
      ctx.onStop(() => {
        this.setData({ 'audio.playing': false })
        this.scheduleDockHide()
      })
      ctx.onEnded(() => {
        this.setData({ 'audio.playing': false })
        this.scheduleDockHide()
      })
      ctx.onError(() => {
        this.setData({ 'audio.playing': false, 'audio.loading': false })
        wx.showToast({ title: '语音播放失败', icon: 'none' })
        this.scheduleDockHide()
      })
      this.audioCtx = ctx
      this.setData({ 'audio.url': res.audioUrl })
      ctx.play()
    }).catch((e) => {
      this.setData({ 'audio.loading': false })
      wx.showToast({ title: e.message || '语音合成失败', icon: 'none' })
    })
  },

  /** 复制某条 AI 回复到剪贴板 */
  onCopy(e) {
    const idx = e.currentTarget.dataset.index
    const msg = this.data.messages[idx]
    if (!msg || msg.role !== 'assistant' || !msg.content) return
    wx.setClipboardData({
      data: msg.content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  /** 展开/收起资料来源说明 */
  onToggleSource() {
    this.setData({ sourceOpen: !this.data.sourceOpen })
  },

  /** 复制资料来源链接（小程序内不直接打开外部网页） */
  onCopySource(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '链接已复制，可在浏览器打开', icon: 'none' })
    })
  },

  /** 语音控制：播放/暂停 */
  onTogglePlay() {
    if (!this.audioCtx) return
    if (this.data.audio.playing) {
      this.audioCtx.pause()
    } else {
      this.clearDockTimer()
      this.audioCtx.play()
    }
  },

  /** 重新播放 */
  onReplay() {
    if (!this.audioCtx) return
    this.clearDockTimer()
    this.audioCtx.seek(0)
    this.audioCtx.play()
  },

  onBackHome() {
    wx.switchTab({ url: '/pages/guides/guides' })
  }
})
