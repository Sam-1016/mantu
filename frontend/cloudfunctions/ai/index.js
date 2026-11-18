/**
 * 漫途 AI 云函数
 * 中转大模型 API（默认硅基流动），隐藏 API Key
 *
 * 前端调用方式：
 *   wx.cloud.callFunction({ name: 'ai', data: { action: 'recognize', image: base64 } })
 *
 * 支持的 action：
 *   recognize     - AI 拍照/录像识景（视觉模型）
 *   spotChat      - 景点多轮对话（注入知识库）
 *   tts           - AI 语音合成（音频存云存储，返回临时链接）
 *   spotKnowledge - 查询景点知识库
 *   spotReview    - 多平台公开评价聚合分析（维度得分 + AI 综合结论）
 *   health        - 连接自检：运行时 / Key / 接口地址 / 文本模型 / 视觉模型
 *   models        - 读取账号可用模型 ID（GET /models），用于核对模型名
 *
 * 环境变量（在云开发控制台 → 云函数 → 配置 → 环境变量中设置）：
 *   AI_BASE_URL   模型服务地址，默认 https://api.siliconflow.cn/v1
 *   AI_API_KEY    硅基流动 API Key（只认这一个变量，不再读取 DASHSCOPE_API_KEY）
 *   VISION_MODEL  视觉模型，默认 Qwen/Qwen3-VL-8B-Instruct
 *   CHAT_MODEL    对话模型，默认 Qwen/Qwen3.5-9B
 *   TTS_MODEL     语音模型，默认 FunAudioLLM/CosyVoice2-0.5B
 *   TTS_VOICE     音色，默认 alex（请求时会拼成「模型ID:音色」）
 *
 * 约定：
 *   1. 模型名称只由环境变量决定，前端传 model 会被忽略
 *   2. Key 不写入代码、不落日志、不出现在返回体中（自检只返回掩码）
 *   3. 不做任何模拟回复，上游失败时返回 code != 200 与错误类型
 */
const cloud = require('wx-server-sdk')
const https = require('https')
const crypto = require('crypto')
const spots = require('./spots.js')
const reviews = require('./reviews.js')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const BASE = (process.env.AI_BASE_URL || 'https://api.siliconflow.cn/v1').replace(/\/+$/, '')
// 只读取硅基流动专用的 Key，不再回退到百炼/其他厂商变量，避免 Key 与接口混用
const API_KEY = process.env.AI_API_KEY || ''
const VISION_MODEL = process.env.VISION_MODEL || 'Qwen/Qwen3-VL-8B-Instruct'
const CHAT_MODEL = process.env.CHAT_MODEL || 'Qwen/Qwen3.5-9B'
const TTS_MODEL = process.env.TTS_MODEL || 'FunAudioLLM/CosyVoice2-0.5B'
const TTS_VOICE = process.env.TTS_VOICE || 'alex'
const REQUEST_TIMEOUT = 45000 // 小于云函数 60s 上限，保证超时后能返回明确错误

/* ---------------- 通用 HTTPS 请求封装 ---------------- */
function classifyStatus(code) {
  if (code === 401 || code === 403) return 'AUTH'
  if (code === 404) return 'MODEL_NOT_FOUND'
  if (code === 429) return 'RATE_LIMIT'
  if (code === 400) return 'BAD_REQUEST'
  if (code >= 500) return 'UPSTREAM'
  return 'UPSTREAM'
}

/** 统一请求：非 2xx 抛出带 type/statusCode 的错误，便于前端区分原因 */
function httpJson(method, url, headers, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : ''
    const urlObj = new URL(url)
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: Object.assign({}, headers, payload ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      } : {}),
      timeout: timeoutMs || REQUEST_TIMEOUT
    }, (res) => {
      let raw = ''
      res.on('data', c => { raw += c })
      res.on('end', () => {
        let data = null
        try {
          data = raw ? JSON.parse(raw) : {}
        } catch (e) {
          const err = new Error('返回非 JSON 内容: ' + raw.slice(0, 160))
          err.type = 'BAD_RESPONSE'
          return reject(err)
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const detail = data && (data.message || (data.error && (data.error.message || data.error)) || '')
          const err = new Error(String(detail || ('HTTP ' + res.statusCode)).slice(0, 200))
          err.statusCode = res.statusCode
          err.type = classifyStatus(res.statusCode)
          return reject(err)
        }
        resolve(data)
      })
    })
    req.on('timeout', () => {
      const err = new Error('请求超时（' + Math.round((timeoutMs || REQUEST_TIMEOUT) / 1000) + ' 秒）')
      err.type = 'TIMEOUT'
      req.destroy(err)
      reject(err)
    })
    req.on('error', (e) => {
      if (!e.type) e.type = 'NETWORK'
      reject(e)
    })
    if (payload) req.write(payload)
    req.end()
  })
}

function httpsPost(url, headers, body, timeoutMs) {
  return httpJson('POST', url, headers, body, timeoutMs)
}

function httpsGet(url, headers, timeoutMs) {
  return httpJson('GET', url, headers, null, timeoutMs)
}

/** 统一错误返回：不包含 Key，不伪造成功 */
function fail(prefix, e) {
  return {
    code: 502,
    type: (e && e.type) || 'UNKNOWN',
    statusCode: e && e.statusCode,
    error: prefix + (e && e.message ? e.message : '未知错误')
  }
}

/* ---------------- 1. AI 拍照识景 ---------------- */
function toDataUrl(base64) {
  const s = String(base64 || '')
  return s.indexOf('data:') === 0 ? s : 'data:image/jpeg;base64,' + s
}

async function recognize(imageBase64, imageList, fileIDs) {
  if (!API_KEY) return { code: 503, type: 'NO_KEY', error: '云函数未配置 AI_API_KEY 环境变量' }

  const rawList = Array.isArray(imageList) && imageList.length
    ? imageList.filter(Boolean).slice(0, 3)
    : (imageBase64 ? [imageBase64] : [])

  // 大图由前端先传云存储，这里下载后转 base64
  if (!rawList.length && Array.isArray(fileIDs) && fileIDs.length) {
    for (const id of fileIDs.slice(0, 3)) {
      try {
        const r = await cloud.downloadFile({ fileID: id })
        rawList.push(r.fileContent.toString('base64'))
      } catch (e) { /* 单张失败不影响其余帧 */ }
    }
  }
  if (!rawList.length) return { code: 400, type: 'BAD_REQUEST', error: '缺少图片' }

  const multi = rawList.length > 1
  const prompt = multi
    ? '这是同一景点连续拍摄的多帧画面，请综合判断这是哪个景点、建筑或自然景观。只输出景点名称，不要解释，不要加标点，10个字以内。如果画面信息不足、无法确认，输出"未知"，不要猜测。'
    : '请识别这张图片中的景点、建筑或自然景观。只输出景点名称，不要解释，不要加标点，10个字以内。如果画面信息不足、无法确认，输出"未知"，不要猜测。'

  const content = [{ type: 'text', text: prompt }].concat(
    rawList.map(function (b) {
      return { type: 'image_url', image_url: { url: toDataUrl(b) } }
    })
  )
  const messages = [{ role: 'user', content: content }]

  let data
  try {
    data = await httpsPost(
      BASE + '/chat/completions',
      { Authorization: 'Bearer ' + API_KEY },
      { model: VISION_MODEL, messages: messages, max_tokens: 32, temperature: 0.1 }
    )
  } catch (e) {
    return fail('识别服务异常: ', e)
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    return { code: 502, type: 'BAD_RESPONSE', error: '识别返回格式异常' }
  }

  const name = (data.choices[0].message.content || '').trim().replace(/[。.，,!！?？\s]/g, '').slice(0, 12)

  // 模型表示无法确定时不猜景点，明确返回不确定
  if (!name || /未知|无法|不确定|看不清|不能确定|抱歉/.test(name)) {
    return {
      code: 200,
      name: '',
      matched: false,
      uncertain: true,
      intro: '画面里的信息不足，暂时无法确定这是哪个景点。建议换一张包含标志性建筑或全景的照片，识别会更准。'
    }
  }

  const matched = spots.searchSpotByName(name)

  if (matched.length) {
    const m = matched[0]
    const k = spots.getSpotKnowledge(m.destId, m.name)
    return {
      code: 200,
      name: m.name,
      destId: m.destId,
      spotId: m.id,
      intro: k ? (k.history || k.culture || '') : '',
      matched: true
    }
  }

  // 没匹配到站内景点，直接返回模型识别出的名称，避免二次调用拖长耗时
  return {
    code: 200,
    name: name,
    destId: '',
    spotId: '',
    intro: '这个景点暂未收录到漫途知识库，但你可以在 AI 讲解里继续追问它的历史与看点。',
    matched: false
  }
}

/* ---------------- 2. 景点多轮对话 ---------------- */
async function spotChat(messages, spotId, style, spotName) {
  if (!API_KEY) return { code: 503, type: 'NO_KEY', error: '云函数未配置 AI_API_KEY 环境变量' }
  if (!Array.isArray(messages) || !messages.length) return { code: 400, type: 'BAD_REQUEST', error: '缺少消息' }

  let system = '你是漫途小程序的 AI 导游，正在为游客讲解景点。回答要结合真实历史资料，不要编造。'
  if (!spotId && spotName) {
    system += '当前地点：' + spotName + '（该地点未收录进站内知识库）。' +
      '只做通用、可核实的人文地理介绍；不确定的信息要明确说明不确定，不要编造门票价格、开放时间、具体数字。'
  }
  if (spotId) {
    const parts = String(spotId).split('_')
    const destId = parts[0]
    let spotName = ''
    for (const d of Object.keys(spots.DEST_SPOTS)) {
      for (const n of spots.DEST_SPOTS[d]) {
        if (spots.spotId(d, n) === spotId) { spotName = n; break }
      }
    }
    if (spotName) {
      const k = spots.getSpotKnowledge(destId, spotName)
      if (k) {
        system += '当前景点：' + spotName + '。'
        if (k.history) system += '历史（公开史料整理）：' + k.history + '。'
        if (k.culture) system += '文化背景：' + k.culture + '。'
        if (k.story) system += '故事传说（民间流传，讲述时必须说明这是传说，不能当作史实）：' + k.story + '。'
        if (k.architecture) system += '建筑特色：' + k.architecture + '。'
      }
    }
  }
  system += '讲解风格：' + (style || '历史学者') + '。回答简洁生动，不超过 200 字。'
  system += '资料使用规则：优先使用上面给定的知识库内容；知识库没有覆盖的内容，直接说明「现有资料未涵盖」，不要编造历史事件、人物、年代和文化寓意；引用传说时必须标明是传说。'

  const fullMessages = [{ role: 'system', content: system }].concat(messages)

  try {
    const data = await httpsPost(
      BASE + '/chat/completions',
      { Authorization: 'Bearer ' + API_KEY },
      {
        model: CHAT_MODEL,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 600,
        // 关闭思考过程，避免长推理导致超时
        enable_thinking: false
      },
      40000
    )
    if (data.choices && data.choices[0] && data.choices[0].message) {
      let reply = String(data.choices[0].message.content || '')
      reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      return { code: 200, reply: reply }
    }
    return { code: 502, type: 'BAD_RESPONSE', error: '对话返回格式异常' }
  } catch (e) {
    if (/超时|timeout/i.test(e && e.message || '')) {
      return { code: 504, type: 'TIMEOUT', error: 'AI 响应超时，请稍后重试' }
    }
    return fail('对话服务异常: ', e)
  }
}

/* ---------------- 3. AI 语音合成（TTS） ---------------- */
/** 请求二进制音频（OpenAI 兼容 /audio/speech） */
function httpsPostAudio(url, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const urlObj = new URL(url)
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: Object.assign({}, headers, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }),
      timeout: 30000
    }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        if (res.statusCode !== 200) {
          const err = new Error('HTTP ' + res.statusCode + ': ' + buf.toString('utf8').slice(0, 200))
          err.type = classifyStatus(res.statusCode)
          err.statusCode = res.statusCode
          return reject(err)
        }
        resolve(buf)
      })
    })
    req.on('timeout', () => {
      const err = new Error('请求超时')
      err.type = 'TIMEOUT'
      req.destroy(err)
      reject(err)
    })
    req.on('error', e => reject(e))
    req.write(payload)
    req.end()
  })
}

async function tts(text, voice) {
  if (!API_KEY) return { code: 503, type: 'NO_KEY', error: '云函数未配置 AI_API_KEY 环境变量' }
  if (!text) return { code: 400, type: 'BAD_REQUEST', error: '缺少文本' }

  // 硅基流动要求音色写成「模型ID:音色」，如 FunAudioLLM/CosyVoice2-0.5B:alex
  let v = voice || TTS_VOICE
  if (v.indexOf(':') === -1) v = TTS_MODEL + ':' + v
  const content = String(text).slice(0, 500)

  try {
    const buf = await httpsPostAudio(
      BASE + '/audio/speech',
      { Authorization: 'Bearer ' + API_KEY },
      { model: TTS_MODEL, input: content, voice: v, response_format: 'mp3' }
    )
    if (!buf || !buf.length) return { code: 502, error: 'TTS 返回空音频' }

    const hash = crypto.createHash('md5').update(TTS_MODEL + v + content).digest('hex')
    let up
    try {
      up = await cloud.uploadFile({ cloudPath: 'tts/' + hash + '.mp3', fileContent: buf })
    } catch (e) {
      up = await cloud.uploadFile({ cloudPath: 'tts/' + hash + '-' + Date.now() + '.mp3', fileContent: buf })
    }

    const urls = await cloud.getTempFileURL({ fileList: [up.fileID] })
    const audioUrl = urls.fileList && urls.fileList[0] ? urls.fileList[0].tempFileURL : ''
    if (!audioUrl) return { code: 502, error: '获取音频链接失败' }
    return { code: 200, audioUrl: audioUrl }
  } catch (e) {
    return fail('TTS 服务异常: ', e)
  }
}

/* ---------------- 4. 景点知识库查询 ---------------- */
function getSpotKnowledge(spotId) {
  if (!spotId) return { code: 400, error: '缺少 spotId' }
  const parts = String(spotId).split('_')
  const destId = parts[0]
  let spotName = ''
  for (const d of Object.keys(spots.DEST_SPOTS)) {
    for (const n of spots.DEST_SPOTS[d]) {
      if (spots.spotId(d, n) === spotId) { spotName = n; break }
    }
  }
  if (!spotName) return { code: 404, error: '景点不存在' }
  const k = spots.getSpotKnowledge(destId, spotName)
  return { code: 200, destId: destId, name: spotName, id: spotId, knowledge: k || {} }
}

/* ---------------- 4.5 AI 个性化路线优化 ---------------- */
async function aiPlan(q) {
  if (!API_KEY) return { code: 503, type: 'NO_KEY', error: '云函数未配置 AI_API_KEY 环境变量' }
  if (!q || !q.destName) return { code: 400, type: 'BAD_REQUEST', error: '缺少目的地' }

  const days = Math.max(1, Math.min(7, parseInt(q.days, 10) || 3))
  const spots = Array.isArray(q.spots) ? q.spots.slice(0, 14) : []
  const foods = Array.isArray(q.foods) ? q.foods.slice(0, 8) : []
  const allowed = {}
  spots.forEach(function (s) { if (s && s.name) allowed[s.name] = true })

  const spotLines = spots.map(function (s) {
    return '- ' + s.name + '：' + String(s.desc || '').slice(0, 60) +
      (s.ticket ? '（' + s.ticket + '）' : '') +
      (s.suggest ? '建议' + s.suggest : '')
  }).join('\n')

  const system = '你是行程规划师。只能使用用户给定的景点清单来安排行程，不得虚构景点、交通时长、实时票价和导航信息。'
  const user = [
    '目的地：' + q.destName,
    '天数：' + days + ' 天',
    '同行：' + (q.people || '朋友'),
    '节奏：' + (q.rhythm || '适中'),
    '偏好：' + ((q.prefs || []).join('、') || '无特别偏好'),
    '预算：' + (q.budget || '未指定'),
    '可用景点清单：',
    spotLines || '（无，请只做通用行程框架，不要编造具体景点）',
    '当地美食参考：' + (foods.map(function (f) { return f.name }).join('、') || '无'),
    '',
    '请只输出 JSON（不要 markdown 代码块、不要多余文字），格式：',
    '{"summary":"整体思路，120字以内","days":[{"day":"01","title":"当天主题","reason":"为什么这样安排","places":[{"name":"景点名，必须来自清单","reason":"为什么去这"}],"note":"当天提醒"}],"tips":["2到4条通用提醒"]}',
    '硬性要求：places 里的 name 必须严格来自上面的景点清单；不要写具体交通时长、实时票价、导航路线；不要编造清单外的景点。'
  ].join('\n')

  const body = {
    model: CHAT_MODEL,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    temperature: 0.7,
    max_tokens: 1200,
    // 关闭 Qwen3 系列默认的思考过程，避免长推理吃掉 token 导致 JSON 被截断
    enable_thinking: false
  }

  try {
    let data = await httpsPost(
      BASE + '/chat/completions',
      { Authorization: 'Bearer ' + API_KEY },
      body,
      28000
    )
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return { code: 502, type: 'BAD_RESPONSE', error: '路线返回格式异常' }
    }
    let text = String(data.choices[0].message.content || '').trim()
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    let start = text.indexOf('{')
    let end = text.lastIndexOf('}')
    let parsed = null
    if (start >= 0 && end > start) {
      try { parsed = JSON.parse(text.slice(start, end + 1)) } catch (e) { parsed = null }
    }

    // 首次解析失败时，用更严格的提示重试一次
    if (!parsed || !Array.isArray(parsed.days) || !parsed.days.length) {
      const retry = await httpsPost(
        BASE + '/chat/completions',
        { Authorization: 'Bearer ' + API_KEY },
        {
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: '你只输出 JSON，不输出任何解释文字。' },
            { role: 'user', content: user + '\n\n再次强调：直接输出 JSON 本体，第一个字符必须是 {，最后一个字符必须是 }。' }
          ],
          temperature: 0.2,
          max_tokens: 1200,
          enable_thinking: false
        },
        20000
      )
      if (retry && retry.choices && retry.choices[0] && retry.choices[0].message) {
        text = String(retry.choices[0].message.content || '').trim()
        text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
        start = text.indexOf('{')
        end = text.lastIndexOf('}')
        if (start >= 0 && end > start) {
          try { parsed = JSON.parse(text.slice(start, end + 1)) } catch (e) { parsed = null }
        }
      }
    }

    if (!parsed || !Array.isArray(parsed.days) || !parsed.days.length) {
      return { code: 502, type: 'BAD_RESPONSE', error: 'AI 行程解析失败' }
    }

    // 过滤掉清单之外的景点，避免模型编造
    const planDays = parsed.days.slice(0, days).map(function (d, i) {
      const places = (Array.isArray(d.places) ? d.places : []).filter(function (p) {
        return p && allowed[p.name]
      }).map(function (p) {
        return { name: p.name, reason: String(p.reason || '').slice(0, 80) }
      })
      return {
        day: String(d.day || (i + 1)).slice(0, 4),
        title: String(d.title || ('第 ' + (i + 1) + ' 天')).slice(0, 40),
        reason: String(d.reason || '').slice(0, 160),
        places: places,
        note: String(d.note || '').slice(0, 120)
      }
    })

    return {
      code: 200,
      plan: {
        summary: String(parsed.summary || '').slice(0, 300),
        days: planDays,
        tips: (Array.isArray(parsed.tips) ? parsed.tips : []).slice(0, 5).map(function (t) {
          return String(t).slice(0, 120)
        })
      }
    }
  } catch (e) {
    if (/超时|timeout/i.test(e && e.message || '')) {
      return { code: 504, type: 'TIMEOUT', error: 'AI 路线生成超时，请稍后重试' }
    }
    return fail('路线规划服务异常: ', e)
  }
}

/* ---------------- 5. 通用对话（攻略 AI 优化等） ---------------- */
// 模型只由云函数环境变量决定，忽略前端传入的 model，避免前端覆盖配置
async function chat(message) {
  if (!API_KEY) return { code: 503, type: 'NO_KEY', error: '云函数未配置 AI_API_KEY 环境变量' }
  if (!message) return { code: 400, type: 'BAD_REQUEST', error: '缺少消息' }

  try {
    const data = await httpsPost(
      BASE + '/chat/completions',
      { Authorization: 'Bearer ' + API_KEY },
      {
        model: CHAT_MODEL,
        messages: [{ role: 'user', content: String(message) }],
        temperature: 0.7,
        max_tokens: 800,
        enable_thinking: false
      },
      40000
    )
    if (data.choices && data.choices[0] && data.choices[0].message) {
      let reply = String(data.choices[0].message.content || '')
      reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      return { code: 200, reply: reply }
    }
    return { code: 502, type: 'UPSTREAM', error: '对话返回格式异常' }
  } catch (e) {
    if (/超时|timeout/i.test(e && e.message || '')) {
      return { code: 504, type: 'TIMEOUT', error: 'AI 响应超时，请稍后重试' }
    }
    return fail('文本模型调用失败: ', e)
  }
}

/* ---------------- 7. 连接自检 / 模型列表 ---------------- */
function maskKey() {
  if (!API_KEY) return ''
  return API_KEY.slice(0, 4) + '****' + API_KEY.slice(-4)
}

/** GET /models：以账号实际返回为准，核对模型 ID 是否存在 */
async function listModels() {
  if (!API_KEY) return { code: 503, type: 'NO_KEY', error: '未配置 AI_API_KEY' }
  try {
    const data = await httpsGet(BASE + '/models', { Authorization: 'Bearer ' + API_KEY }, 20000)
    const ids = (data.data || []).map(function (m) { return m.id })
    return { code: 200, total: ids.length, ids: ids }
  } catch (e) {
    return fail('模型列表获取失败: ', e)
  }
}

/** 写一个探针文件，返回云存储前缀（cloud://env.bucket），用于拼接高清图地址 */
async function storageProbe() {
  try {
    const up = await cloud.uploadFile({
      cloudPath: 'meta/probe.txt',
      fileContent: Buffer.from('mantu-cdn-probe')
    })
    const fileID = String(up.fileID || '')
    const prefix = fileID.replace(/\/meta\/probe\.txt$/, '')
    return { code: 200, fileID: fileID, prefix: prefix }
  } catch (e) {
    return { code: 500, type: 'STORAGE', error: '云存储探测失败: ' + e.message }
  }
}

/** 云函数连接自检：运行时 / Key / 文本模型 / 视觉模型 / 模型ID有效性 */
async function health(event) {
  const checks = []
  const configured = !!API_KEY

  checks.push({
    name: 'cloudRuntime',
    label: '云函数运行',
    ok: true,
    message: '云函数已正常执行'
  })

  checks.push({
    name: 'apiKey',
    label: 'API Key 配置',
    ok: configured,
    type: configured ? 'OK' : 'NO_KEY',
    message: configured
      ? '已配置 AI_API_KEY（' + maskKey() + '，长度 ' + API_KEY.length + '）'
      : '未配置 AI_API_KEY，请在云开发控制台 → 云函数 → ai → 环境变量中添加'
  })

  checks.push({
    name: 'endpoint',
    label: '接口地址',
    ok: !/dashscope|aliyuncs/i.test(BASE),
    type: /dashscope|aliyuncs/i.test(BASE) ? 'PROVIDER_MISMATCH' : 'OK',
    message: '当前地址：' + BASE
  })

  if (configured) {
    try {
      const data = await httpsPost(
        BASE + '/chat/completions',
        { Authorization: 'Bearer ' + API_KEY },
        {
          model: CHAT_MODEL,
          messages: [{ role: 'user', content: '只回复两个字：正常' }],
          max_tokens: 16,
          temperature: 0
        },
        25000
      )
      const reply = data.choices && data.choices[0] && data.choices[0].message
        ? String(data.choices[0].message.content) : ''
      checks.push({
        name: 'textModel',
        label: '文本模型 ' + CHAT_MODEL,
        ok: !!reply,
        type: reply ? 'OK' : 'BAD_RESPONSE',
        message: reply ? '调用成功，返回：' + reply.slice(0, 30) : '接口返回内容为空'
      })
    } catch (e) {
      checks.push({
        name: 'textModel',
        label: '文本模型 ' + CHAT_MODEL,
        ok: false,
        type: e.type || 'UNKNOWN',
        message: '调用失败：' + (e.message || '未知错误')
      })
    }
  }

  if (configured && event && event.withVision) {
    // 64x64 纯色 PNG（Qwen3-VL 要求宽高均大于 28px）
    const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwBfHEPbHWIbw4xAGC3Cbs9fXDRc0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa8NgFs4TBD2Pn/ncAAAAASUVORK5CYII='
    try {
      const data = await httpsPost(
        BASE + '/chat/completions',
        { Authorization: 'Bearer ' + API_KEY },
        {
          model: VISION_MODEL,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: '这张图是什么颜色？只回答颜色。' },
              { type: 'image_url', image_url: { url: pixel } }
            ]
          }],
          max_tokens: 16
        },
        30000
      )
      const reply = data.choices && data.choices[0] && data.choices[0].message
        ? String(data.choices[0].message.content) : ''
      checks.push({
        name: 'visionModel',
        label: '视觉模型 ' + VISION_MODEL,
        ok: !!reply,
        type: reply ? 'OK' : 'BAD_RESPONSE',
        message: reply ? '调用成功，返回：' + reply.slice(0, 30) : '接口返回内容为空'
      })
    } catch (e) {
      checks.push({
        name: 'visionModel',
        label: '视觉模型 ' + VISION_MODEL,
        ok: false,
        type: e.type || 'UNKNOWN',
        message: '调用失败：' + (e.message || '未知错误')
      })
    }
  }

  const failed = checks.filter(function (c) { return !c.ok })
  return {
    code: failed.length ? 500 : 200,
    ok: failed.length === 0,
    config: {
      baseUrl: BASE,
      keyConfigured: configured,
      keyMasked: maskKey(),
      visionModel: VISION_MODEL,
      chatModel: CHAT_MODEL,
      ttsModel: TTS_MODEL,
      ttsVoice: TTS_VOICE
    },
    checks: checks
  }
}

/* ---------------- 6. 景点评价聚合分析 ---------------- */
/**
 * 维度词表：用于把公开评价原文归类到 6 个核心维度
 * 只做关键词命中统计，不生成任何原文之外的内容
 */
const DIMENSIONS = [
  { key: 'experience', label: '游玩体验', words: ['值得', '震撼', '好玩', '风景', '景色', '体验', '壮观', '惊喜', '无聊', '失望'] },
  { key: 'value', label: '性价比', words: ['门票', '票价', '性价比', '收费', '免费', '便宜', '贵'] },
  { key: 'transport', label: '交通便利', words: ['地铁', '公交', '打车', '交通', '停车', '步行', '方便', '偏远', '堵车'] },
  { key: 'photo', label: '打卡出片', words: ['拍照', '出片', '机位', '打卡', '照片', '好看', '漂亮'] },
  { key: 'service', label: '服务质量', words: ['服务', '讲解', '工作人员', '态度', '导游', '指示牌', '管理'] },
  { key: 'queue', label: '排队时长', words: ['排队', '人太多', '人多', '拥挤', '预约', '限流', '爆满'] }
]

const POS_WORDS = ['值得', '推荐', '震撼', '喜欢', '好玩', '漂亮', '好看', '方便', '满意', '舒服', '出片', '不错', '惊喜', '性价比高', '不虚此行']
const NEG_WORDS = ['不值', '失望', '一般', '无聊', '太贵', '踩雷', '坑', '态度差', '不方便', '偏远', '拥挤', '排队两小时', '人太多', '不推荐']

/** 单维度打分：命中该维度的评价里，正负情绪比例映射到 1-10 */
function scoreDimension(quotes, words) {
  let pos = 0
  let neg = 0
  let mentions = 0
  quotes.forEach(function (q) {
    const text = String(q.text || '')
    const hit = words.some(function (w) { return text.indexOf(w) >= 0 })
    if (!hit) return
    mentions++
    const p = POS_WORDS.some(function (w) { return text.indexOf(w) >= 0 })
    const n = NEG_WORDS.some(function (w) { return text.indexOf(w) >= 0 })
    if (p && !n) pos++
    else if (n && !p) neg++
  })
  if (!mentions) return { score: null, mentions: 0 }
  const ratio = (pos - neg) / mentions
  const score = Math.max(1, Math.min(10, Math.round((5 + ratio * 4) * 10) / 10))
  return { score: score, mentions: mentions }
}

/** 基于评价原文做维度归类与打分（失败时回退到关键词统计，不编造内容） */
async function aiAnalyze(name, quotes, platforms, keywordDims) {
  const lines = quotes.map(function (q, i) {
    return (i + 1) + '. [' + q.platform + '] ' + q.text
  }).join('\n')
  const prompt =
    '你是旅游评价分析助手。下面是景点「' + name + '」的 ' + quotes.length + ' 条公开用户评价原文，来源：' +
    platforms.join('、') + '。\n' + lines + '\n\n' +
    '请只依据以上原文分析，不得引入原文没有的信息，不得编造，不得使用第一人称。\n' +
    '输出严格 JSON：\n' +
    '{"dimensions":[{"key":"experience","score":8.2,"evidence":"支撑该分数的原文短语"}],' +
    '"summary":"120-180字中立综合评价，先概括口碑，再点出主要优点和主要槽点","pros":["优点"],"cons":["槽点"]}\n' +
    'key 只能取 experience(游玩体验) / value(性价比) / transport(交通便利) / photo(打卡出片) / service(服务质量) / queue(排队时长)。\n' +
    '只对原文里有依据的维度打分（1-10，可一位小数），没有依据的维度不要输出；' +
    '分数必须反映原文的正负面倾向，不同景点不能给雷同分数。'

  try {
    const data = await httpsPost(
      BASE + '/chat/completions',
      { Authorization: 'Bearer ' + API_KEY },
      {
        model: CHAT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      }
    )
    const raw = data.choices && data.choices[0] && data.choices[0].message
      ? String(data.choices[0].message.content) : ''
    const json = raw.match(/\{[\s\S]*\}/)
    if (json) {
      const parsed = JSON.parse(json[0])
      const dims = (parsed.dimensions || [])
        .filter(function (d) {
          return d && d.score !== undefined && d.score !== null &&
            DIMENSIONS.some(function (k) { return k.key === d.key })
        })
        .slice(0, 6)
        .map(function (d) {
          const meta = DIMENSIONS.filter(function (k) { return k.key === d.key })[0]
          const score = Math.max(1, Math.min(10, Math.round(Number(d.score) * 10) / 10))
          return { key: d.key, label: meta.label, score: score, evidence: String(d.evidence || '').slice(0, 40) }
        })
      if (parsed.summary && dims.length) {
        return {
          dimensions: dims,
          summary: String(parsed.summary),
          pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 3).map(String) : [],
          cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 3).map(String) : []
        }
      }
    }
  } catch (e) { /* 回退到关键词统计 */ }

  const strong = keywordDims.filter(function (d) { return d.score >= 6.5 })
  const weak = keywordDims.filter(function (d) { return d.score < 4.5 })
  return {
    dimensions: keywordDims,
    summary: '共汇总 ' + quotes.length + ' 条来自' + platforms.join('、') + '的公开用户评价。' +
      (strong.length ? '口碑较好的方面是' + strong.map(function (d) { return d.label }).join('、') + '；' : '') +
      (weak.length ? '争议主要集中在' + weak.map(function (d) { return d.label }).join('、') + '；' : '') +
      '具体感受可参考下方各平台评价原文。',
    pros: [],
    cons: []
  }
}

async function spotReview(name) {
  if (!name) return { code: 400, error: '缺少景点名称' }
  const record = reviews[name]
  if (!record || !record.quotes || !record.quotes.length) {
    return {
      code: 200, name: name, enough: false, score: null, sample: { quotes: 0, platforms: [] },
      dimensions: [], summary: '暂未采集到该景点足够数量的公开用户评价，因此不输出评分，避免主观偏差。',
      pros: [], cons: [], quotes: []
    }
  }

  const quotes = record.quotes
  const platforms = []
  quotes.forEach(function (q) {
    if (q.platform && platforms.indexOf(q.platform) < 0) platforms.push(q.platform)
  })

  const keywordDims = DIMENSIONS.map(function (d) {
    const r = scoreDimension(quotes, d.words)
    return { key: d.key, label: d.label, score: r.score, mentions: r.mentions }
  }).filter(function (d) { return d.score !== null })

  const analysis = await aiAnalyze(name, quotes, platforms, keywordDims)
  const dims = analysis.dimensions

  let score = null
  if (dims.length) {
    const total = dims.reduce(function (s, d) { return s + d.score }, 0)
    score = Math.round((total / dims.length) * 10) / 10
  }

  return {
    code: 200,
    name: name,
    enough: true,
    score: score,
    sample: {
      quotes: quotes.length,
      platforms: platforms,
      dimensionCount: dims.length
    },
    dimensions: dims,
    summary: analysis.summary,
    pros: analysis.pros,
    cons: analysis.cons,
    quotes: quotes.slice(0, 8)
  }
}

/* ---------------- 云函数入口 ---------------- */
exports.main = async (event, context) => {
  const action = event.action

  try {
    switch (action) {
      case 'recognize':
        return await recognize(event.image, event.images, event.fileIDs)
      case 'spotChat':
        return await spotChat(event.messages, event.spotId, event.style, event.spotName)
      case 'tts':
        return await tts(event.text, event.voice)
      case 'spotKnowledge':
        return getSpotKnowledge(event.spotId)
      case 'plan':
        return await aiPlan(event.plan)
      case 'chat':
        return await chat(event.message)
      case 'spotReview':
        return await spotReview(event.spotName)
      case 'health':
        return await health(event)
      case 'models':
        return await listModels()
      case 'storageProbe':
        return await storageProbe()
      default:
        return { code: 400, error: '未知 action: ' + action }
    }
  } catch (e) {
    return { code: 500, error: '云函数内部错误: ' + e.message }
  }
}
