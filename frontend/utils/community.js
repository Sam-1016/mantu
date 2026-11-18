/**
 * 社区数据访问层：统一走云函数 community，数据存云开发数据库。
 * 页面不直接读写数据库，避免权限绕过。
 */
function call(action, payload) {
  return new Promise(function (resolve, reject) {
    if (!wx.cloud) {
      reject(new Error('当前环境不支持云开发'))
      return
    }
    wx.cloud.callFunction({
      name: 'community',
      data: Object.assign({ action: action }, payload || {})
    }).then(function (res) {
      const r = res.result || {}
      if (r.code !== 200) {
        reject(new Error(r.error || '社区服务返回异常'))
        return
      }
      resolve(r)
    }).catch(function (e) {
      const msg = (e && (e.errMsg || e.message)) || '网络异常'
      reject(new Error(msg))
    })
  })
}

/** 初始化集合（首次使用执行一次即可） */
function initDb() { return call('init') }

/** 公共攻略列表（真实发布 + 示例数据由页面合并） */
function listPosts(limit) { return call('list', { limit: limit || 30 }) }

/** 攻略详情 */
function getPost(id) { return call('detail', { id: id }) }

/** 发布攻略 */
function publish(post) { return call('publish', { post: post }) }

/** 回写 AI 优化建议（仅作者可改） */
function updateAiTips(id, aiTips) { return call('updateAiTips', { id: id, aiTips: aiTips }) }

/** 点赞切换 */
function toggleLike(postId) { return call('like', { postId: postId }) }

/** 收藏切换 */
function toggleFav(postId) { return call('fav', { postId: postId }) }

/** 我收藏的社区攻略 */
function myFavPosts() { return call('myFavs') }

module.exports = {
  initDb,
  listPosts,
  getPost,
  publish,
  updateAiTips,
  toggleLike,
  toggleFav,
  myFavPosts
}
