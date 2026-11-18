Page({
  data: {
    push: true,
    hd: true,
    season: true,
    recommend: false
  },

  onToggle(e) {
    const next = {}
    next[e.currentTarget.dataset.field] = e.detail.value
    this.setData(next)
  }
})
