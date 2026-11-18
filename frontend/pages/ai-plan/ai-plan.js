const source = require('../../utils/data.js')
const ai = require('../../utils/ai.js')

const PREFS = ['美食', '自然风光', '文化', '海岛', '城市漫步']
const PEOPLE = ['独行', '情侣', '朋友', '家庭']
const RHYTHM = ['慢', '适中', '紧凑']

Page({
  data: {
    mode: 'form',          // form | loading | result
    navBarHeight: 64,
    destNames: [],
    destIds: [],
    destIndex: 0,
    days: 3,
    budgetMin: '',
    budgetMax: '',
    prefs: PREFS.map(function (name) { return { name: name, on: false } }),
    people: PEOPLE,
    peopleIndex: 2,
    rhythms: RHYTHM,
    rhythmIndex: 1,
    plan: null,
    loadingText: '正在为你排路线',
    loadingElapsed: 0,
    saved: false
  },

  onLoad() {
    const names = source.destinations.map(function (d) { return d.name + ' · ' + d.area })
    const ids = source.destinations.map(function (d) { return d.id })
    this.setData({
      destNames: names,
      destIds: ids,
      navBarHeight: getApp().globalData.navBarHeight || 64
    })
  },

  onDest(e) {
    this.setData({ destIndex: Number(e.detail.value) })
  },

  onDays(e) {
    this.setData({ days: Number(e.detail.value) })
  },

  onBudgetMin(e) {
    this.setData({ budgetMin: e.detail.value.replace(/[^\d]/g, '') })
  },

  onBudgetMax(e) {
    this.setData({ budgetMax: e.detail.value.replace(/[^\d]/g, '') })
  },

  onPref(e) {
    const i = Number(e.currentTarget.dataset.index)
    const prefs = this.data.prefs.slice()
    prefs[i] = { name: prefs[i].name, on: !prefs[i].on }
    this.setData({ prefs: prefs })
  },

  onPeople(e) {
    this.setData({ peopleIndex: Number(e.currentTarget.dataset.index) })
  },

  onRhythm(e) {
    this.setData({ rhythmIndex: Number(e.currentTarget.dataset.index) })
  },

  collectOpts(seed) {
    const d = this.data
    return {
      destId: d.destIds[d.destIndex],
      days: d.days,
      budgetKey: 'normal',
      budgetMin: d.budgetMin,
      budgetMax: d.budgetMax,
      prefs: d.prefs.filter(function (p) { return p.on }).map(function (p) { return p.name }),
      people: d.people[d.peopleIndex],
      rhythm: d.rhythms[d.rhythmIndex],
      seed: seed
    }
  },

  onGenerate() {
    const min = this.data.budgetMin
    const max = this.data.budgetMax
    if ((min || max) && !(Number(min) > 0 && Number(max) > Number(min))) {
      wx.showToast({ title: '预算区间要填两个数，且上限大于下限', icon: 'none' })
      return
    }
    this.setData({ mode: 'loading', loadingText: 'AI 正在规划行程', loadingElapsed: 0 })
    this.startLoadingTimer()
    setTimeout(() => {
      ai.buildPlanAsync(this.collectOpts()).then((plan) => {
        this.stopLoadingTimer()
        this.setData({ mode: plan ? 'result' : 'form', plan: plan, saved: false })
        if (!plan) {
          wx.showToast({ title: '生成失败，换个目的地试试', icon: 'none' })
        } else if (plan.source === 'local') {
          wx.showToast({ title: 'AI 暂不可用，已生成本地推荐方案', icon: 'none' })
        }
      })
    }, 260)
  },

  startLoadingTimer() {
    this.stopLoadingTimer()
    this.loadingTimer = setInterval(() => {
      this.setData({ loadingElapsed: (this.data.loadingElapsed || 0) + 1 })
    }, 1000)
  },

  stopLoadingTimer() {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer)
      this.loadingTimer = null
    }
  },

  onUnload() {
    this.stopLoadingTimer()
  },

  onRegenerate() {
    this.setData({ mode: 'loading', loadingText: 'AI 正在重新规划', loadingElapsed: 0 })
    this.startLoadingTimer()
    setTimeout(() => {
      ai.buildPlanAsync(this.collectOpts(Date.now() % 997)).then((plan) => {
        this.stopLoadingTimer()
        this.setData({ mode: plan ? 'result' : 'form', plan: plan, saved: false })
        if (plan && plan.source === 'local') {
          wx.showToast({ title: 'AI 暂不可用，已用本地方案', icon: 'none' })
        }
      })
    }, 200)
  },

  onSave() {
    if (this.data.saved || !this.data.plan) return
    ai.savePlan(this.data.plan)
    this.setData({ saved: true })
    wx.showToast({ title: '已存入行程草案', icon: 'success' })
  },

  onBackForm() {
    this.setData({ mode: 'form', plan: null })
  }
})

