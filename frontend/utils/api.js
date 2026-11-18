/**
 * 漫途 AI 接口封装（云函数版）
 * 所有 AI 调用经云函数中转，API Key 不暴露在前端。
 * 依赖 app.js 中已初始化 wx.cloud。
 */

/** 通用云函数调用；options.raw = true 时即使 code 非 200 也返回完整结果（用于自检） */
function callAI(data, options) {
  return new Promise(function (resolve, reject) {
    if (!wx.cloud) {
      reject(new Error('当前环境不支持云开发，请使用微信开发者工具打开'))
      return
    }
    wx.cloud.callFunction({
      name: 'ai',
      data: data,
      success: function (res) {
        const result = res.result || {}
        if (result.code === 200) {
          // 成功：去掉 code 字段，返回业务数据
          const { code, ...rest } = result
          resolve(rest)
        } else if (options && options.raw) {
          resolve(result)
        } else {
          const err = new Error(result.error || ('云函数错误(' + result.code + ')'))
          err.type = result.type || ''
          err.code = result.code
          reject(err)
        }
      },
      fail: function (err) {
        reject(new Error('云函数调用失败: ' + (err.errMsg || err.message || '未知错误')))
      }
    })
  })
}

/** AI 拍照识景：传入 base64 图片或 base64 数组，返回 { name, destId, spotId, intro, matched } */
function recognize(image) {
  if (Array.isArray(image)) {
    return callAI({ action: 'recognize', images: image })
  }
  return callAI({ action: 'recognize', image: image })
}

/** 大图走云存储：传入 fileID 数组，由云函数下载后识别 */
function recognizeByFile(fileIDs) {
  return callAI({ action: 'recognize', fileIDs: fileIDs })
}

/** 景点多轮对话：messages 为 [{role, content}]，返回 { reply } */
function spotChat(messages, spotId, style, spotName) {
  return callAI({
    action: 'spotChat',
    messages: messages,
    spotId: spotId || '',
    style: style || '历史学者',
    spotName: spotName || ''
  })
}

/** AI 个性化路线：payload 含目的地/天数/预算/偏好/节奏/景点清单，返回 { plan } */
function plan(payload) {
  return callAI({ action: 'plan', plan: payload })
}

/** AI 语音合成：传入文本，返回 { audioUrl } */
function tts(text, voice) {
  return callAI({ action: 'tts', text: text, voice: voice || '' })
}

/** 获取景点知识库 */
function getSpotKnowledge(spotId) {
  return callAI({ action: 'spotKnowledge', spotId: spotId })
}

/** 通用 AI 对话（攻略优化等）：模型由云函数环境变量统一配置，前端不传模型名 */
function chat(message) {
  return callAI({ action: 'chat', message: message })
}

/** 云函数自检：检查运行时、Key、接口地址，并实际调用文本模型（可选视觉模型） */
function health(withVision) {
  return callAI({ action: 'health', withVision: !!withVision }, { raw: true })
}

/** 获取当前账号可用的模型 ID 列表，用于核对环境变量中的模型名 */
function listModels() {
  return callAI({ action: 'models' })
}

/** 云存储前缀探测：返回 cloud://env.bucket，用于拼接高清图地址 */
function storageProbe() {
  return callAI({ action: 'storageProbe' })
}

/** 景点评价聚合分析：返回 { enough, score, dimensions, summary, pros, cons, quotes, sample } */
function spotReview(spotName) {
  return callAI({ action: 'spotReview', spotName: spotName })
}

module.exports = {
  recognize,
  recognizeByFile,
  spotChat,
  plan,
  tts,
  getSpotKnowledge,
  spotReview,
  chat,
  health,
  listModels,
  storageProbe
}
