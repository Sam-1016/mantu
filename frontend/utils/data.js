const guides = require('./guides.js')
const destinations = require('./places.js')

const DRAFT_KEY = 'itinerary_drafts'

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const homeEntries = [
  { name: '城市', mark: '城', value: '城市漫步', type: 'guide' },
  { name: '山野', mark: '野', value: '自然风光', type: 'guide' },
  { name: '海岛', mark: '岛', value: '海岛', type: 'guide' },
  { name: '美食', mark: '味', value: '美食', type: 'guide' },
  { name: '国内', mark: '内', value: '国内', type: 'dest' },
  { name: '国际', mark: '际', value: '国际', type: 'dest' },
  { name: '文化', mark: '文', value: '文化', type: 'guide' },
  { name: '全部', mark: '全', value: '全部', type: 'dest' }
]

const guideFilters = ['全部', '城市漫步', '自然风光', '美食', '海岛', '文化']
const destFilters = ['全部', '国内', '国际']

/** 境内目的地 id 白名单（港澳台同样计入国内），其余视为国际 */
const DOMESTIC_IDS = [
  'dali', 'chengdu', 'sanya', 'beijing', 'xiamen', 'shanghai', 'guilin',
  'qinhuangdao', 'xian', 'chongqing', 'dunhuang', 'qingdao', 'changsha', 'hangzhou',
  'suzhou', 'luoyang', 'lhasa'
]
const hotWords = ['大理', '京都', '极光', '火锅', '鼓浪屿', '三亚', '胡同', '阳朔']
const defaultRecent = ['阳朔', '武康路', '环海西路']

const historySeed = [
  { id: 'iceland-7', time: '今天 09:24' },
  { id: 'shanghai-night', time: '昨天 21:06' },
  { id: 'guilin-4', time: '昨天 14:18' },
  { id: 'beijing-hutong', time: '10月17日' },
  { id: 'sanya-winter', time: '10月12日' },
  { id: 'xiamen-walk', time: '10月8日' }
]

const draftSeed = [
  { id: 'dali-3d', date: '10.24 – 10.26', status: '编排中' },
  { id: 'kyoto-day', date: '11.08', status: '待出发' }
]

const initialFavoriteIds = ['dali-3d', 'kyoto-day', 'chengdu-48h', 'bali-5']

/** 云存储前缀：s23-s62 这批 700px 高清景点图托管在云端，本地 420px 图作为兜底保留 */
const CLOUD_IMG = 'cloud://cloud1-d2gu9ngyu916699c8.636c-cloud1-d2gu9ngyu916699c8-1533503224'

function imgUrl(localPath) {
  return localPath
}

/** 热门景点 → 本地实景配图 */
const SPOT_IMG = {
  '布达拉宫': '/images/spots/s01.jpg',
  '大昭寺': '/images/spots/s02.jpg',
  '八廓街': '/images/spots/s03.jpg',
  '拙政园': '/images/spots/s04.jpg',
  '平江路': '/images/spots/s05.jpg',
  '虎丘': '/images/spots/s06.jpg',
  '龙门石窟': '/images/spots/s07.jpg',
  '白马寺': '/images/spots/s08.jpg',
  '洛邑古城': '/images/spots/s09.jpg',
  '故宫': '/images/spots/s10.jpg',
  '兵马俑': '/images/spots/s11.jpg',
  '莫高窟': '/images/spots/s12.jpg',
  '苏堤': '/images/spots/s13.jpg',
  '灵隐寺': '/images/spots/s14.jpg',
  '外滩': '/images/spots/s15.jpg',
  '鼓浪屿': '/images/spots/s16.jpg',
  '漓江': '/images/spots/s17.jpg',
  '亚龙湾': '/images/spots/s18.jpg',
  '洪崖洞': '/images/spots/s19.jpg',
  '栈桥': '/images/spots/s20.jpg',
  '橘子洲': '/images/spots/s23.jpg',
  '岳麓山': '/images/spots/s22.jpg',
  '伏见稻荷': '/images/spots/s54.jpg',
  '黑沙滩': '/images/spots/s57.jpg',
  '德格拉朗梯田': '/images/spots/s60.jpg',
  '老龙头': '/images/spots/s51.jpg',
  '双廊': '/images/spots/s45.jpg',
  '人民公园': '/images/spots/s48.jpg',
  '才村码头': '/images/spots/s46.jpg',
  '喜洲古镇': '/images/spots/s47.jpg',
  '岚山': '/images/spots/s55.jpg',
  '鸭川': '/images/spots/s56.jpg',
  '塞里雅兰瀑布': '/images/spots/s58.jpg',
  '冰川潟湖': '/images/spots/s59.jpg',
  '玉林': '/images/spots/s49.jpg',
  '火锅': '/images/spots/s50.jpg',
  '海棠湾': '/images/spots/s43.jpg',
  '西岛': '/images/spots/s44.jpg',
  '天坛': '/images/spots/s25.jpg',
  '景山': '/images/spots/s26.jpg',
  '胡同': '/images/spots/s27.jpg',
  '八市': '/images/spots/s33.jpg',
  '环岛路': '/images/spots/s34.jpg',
  '海神庙': '/images/spots/s61.jpg',
  '乌布': '/images/spots/s62.jpg',
  '武康路': '/images/spots/s31.jpg',
  '苏州河': '/images/spots/s32.jpg',
  '遇龙河': '/images/spots/s41.jpg',
  '十里画廊': '/images/spots/s42.jpg',
  '鸽子窝': '/images/spots/s52.jpg',
  '北戴河': '/images/spots/s53.jpg',
  '西安城墙': '/images/spots/s28.jpg',
  '大唐不夜城': '/images/spots/s29.jpg',
  '长江索道': '/images/spots/s37.jpg',
  '李子坝': '/images/spots/s38.jpg',
  '鸣沙山月牙泉': '/images/spots/s39.jpg',
  '沙洲夜市': '/images/spots/s40.jpg',
  '八大关': '/images/spots/s35.jpg',
  '啤酒博物馆': '/images/spots/s36.jpg',
  '超级文和友': '/images/spots/s24.jpg',
  '九溪烟树': '/images/spots/s30.jpg'
}

/** 目的地封面：用当地最具辨识度的热门景点 */
const COVER_BY_SPOT = {
  lhasa: '布达拉宫',
  beijing: '故宫',
  xian: '兵马俑',
  dunhuang: '莫高窟',
  hangzhou: '苏堤',
  shanghai: '外滩',
  xiamen: '鼓浪屿',
  guilin: '漓江',
  sanya: '亚龙湾',
  chongqing: '洪崖洞',
  qingdao: '栈桥',
  changsha: '橘子洲',
  suzhou: '拙政园',
  luoyang: '龙门石窟',
  kyoto: '伏见稻荷',
  iceland: '黑沙滩',
  bali: '德格拉朗梯田',
  qinhuangdao: '老龙头',
  dali: '双廊',
  chengdu: '人民公园'
}

destinations.forEach(function (dest) {
  dest.guideCount = guides.filter(function (item) {
    return item.destId === dest.id
  }).length
  dest.region = DOMESTIC_IDS.indexOf(dest.id) >= 0 ? '国内' : '国际'
  // 看点换成与景点相符的实景图
  ;(dest.highlights || []).forEach(function (h) {
    if (SPOT_IMG[h.name]) h.image = imgUrl(SPOT_IMG[h.name])
  })
  // 封面换成该地最热门的景点图
  const coverSpot = COVER_BY_SPOT[dest.id]
  if (coverSpot && SPOT_IMG[coverSpot]) dest.cover = imgUrl(SPOT_IMG[coverSpot])
})

function getSpotImage(name) {
  return SPOT_IMG[name] ? imgUrl(SPOT_IMG[name]) : ''
}

const DEST_IMG_POOL = {}
destinations.forEach(function (dest) {
  const imgs = []
  ;(dest.highlights || []).forEach(function (h) {
    if (h.image) imgs.push(h.image)
  })
  if (dest.cover && imgs.indexOf(dest.cover) < 0) imgs.push(dest.cover)
  DEST_IMG_POOL[dest.id] = imgs
})

// 攻略封面与行程看点图跟随所属目的地的实景图，避免引用已删除的通用封面
const destById = {}
destinations.forEach(function (dest) { destById[dest.id] = dest })

guides.forEach(function (guide) {
  const dest = destById[guide.destId]
  if (!dest) return
  const imgs = DEST_IMG_POOL[guide.destId] || []
  guide.cover = imgs[0] || dest.cover
  ;(guide.spots || []).forEach(function (spot, index) {
    spot.image = imgUrl(SPOT_IMG[spot.name] || imgs[index % imgs.length] || dest.cover)
  })
})

guides.forEach(function (guide) {
  guide.infos = [
    { label: '最佳季节', value: guide.season },
    { label: '人均预算', value: guide.budgetText },
    { label: '适合', value: guide.people },
    { label: '节奏', value: guide.rhythm }
  ]
})

function getGuide(id) {
  for (let i = 0; i < guides.length; i += 1) {
    if (guides[i].id === id) return guides[i]
  }
  return null
}

function getDest(id) {
  for (let i = 0; i < destinations.length; i += 1) {
    if (destinations[i].id === id) return destinations[i]
  }
  return null
}

function guidesForDest(destId) {
  return guides.filter(function (item) {
    return item.destId === destId
  })
}

function relatedGuides(guide, limit) {
  const sameDest = []
  const sameCat = []
  guides.forEach(function (item) {
    if (!guide || item.id === guide.id) return
    if (item.destId === guide.destId) sameDest.push(item)
    else if (item.category === guide.category) sameCat.push(item)
  })
  return sameDest.concat(sameCat).slice(0, limit || 3)
}

function favoriteIds() {
  try {
    const app = getApp()
    if (app && app.globalData && app.globalData.favoriteIds) {
      return app.globalData.favoriteIds
    }
  } catch (err) {
    return initialFavoriteIds
  }
  return initialFavoriteIds
}

function isFavorite(id) {
  return favoriteIds().indexOf(id) >= 0
}

function toggleFavorite(id) {
  const app = getApp()
  const ids = favoriteIds().slice()
  const index = ids.indexOf(id)
  if (index >= 0) ids.splice(index, 1)
  else ids.unshift(id)
  app.globalData.favoriteIds = ids
  // 写入缓存，重开小程序收藏不丢
  try {
    wx.setStorageSync('favorite_ids', ids)
  } catch (e) {}
  return index < 0
}

function getFavorites() {
  const list = []
  favoriteIds().forEach(function (id) {
    const guide = getGuide(id)
    if (guide) list.push(guide)
  })
  return list
}

/**
 * 浏览足迹：真实记录用户浏览过的攻略详情
 * 存储于全局缓存 view_history（重开小程序不丢），
 * 无记录时回退到内置演示数据，保证参赛演示页面不为空。
 */
const HISTORY_KEY = 'view_history'
const HISTORY_MAX = 50

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

/** 时间戳 -> 展示文案：今天 HH:mm / 昨天 HH:mm / M月D日 */
function fmtHistoryTime(ts) {
  const d = new Date(ts)
  const hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes())
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return '今天 ' + hm
  const yesterday = new Date(today.getTime() - 86400000)
  if (d.toDateString() === yesterday.toDateString()) return '昨天 ' + hm
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

/** 记录一次浏览（按 id 去重置顶，最多保留 50 条） */
function addHistory(id) {
  if (!getGuide(id)) return
  let list = []
  try {
    list = wx.getStorageSync(HISTORY_KEY) || []
  } catch (e) {}
  list = list.filter(function (item) { return item.id !== id })
  list.unshift({ id: id, ts: Date.now() })
  if (list.length > HISTORY_MAX) list = list.slice(0, HISTORY_MAX)
  try {
    wx.setStorageSync(HISTORY_KEY, list)
  } catch (e) {}
}

function getHistory() {
  let stored = []
  try {
    stored = wx.getStorageSync(HISTORY_KEY) || []
  } catch (e) {}
  const src = stored.length ? stored : historySeed
  return src.map(function (item) {
    const time = item.ts ? fmtHistoryTime(item.ts) : item.time
    return Object.assign({}, getGuide(item.id), { time: time })
  }).filter(function (item) {
    return !!item.title
  })
}

function getDrafts() {
  let saved = []
  try {
    saved = wx.getStorageSync(DRAFT_KEY) || []
  } catch (e) {}
  const seen = {}
  const all = saved.concat(draftSeed).filter(function (item) {
    if (!item || !item.id || seen[item.id]) return false
    seen[item.id] = true
    return true
  })
  return all.map(function (item) {
    return Object.assign({}, getGuide(item.id), {
      date: item.date,
      status: item.status
    })
  }).filter(function (item) {
    return !!item.title
  })
}

/** 把一篇攻略加入「我的行程草案」，已存在则返回 false */
function addDraft(guideId) {
  const g = getGuide(guideId)
  if (!g) return false
  let saved = []
  try {
    saved = wx.getStorageSync(DRAFT_KEY) || []
  } catch (e) {}
  const exists = saved.some(function (d) { return d.id === guideId }) ||
    draftSeed.some(function (d) { return d.id === guideId })
  if (exists) return false
  const now = new Date()
  saved.unshift({
    id: guideId,
    date: (now.getMonth() + 1) + '月' + now.getDate() + '日加入',
    status: '待出发'
  })
  try {
    wx.setStorageSync(DRAFT_KEY, saved)
  } catch (e) {}
  return true
}

function filterGuides(keyword) {
  const text = (keyword || '').trim()
  if (!text) return []
  return guides.filter(function (item) {
    const blob = [
      item.title,
      item.city,
      item.category,
      item.excerpt,
      item.route,
      item.tags.join(' ')
    ].join(' ')
    return blob.indexOf(text) >= 0
  })
}

function filterDestinations(keyword) {
  const text = (keyword || '').trim()
  if (!text) return []
  return destinations.filter(function (item) {
    const blob = [item.name, item.area, item.group, item.slogan, item.intro].join(' ')
    return blob.indexOf(text) >= 0
  })
}

/** 景点搜索：匹配景点名 + 景点知识全文（历史/文化/故事/建筑/FAQ） */
function filterSpots(keyword) {
  const text = (keyword || '').trim()
  if (!text) return []
  const spots = require('./spots.js')
  const places = require('./places.js')
  const KNOWLEDGE = spots.getAllSpots() ? spots.getAllSpots() : []
  const results = []
  const seen = new Set()

  places.forEach(function (dest) {
    ;(dest.highlights || []).forEach(function (h) {
      const key = dest.id + '|' + h.name
      if (seen.has(key)) return
      let matched = false
      const reasons = []

      // 景点名命中
      if (h.name.indexOf(text) >= 0) {
        matched = true
        reasons.push('名称匹配')
      }
      // 描述命中
      if (h.desc && h.desc.indexOf(text) >= 0) {
        matched = true
        reasons.push(h.desc)
      }
      // 知识内容命中
      const fullSpot = spots.getSpot(dest.id, h.name)
      if (fullSpot && fullSpot.knowledge) {
        const k = fullSpot.knowledge
        const sections = [
          { label: '历史', text: k.history },
          { label: '文化', text: k.culture },
          { label: '故事', text: k.story },
          { label: '建筑', text: k.architecture }
        ]
        sections.forEach(function (sec) {
          if (sec.text && sec.text.indexOf(text) >= 0) {
            matched = true
            // 截取命中片段前后各 20 字
            const idx = sec.text.indexOf(text)
            const start = Math.max(0, idx - 20)
            const end = Math.min(sec.text.length, idx + text.length + 20)
            let snippet = (start > 0 ? '...' : '') + sec.text.slice(start, end) + (end < sec.text.length ? '...' : '')
            reasons.push(sec.label + '：' + snippet)
          }
        })
        ;(k.faqs || []).forEach(function (q) {
          if (q.indexOf(text) >= 0) {
            matched = true
            reasons.push('FAQ：' + q)
          }
        })
      }

      if (matched) {
        seen.add(key)
        results.push({
          id: fullSpot ? fullSpot.id : dest.id + '_' + h.name,
          name: h.name,
          destId: dest.id,
          destName: dest.name,
          area: dest.area,
          image: h.image,
          desc: h.desc,
          reasons: reasons.slice(0, 3),
          spotDetail: fullSpot
        })
      }
    })
  })
  return results
}

/** 高亮处理：把关键词包进 <mark> 标签，供 wxml 使用 */
function highlight(text, keyword) {
  const t = String(text || '')
  const k = String(keyword || '').trim()
  if (!k) return t
  // 简单处理：不区分大小写
  const lower = t.toLowerCase()
  const lowerK = k.toLowerCase()
  const idx = lower.indexOf(lowerK)
  if (idx < 0) return t
  return t.slice(0, idx) + '<<HL>>' + t.slice(idx, idx + k.length) + '<</HL>>' + t.slice(idx + k.length)
}

module.exports = {
  monthNames,
  homeEntries,
  guideFilters,
  destFilters,
  hotWords,
  defaultRecent,
  guides,
  destinations,
  getGuide,
  getDest,
  guidesForDest,
  relatedGuides,
  isFavorite,
  toggleFavorite,
  getFavorites,
  addHistory,
  getHistory,
  getDrafts,
  addDraft,
  filterGuides,
  filterDestinations,
  filterSpots,
  highlight
}
