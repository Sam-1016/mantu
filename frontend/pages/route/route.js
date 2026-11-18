const source = require('../../utils/data.js')
const routes = require('../../utils/routes.js')
const spotsUtil = require('../../utils/spots.js')

/** 把一段文字按关键词拆分成高亮片段数组 */
function splitByKeyword(text, keyword) {
  const t = String(text || '')
  const k = String(keyword || '').trim()
  if (!k) return [{ text: t, hl: false }]
  const lower = t.toLowerCase()
  const lowerK = k.toLowerCase()
  const result = []
  let idx = lower.indexOf(lowerK)
  let cursor = 0
  while (idx >= 0) {
    if (idx > cursor) {
      result.push({ text: t.slice(cursor, idx), hl: false })
    }
    result.push({ text: t.slice(idx, idx + k.length), hl: true })
    cursor = idx + k.length
    idx = lower.indexOf(lowerK, cursor)
  }
  if (cursor < t.length) {
    result.push({ text: t.slice(cursor), hl: false })
  }
  return result
}

/** 判断一段文字是否包含关键词（不区分大小写） */
function contains(text, keyword) {
  if (!keyword) return true
  return String(text || '').toLowerCase().indexOf(String(keyword).toLowerCase()) >= 0
}

Page({
  data: {
    ready: false,
    route: null,
    dest: null,
    timeline: [],
    activeSpot: null,
    spotDetail: null,
    spotKnowledge: null,
    showModal: false,
    modalKeyword: '',
    modalSections: [],
    noMatch: false,
    navBarHeight: 64,
    routeList: [],
    currentId: ''
  },

  onLoad(query) {
    const routeList = routes.allRoutes().map(function (r) {
      return {
        id: r.id,
        short: String(r.name || '').split('·')[0].trim() || r.id
      }
    })
    this.setData({ routeList: routeList })
    this.loadRoute(query.destId || 'dali', query.spot ? decodeURIComponent(query.spot) : null)
  },

  /** 切换城市路线：复用同一套时间线渲染，只替换数据源 */
  onSwitchRoute(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.currentId) return
    this.loadRoute(id, null)
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },

  loadRoute(destId, gotoSpot) {
    const route = routes.getRoute(destId)
    const dest = source.getDest(destId)
    const app = getApp()

    if (!route) {
      this.setData({ ready: false })
      return
    }

    const timeline = []
    route.spots.forEach(function (spot, idx) {
      const hl = (dest && dest.highlights || []).find(function (h) { return h.name === spot.name })
      // 看点里没有配图时，回退到景点库图片，再回退到目的地封面，避免卡片空白
      const spotInfo = spotsUtil.getSpot(destId, spot.name)
      const spotImage = (hl && hl.image) || (spotInfo && spotInfo.image) ||
        (dest && dest.cover) || ''
      timeline.push({
        type: 'spot',
        index: idx,
        key: 'spot-' + idx,
        name: spot.name,
        day: spot.day,
        time: spot.time,
        note: spot.note,
        image: spotImage,
        desc: hl ? hl.desc : ''
      })
      const seg = route.segments[idx]
      if (seg) {
        const tInfo = routes.transportInfo(seg.transport)
        timeline.push({
          type: 'segment',
          key: 'seg-' + idx,
          from: seg.from,
          to: seg.to,
          distance: seg.distance,
          transport: seg.transport,
          transportIcon: tInfo.icon,
          transportLabel: tInfo.label,
          transportColor: tInfo.color,
          cost: seg.cost
        })
      }
    })

    this.setData({
      ready: true,
      currentId: destId,
      route: route,
      dest: dest,
      timeline: timeline,
      showModal: false,
      activeSpot: null,
      spotDetail: null,
      spotKnowledge: null,
      modalKeyword: '',
      navBarHeight: app.globalData.navBarHeight || 64
    })

    // 搜索跳转来的，自动打开对应景点弹窗
    if (gotoSpot) {
      const idx = route.spots.findIndex(function (s) { return s.name === gotoSpot })
      if (idx >= 0) {
        this.openSpotModal(idx)
      }
    }
  },

  /** 组装弹窗的 section 数据 */
  buildModalSections(spotDetail, activeSpot) {
    if (!spotDetail) return []
    const k = spotDetail.knowledge || {}
    const keyword = this.data.modalKeyword || ''

    const sections = []

    // 简介
    if (spotDetail.desc) {
      sections.push({
        key: 'intro',
        label: '简介',
        text: spotDetail.desc,
        visible: contains(spotDetail.desc, keyword),
        parts: splitByKeyword(spotDetail.desc, keyword)
      })
    }

    // 攻略贴士
    if (activeSpot && activeSpot.note) {
      sections.push({
        key: 'tip',
        label: '攻略贴士',
        text: activeSpot.note,
        visible: contains(activeSpot.note, keyword) || !keyword,
        parts: splitByKeyword(activeSpot.note, keyword)
      })
    }

    // 知识 section
    const knowledgeKeys = [
      { key: 'history', label: '历史' },
      { key: 'culture', label: '文化' },
      { key: 'story', label: '故事' },
      { key: 'architecture', label: '建筑' }
    ]
    knowledgeKeys.forEach(function (item) {
      const text = k[item.key]
      if (text) {
        sections.push({
          key: item.key,
          label: item.label,
          text: text,
          visible: contains(text, keyword) || !keyword,
          parts: splitByKeyword(text, keyword)
        })
      }
    })

    // FAQ
    if (k.faqs && k.faqs.length) {
      const faqItems = k.faqs.map(function (q) {
        return {
          text: q,
          visible: contains(q, keyword) || !keyword,
          parts: splitByKeyword(q, keyword)
        }
      })
      sections.push({
        key: 'faqs',
        label: '常见问题',
        visible: faqItems.some(function (f) { return f.visible }),
        isFaq: true,
        faqs: faqItems
      })
    }

    return sections
  },

  openSpotModal(index) {
    const spotData = this.data.route.spots[index]
    const destId = this.data.route.id
    const fullSpot = spotsUtil.getSpot(destId, spotData.name)
    const knowledge = fullSpot ? fullSpot.knowledge : null

    const sections = this.buildModalSections(fullSpot, spotData)
    this.setData({
      activeSpot: spotData,
      spotDetail: fullSpot,
      spotKnowledge: knowledge,
      modalKeyword: '',
      modalSections: sections,
      noMatch: false,
      showModal: true
    })
  },

  onSpotTap(e) {
    const index = e.currentTarget.dataset.index
    this.openSpotModal(index)
  },

  closeModal() {
    this.setData({ showModal: false, activeSpot: null, spotDetail: null, modalKeyword: '', modalSections: [] })
  },

  stopProp() {},

  onModalSearchInput(e) {
    const kw = e.detail.value || ''
    const sections = this.buildModalSections(this.data.spotDetail, this.data.activeSpot)
    const hasKw = !!kw.trim()
    const noMatch = hasKw && sections.every(function (s) { return !s.visible })
    this.setData({
      modalKeyword: kw,
      modalSections: sections,
      noMatch: noMatch
    })
  },

  onModalSearchClear() {
    this.setData({
      modalKeyword: '',
      modalSections: this.buildModalSections(this.data.spotDetail, this.data.activeSpot),
      noMatch: false
    })
  },

  /** 跳转 AI 讲解，可带上用户点击的问题 */
  openAiGuide(question) {
    if (!this.data.activeSpot) return
    const dest = this.data.route.id
    const spotName = this.data.activeSpot.name
    const spotId = spotsUtil.spotId(dest, spotName)
    let url = '/pages/ai-guide/ai-guide?destId=' + dest +
      '&spot=' + encodeURIComponent(spotName) + '&spotId=' + spotId
    if (question) url += '&q=' + encodeURIComponent(question)
    this.setData({ showModal: false })
    wx.navigateTo({
      url: url,
      fail: () => wx.showToast({ title: '页面打开失败，请重试', icon: 'none' })
    })
  },

  onAiGuide() {
    this.openAiGuide('')
  },

  /** 点击常见问题：带着这个问题进入 AI 讲解 */
  onFaqTap(e) {
    this.openAiGuide(e.currentTarget.dataset.q || '')
  },

  goGuide() {
    const dest = this.data.dest
    if (!dest) return
    const guides = source.guidesForDest(dest.id)
    if (!guides.length) {
      wx.showToast({ title: '攻略正在整理', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/guide-detail/guide-detail?id=' + guides[0].id
    })
  }
})
