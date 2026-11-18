/**
 * 漫途社区云函数：公共攻略的读写、点赞、收藏。
 * 所有写操作在服务端校验 openid，客户端无法修改他人数据。
 * 集合：community_posts / community_likes / community_favs
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const POSTS = 'community_posts'
const LIKES = 'community_likes'
const FAVS = 'community_favs'

/* ---------------- 集合初始化 ---------------- */
async function initDb() {
  const names = [POSTS, LIKES, FAVS]
  const result = {}
  for (const name of names) {
    try {
      await db.createCollection(name)
      result[name] = 'created'
    } catch (e) {
      result[name] = /exist/i.test(e.errMsg || e.message || '') ? 'exists' : ('error: ' + (e.errMsg || e.message))
    }
  }
  return { code: 200, result: result }
}

/* ---------------- 工具 ---------------- */
function toPost(doc) {
  if (!doc) return null
  return {
    id: doc._id,
    title: doc.title || '',
    destination: doc.destination || '',
    duration: doc.duration || '',
    budget: doc.budget || '',
    ticket: doc.ticket || '',
    transport: doc.transport || '',
    month: doc.month || '',
    keywords: doc.keywords || '',
    avoid: doc.avoid || '',
    detail: doc.detail || '',
    author: doc.author || '匿名旅人',
    crowds: Array.isArray(doc.crowds) ? doc.crowds : [],
    aiTips: doc.aiTips || '',
    createdAt: doc.createdAt || 0,
    likeCount: doc.likeCount || 0,
    favCount: doc.favCount || 0,
    demo: !!doc.demo
  }
}

async function myFlags(openid, postIds) {
  if (!postIds.length) return { liked: {}, faved: {} }
  const [likeRes, favRes] = await Promise.all([
    db.collection(LIKES).where({ _openid: openid, postId: _.in(postIds) }).limit(100).get(),
    db.collection(FAVS).where({ _openid: openid, postId: _.in(postIds) }).limit(100).get()
  ])
  const liked = {}
  const faved = {}
  likeRes.data.forEach(function (d) { liked[d.postId] = true })
  favRes.data.forEach(function (d) { faved[d.postId] = true })
  return { liked: liked, faved: faved }
}

/* ---------------- 列表 ---------------- */
async function list(event, openid) {
  const limit = Math.min(50, parseInt(event.limit, 10) || 30)
  const res = await db.collection(POSTS).orderBy('createdAt', 'desc').limit(limit).get()
  const posts = res.data.map(toPost)
  // 演示数据标记示例，方便前端区分真实发布与内置内容
  posts.forEach(function (p) { if (p.demo) p.demo = true })
  const flags = await myFlags(openid, posts.map(function (p) { return p.id }))
  posts.forEach(function (p) {
    p.liked = !!flags.liked[p.id]
    p.faved = !!flags.faved[p.id]
  })
  return { code: 200, posts: posts }
}

/* ---------------- 详情 ---------------- */
async function detail(event, openid) {
  if (!event.id) return { code: 400, type: 'BAD_REQUEST', error: '缺少攻略 id' }
  try {
    const res = await db.collection(POSTS).doc(event.id).get()
    const post = toPost(res.data)
    const flags = await myFlags(openid, [event.id])
    post.liked = !!flags.liked[event.id]
    post.faved = !!flags.faved[event.id]
    return { code: 200, post: post }
  } catch (e) {
    return { code: 404, type: 'NOT_FOUND', error: '攻略不存在或已删除' }
  }
}

/* ---------------- 发布 ---------------- */
async function publish(event, openid) {
  const p = event.post || {}
  if (!p.title || !String(p.title).trim()) return { code: 400, type: 'BAD_REQUEST', error: '缺少标题' }
  if (!p.author || !String(p.author).trim()) return { code: 400, type: 'BAD_REQUEST', error: '缺少昵称' }

  const doc = {
    _openid: openid,
    title: String(p.title).slice(0, 60),
    destination: String(p.destination || '').slice(0, 30),
    duration: String(p.duration || '').slice(0, 20),
    budget: String(p.budget || '').slice(0, 20),
    ticket: String(p.ticket || '').slice(0, 30),
    transport: String(p.transport || '').slice(0, 20),
    month: String(p.month || '').slice(0, 10),
    keywords: String(p.keywords || '').slice(0, 120),
    avoid: String(p.avoid || '').slice(0, 800),
    detail: String(p.detail || '').slice(0, 3000),
    author: String(p.author).slice(0, 20),
    crowds: Array.isArray(p.crowds) ? p.crowds.slice(0, 5) : [],
    aiTips: '',
    likeCount: 0,
    favCount: 0,
    demo: false,
    createdAt: Date.now()
  }
  const res = await db.collection(POSTS).add({ data: doc })
  return { code: 200, id: res._id }
}

/* ---------------- 更新 AI 建议（仅作者） ---------------- */
async function updateAiTips(event, openid) {
  if (!event.id) return { code: 400, type: 'BAD_REQUEST', error: '缺少攻略 id' }
  const res = await db.collection(POSTS).doc(event.id).get().catch(function () { return null })
  if (!res || !res.data) return { code: 404, type: 'NOT_FOUND', error: '攻略不存在' }
  if (res.data._openid !== openid) return { code: 403, type: 'FORBIDDEN', error: '只能修改自己发布的攻略' }
  await db.collection(POSTS).doc(event.id).update({ data: { aiTips: String(event.aiTips || '').slice(0, 4000) } })
  return { code: 200 }
}

/* ---------------- 点赞 / 收藏 ---------------- */
async function toggle(event, openid, collection, counterField, flagName) {
  if (!event.postId) return { code: 400, type: 'BAD_REQUEST', error: '缺少攻略 id' }
  const postId = String(event.postId)
  const existing = await db.collection(collection).where({ _openid: openid, postId: postId }).limit(1).get()
  const on = existing.data.length > 0

  if (on) {
    await db.collection(collection).doc(existing.data[0]._id).remove()
    await db.collection(POSTS).doc(postId).update({ data: { [counterField]: _.inc(-1) } }).catch(function () {})
    return { code: 200, active: false }
  }

  const doc = { postId: postId, createdAt: Date.now() }
  doc._openid = openid
  await db.collection(collection).add({ data: doc })
  await db.collection(POSTS).doc(postId).update({ data: { [counterField]: _.inc(1) } }).catch(function () {})
  return { code: 200, active: true }
}

/* ---------------- 我收藏的攻略 ---------------- */
async function myFavs(event, openid) {
  const favRes = await db.collection(FAVS).where({ _openid: openid }).orderBy('createdAt', 'desc').limit(30).get()
  const ids = favRes.data.map(function (d) { return d.postId })
  if (!ids.length) return { code: 200, posts: [] }
  const res = await db.collection(POSTS).where({ _id: _.in(ids) }).get()
  const map = {}
  res.data.forEach(function (d) { map[d._id] = toPost(d) })
  const posts = []
  ids.forEach(function (id) { if (map[id]) posts.push(map[id]) })
  return { code: 200, posts: posts }
}

/* ---------------- 入口 ---------------- */
exports.main = async function (event) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''
  const action = event.action

  try {
    switch (action) {
      case 'init':
        return await initDb()
      case 'list':
        return await list(event, openid)
      case 'detail':
        return await detail(event, openid)
      case 'publish':
        return await publish(event, openid)
      case 'updateAiTips':
        return await updateAiTips(event, openid)
      case 'like':
        return await toggle(event, openid, LIKES, 'likeCount', 'liked')
      case 'fav':
        return await toggle(event, openid, FAVS, 'favCount', 'faved')
      case 'myFavs':
        return await myFavs(event, openid)
      default:
        return { code: 400, type: 'BAD_REQUEST', error: '未知操作: ' + action }
    }
  } catch (e) {
    return { code: 500, type: 'SERVER', error: e.errMsg || e.message || '服务异常' }
  }
}
