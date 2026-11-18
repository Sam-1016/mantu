/**
 * ============================================================
 * 漫途 · 本地后台服务（零第三方依赖，Node.js 原生模块实现）
 * ------------------------------------------------------------
 * 功能：
 *  1. POST   /api/chat    桥接本地 Ollama 大模型（默认 deepseek-r1:7b）
 *                         入参 { model, message }，统一返回 { reply }
 *  2. GET    /api/guides?type=my|community      读取攻略列表
 *  3. POST   /api/guides?type=my|community      新增攻略（置顶插入）
 *  4. PUT    /api/guides?type=my|community      整体替换列表（重置用）
 *  5. DELETE /api/guides?type=my|community&id=x 删除单条攻略
 *  6. GET    / 或 /api/health                   健康检查
 *  7. POST   /api/recognize                     AI 拍照识景（DashScope qwen-vl）
 *  8. POST   /api/spot-chat                     景点多轮对话（DashScope qwen-plus，注入知识库）
 *  9. POST   /api/tts                           AI 语音讲解（DashScope Qwen-TTS，返回音频 URL）
 * 10. GET    /api/spot-knowledge?spotId=        返回景点知识库
 *
 * 环境变量：
 *   DASHSCOPE_API_KEY  阿里云百炼 API Key（视觉/对话/TTS 必需）
 *   未设置时上述 4 个接口返回 503，提示配置 Key。
 * 数据持久化：同目录 data.json（首次运行自动创建）
 *
 * 启动方式：
 *   双击 start.bat，或在本目录执行  node server.js
 * 前置条件：
 *   安装 Node.js；如需 AI 能力，另需启动 Ollama（默认 127.0.0.1:11434）
 * 小程序端：
 *   微信开发者工具需勾选「详情 -> 本地设置 -> 不校验合法域名」
 * ============================================================
 */

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const url = require('url')
const spots = require('./spots.js')

const PORT = 3000
const OLLAMA = 'http://127.0.0.1:11434'
const DASHSCOPE = 'https://dashscope.aliyuncs.com'
const API_KEY = process.env.DASHSCOPE_API_KEY || ''
const DATA_FILE = path.join(__dirname, 'data.json')

/* ---------------- 数据持久化（data.json 文件存储） ---------------- */
function readData() {
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    if (!Array.isArray(d.my)) d.my = []
    if (!Array.isArray(d.community)) d.community = []
    return d
  } catch (e) {
    return { my: [], community: [] }
  }
}

function writeData(d) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2), 'utf8')
  } catch (e) {
    console.log('写入 data.json 失败：' + e.message)
  }
}

/* ---------------- 通用工具 ---------------- */
function send(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise(resolve => {
    let raw = ''
    req.on('data', c => { raw += c })
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')) } catch (e) { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

/* ---------------- AI 桥接：转发到 Ollama /api/generate ----------------
 * 小程序端只认统一格式 { reply }，屏蔽 Ollama 原生响应结构差异 */
function handleChat(req, res) {
  readBody(req).then(body => {
    const payload = JSON.stringify({
      model: body.model || 'deepseek-r1:7b',
      prompt: body.message || '',
      stream: false
    })
    const r = http.request(OLLAMA + '/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 180000 // DeepSeek-R1 思维链推理较慢，放宽到 3 分钟
    }, or => {
      let raw = ''
      or.on('data', c => { raw += c })
      or.on('end', () => {
        try {
          const d = JSON.parse(raw)
          send(res, 200, { reply: d.response || '' })
        } catch (e) {
          send(res, 502, { reply: '', error: 'Ollama 返回格式异常' })
        }
      })
    })
    r.on('timeout', () => {
      r.destroy()
      send(res, 504, { reply: '', error: 'Ollama 推理超时' })
    })
    r.on('error', () => {
      send(res, 502, { reply: '', error: 'Ollama 未启动（127.0.0.1:11434）' })
    })
    r.write(payload)
    r.end()
  })
}

/* ---------------- 攻略 CRUD ---------------- */
function handleGuides(req, res, query) {
  const type = query.type === 'my' ? 'my' : 'community'
  const data = readData()

  if (req.method === 'GET') {
    send(res, 200, { list: data[type] })
    return
  }

  if (req.method === 'POST') {
    readBody(req).then(g => {
      if (!g || typeof g !== 'object') g = {}
      if (!g.id) g.id = 'g' + Date.now()
      if (!g.createdAt) g.createdAt = Date.now()
      // 同 id 去重后置顶插入
      data[type] = [g].concat(data[type].filter(x => x.id !== g.id))
      writeData(data)
      send(res, 200, { ok: true, id: g.id })
    })
    return
  }

  if (req.method === 'PUT') {
    readBody(req).then(b => {
      data[type] = b && Array.isArray(b.list) ? b.list : []
      writeData(data)
      send(res, 200, { ok: true, total: data[type].length })
    })
    return
  }

  if (req.method === 'DELETE') {
    const id = query.id
    data[type] = data[type].filter(g => g.id !== id)
    writeData(data)
    send(res, 200, { ok: true })
    return
  }

  send(res, 405, { error: 'method not allowed' })
}

/* ---------------- 通用：调用 DashScope OpenAI 兼容接口 ---------------- */
function callDashScope(model, messages, onResult) {
  if (!API_KEY) {
    onResult({ code: 503, error: '后端未配置 DASHSCOPE_API_KEY' })
    return
  }
  const payload = JSON.stringify({ model, messages })
  const reqOptions = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 120000
  }
  const r = https.request(DASHSCOPE + '/compatible-mode/v1/chat/completions', reqOptions, or => {
    let raw = ''
    or.on('data', c => { raw += c })
    or.on('end', () => {
      try {
        const d = JSON.parse(raw)
        if (d.choices && d.choices[0] && d.choices[0].message) {
          onResult({ code: 200, reply: d.choices[0].message.content || '' })
        } else {
          onResult({ code: 502, error: (d.message || d.error || 'DashScope 返回异常') })
        }
      } catch (e) {
        onResult({ code: 502, error: 'DashScope 返回格式异常' })
      }
    })
  })
  r.on('timeout', () => { r.destroy(); onResult({ code: 504, error: 'AI 推理超时' }) })
  r.on('error', () => onResult({ code: 502, error: '无法连接 DashScope 服务' }))
  r.write(payload)
  r.end()
}

/* ---------------- 7. AI 拍照识景 ---------------- */
function handleRecognize(req, res) {
  readBody(req).then(body => {
    const base64 = body && body.image ? String(body.image) : ''
    if (!base64) { send(res, 400, { error: '缺少图片' }); return }
    const imageUrl = base64.indexOf('data:') === 0 ? base64 : 'data:image/jpeg;base64,' + base64
    const prompt = '请识别这张图片中的景点、建筑或自然景观。只输出景点名称，不要解释，不要加标点，10个字以内。如果无法确定，输出"未知"。'
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }]
    callDashScope('qwen-vl-plus', messages, function (r) {
      if (r.code !== 200) { send(res, r.code, { error: r.error }); return }
      const name = (r.reply || '').trim().replace(/[。.，,!！?？\s]/g, '').slice(0, 12)
      // 匹配本地景点库
      const matched = name && name !== '未知' ? spots.searchSpotByName(name) : []
      if (matched.length) {
        const m = matched[0]
        const k = spots.getSpotKnowledge(m.destId, m.name)
        send(res, 200, {
          name: m.name,
          destId: m.destId,
          spotId: m.id,
          intro: k ? (k.history || k.culture || '') : '',
          matched: true
        })
      } else {
        // 没匹配到，用模型再生成一段介绍
        const introMsg = [{ role: 'user', content: '用一句话介绍景点"' + name + '"，30字以内。' }]
        callDashScope('qwen-plus', introMsg, function (r2) {
          send(res, 200, {
            name: name,
            destId: '',
            spotId: '',
            intro: r2.code === 200 ? r2.reply : '',
            matched: false
          })
        })
      }
    })
  })
}

/* ---------------- 8. 景点多轮对话 ---------------- */
function handleSpotChat(req, res) {
  readBody(req).then(body => {
    const messages = (body && Array.isArray(body.messages)) ? body.messages : []
    const spotId = body && body.spotId ? String(body.spotId) : ''
    const style = body && body.style ? String(body.style) : '历史学者'
    if (!messages.length) { send(res, 400, { error: '缺少消息' }); return }

    // 注入景点知识库作为 system prompt
    let system = '你是漫途小程序的 AI 导游，正在为游客讲解景点。回答要结合真实历史资料，不要编造。'
    if (spotId) {
      const parts = spotId.split('_')
      const destId = parts[0]
      // 从 spotId 反查景点名
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
          if (k.history) system += '历史由来：' + k.history + '。'
          if (k.culture) system += '文化背景：' + k.culture + '。'
          if (k.story) system += '历史故事：' + k.story + '。'
          if (k.architecture) system += '建筑特色：' + k.architecture + '。'
        }
      }
    }
    system += '讲解风格：' + style + '。回答简洁生动，不超过 200 字。'

    const fullMessages = [{ role: 'system', content: system }].concat(messages)
    callDashScope('qwen-plus', fullMessages, function (r) {
      if (r.code !== 200) { send(res, r.code, { error: r.error }); return }
      send(res, 200, { reply: r.reply })
    })
  })
}

/* ---------------- 9. AI 语音合成（TTS） ---------------- */
function handleTts(req, res) {
  if (!API_KEY) { send(res, 503, { error: '后端未配置 DASHSCOPE_API_KEY' }); return }
  readBody(req).then(body => {
    const text = body && body.text ? String(body.text) : ''
    const voice = body && body.voice ? String(body.voice) : 'longxiaochun'
    if (!text) { send(res, 400, { error: '缺少文本' }); return }

    const payload = JSON.stringify({
      model: 'cosyvoice-v1',
      input: { text: text },
      parameters: { voice: voice }
    })
    const reqOptions = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 60000
    }
    const r = https.request(DASHSCOPE + '/api/v1/services/aigc/text2audio/audio-synthesis', reqOptions, or => {
      let raw = ''
      or.on('data', c => { raw += c })
      or.on('end', () => {
        try {
          const d = JSON.parse(raw)
          const audioUrl = d.output && d.output.audio_url ? d.output.audio_url : ''
          if (audioUrl) {
            send(res, 200, { audioUrl: audioUrl })
          } else {
            send(res, 502, { error: d.message || 'TTS 返回无音频地址' })
          }
        } catch (e) {
          send(res, 502, { error: 'TTS 返回格式异常' })
        }
      })
    })
    r.on('timeout', () => { r.destroy(); send(res, 504, { error: 'TTS 合成超时' }) })
    r.on('error', () => send(res, 502, { error: '无法连接 DashScope TTS 服务' }))
    r.write(payload)
    r.end()
  })
}

/* ---------------- 10. 景点知识库查询 ---------------- */
function handleSpotKnowledge(req, res, query) {
  const spotId = query.spotId || ''
  const parts = spotId.split('_')
  const destId = parts[0]
  let spotName = ''
  for (const d of Object.keys(spots.DEST_SPOTS)) {
    for (const n of spots.DEST_SPOTS[d]) {
      if (spots.spotId(d, n) === spotId) { spotName = n; break }
    }
  }
  if (!spotName) { send(res, 404, { error: '景点不存在' }); return }
  const k = spots.getSpotKnowledge(destId, spotName)
  send(res, 200, { destId, name: spotName, id: spotId, knowledge: k || {} })
}

/* ---------------- 路由入口 ---------------- */
const server = http.createServer((req, res) => {
  const u = url.parse(req.url, true)

  if (req.method === 'OPTIONS') { send(res, 200, {}); return }
  if (u.pathname === '/api/chat' && req.method === 'POST') { handleChat(req, res); return }
  if (u.pathname === '/api/guides') { handleGuides(req, res, u.query); return }
  if (u.pathname === '/api/recognize' && req.method === 'POST') { handleRecognize(req, res); return }
  if (u.pathname === '/api/spot-chat' && req.method === 'POST') { handleSpotChat(req, res); return }
  if (u.pathname === '/api/tts' && req.method === 'POST') { handleTts(req, res); return }
  if (u.pathname === '/api/spot-knowledge' && req.method === 'GET') { handleSpotKnowledge(req, res, u.query); return }
  if (u.pathname === '/' || u.pathname === '/api/health') {
    send(res, 200, { ok: true, name: '漫途本地后台', time: Date.now() })
    return
  }
  send(res, 404, { error: 'not found' })
})

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.log('端口 ' + PORT + ' 被占用：请先关闭占用该端口的旧后台进程，再重新启动')
    return
  }
  throw e
})

server.listen(PORT, () => {
  console.log('===========================================')
  console.log(' 漫途本地后台已启动')
  console.log(' 接口地址: http://127.0.0.1:' + PORT)
  console.log(' AI 桥接:  POST /api/chat -> Ollama(11434)')
  console.log(' 攻略接口: GET/POST/PUT/DELETE /api/guides')
  console.log(' 提示: 微信开发者工具需勾选「不校验合法域名」')
  console.log('===========================================')
})
