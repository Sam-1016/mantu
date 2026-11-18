# 漫途 · AI 文旅攻略共创小程序

> 第九届传智杯 AI 微信小程序开发挑战赛 · 赛道三 AI 微信小程序开发挑战赛

漫途是一款面向自由行用户的 AI 文旅攻略共创小程序。用户可以用一句话描述目的地、天数和偏好，让 AI 生成可按天执行的行程；也可以拍下眼前的景物，让 AI 识别并讲解；还可以沿城市路线逐个景点听讲解、看交通与耗时，最后把路线存进行程或发布到社区。

## 功能特性

- **AI 行程规划**：目的地 + 天数 + 节奏 + 偏好 → 按天、按时间、带交通方式的可执行行程，可保存为行程草案。
- **AI 景点讲解**：三种讲解风格（历史学者 / 故事讲述者 / 趣味导游）、三种时长、多轮追问、语音播放。
- **AI 拍照识景**：相册 / 拍照 / 录像三种方式，识别景点后直达讲解。
- **城市路线**：内置 20 条城市路线，景点按时间排序，标注交通方式、距离、耗时与看点。
- **攻略与目的地**：20 个目的地、20 篇结构化攻略、61 条景点知识，覆盖路线、花费、贴士、住宿与美食。
- **社区共创**：发布攻略、点赞、收藏，服务端校验 openid。
- **个人资产**：收藏、浏览历史、行程草案、个人资料与设置。

## 目录结构

```
.
├── frontend/                 # 微信小程序（原生）
│   ├── app.js                # 全局逻辑与云开发初始化
│   ├── app.json              # 页面与 tabBar 配置
│   ├── app.wxss              # 全局样式与设计变量
│   ├── components/           # 公共组件（自定义导航栏等）
│   ├── pages/                # 24 个页面
│   ├── utils/                # 接口、路线、目的地、景点知识等数据
│   ├── images/               # 图片与 tabBar 图标
│   ├── cloudfunctions/
│   │   ├── ai/               # AI 云函数（识景 / 讲解 / 语音 / 规划）
│   │   └── community/        # 社区云函数（发布 / 点赞 / 收藏）
│   ├── project.config.json
│   └── sitemap.json
└── backend/                  # 本地 Node 后端（可选，零第三方依赖）
    ├── server.js             # HTTP 服务
    ├── spots.js              # 景点知识库
    ├── data.json             # 攻略数据
    └── start.bat             # Windows 启动脚本
```

## 技术栈

- 微信原生小程序（WXML / WXSS / JS），无第三方 UI 框架
- 微信云开发：云函数、云数据库、云存储
- AI 模型（默认接入硅基流动，模型名可通过环境变量替换）
  - 视觉：`Qwen/Qwen3-VL-8B-Instruct`
  - 文本：`Qwen/Qwen3.5-9B`
  - 语音：`FunAudioLLM/CosyVoice2-0.5B`
- 本地后端：Node.js 原生 `http` 模块，无第三方依赖

## 快速开始

### 1. 导入项目

1. 安装并打开「微信开发者工具」。
2. 选择「导入项目」，目录选择本仓库的 `frontend/`。
3. 在 `frontend/project.config.json` 中把 `appid` 替换为你自己的小程序 AppID。
4. 在 `frontend/app.js` 中把 `wx.cloud.init` 的 `env` 替换为你自己的云开发环境 ID。

### 2. 开通云开发

在微信开发者工具中点击「云开发」，创建一个环境。若使用已有环境，保持 `app.js` 中的 `env` 与环境 ID 一致。

### 3. 部署云函数

在 `frontend/cloudfunctions/` 下分别右键 `ai`、`community`：

1. 选择「上传并部署：云端安装依赖」。
2. 等待部署完成后，在云开发控制台为 `ai` 云函数配置环境变量（见下表）。

### 4. 配置云函数环境变量

`ai` 云函数（云开发控制台 → 云函数 → ai → 配置 → 环境变量）：

| 变量名 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `AI_API_KEY` | 是 | 无 | 模型服务 API Key，仅存放于云函数环境变量 |
| `AI_BASE_URL` | 否 | `https://api.siliconflow.cn/v1` | 模型服务地址（OpenAI 兼容接口） |
| `VISION_MODEL` | 否 | `Qwen/Qwen3-VL-8B-Instruct` | 拍照识景使用的视觉模型 |
| `CHAT_MODEL` | 否 | `Qwen/Qwen3.5-9B` | 讲解、规划、问答使用的文本模型 |
| `TTS_MODEL` | 否 | `FunAudioLLM/CosyVoice2-0.5B` | 语音合成模型 |
| `TTS_VOICE` | 否 | `alex` | 语音音色 |

> 密钥安全：Key 只从云函数环境变量读取，不写入代码、不落日志、不出现在返回体中。前端不接触任何密钥。

### 5. 初始化社区数据库

`community` 云函数使用三个集合：`community_posts`、`community_likes`、`community_favs`。在云开发控制台手动创建，或调用一次 `init`：

```js
wx.cloud.callFunction({ name: 'community', data: { action: 'init' } })
```

### 6. 运行

- 使用云函数：直接编译预览即可，AI 能力经云函数调用。
- 使用本地后端：在微信开发者工具「详情 → 本地设置」勾选「不校验合法域名」，然后启动 `backend`。

## 本地后端（可选）

`backend` 用于在没有云环境或需要本地联调时提供 HTTP 接口，零第三方依赖。

```bash
# Windows：双击 start.bat，或
cd backend
node server.js
```

服务默认监听 `http://127.0.0.1:3000`。可用环境变量 `DASHSCOPE_API_KEY` 配置云端模型 Key（未配置时 AI 接口返回 503）。

主要接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/chat` | 文本对话 / 多轮消息 |
| GET / POST / PUT / DELETE | `/api/guides?type=my\|community` | 攻略列表读取、新增、替换、删除 |
| GET | `/api/health` | 健康检查 |
| POST | `/api/recognize` | 拍照识景 |
| POST | `/api/spot-chat` | 景点多轮讲解 |
| POST | `/api/tts` | 语音合成 |
| GET | `/api/spot-knowledge?spotId=` | 景点知识库 |
| GET | `/audio/xxx.wav` | 语音文件下载 |

## AI 能力说明

所有 AI 请求统一经云函数 `ai` 中转，前端调用方式：

```js
wx.cloud.callFunction({ name: 'ai', data: { action: 'recognize', image: base64 } })
```

支持的 `action`：`recognize`、`spotChat`、`tts`、`spotKnowledge`、`spotReview`、`plan`、`chat`、`health`、`models`、`storageProbe`。

- 调用方式：`wx.cloud.callFunction`，由云函数以 HTTPS 调用模型服务。
- 超时控制：上游请求 45 秒超时，低于云函数 60 秒上限。
- 错误分类：`AUTH`、`MODEL_NOT_FOUND`、`RATE_LIMIT`、`UPSTREAM`、`BAD_REQUEST`。
- 成本说明：按模型服务实际调用量计费，演示版本无内置额度限制，请自行控制 Key 的用量。

## 常见问题

**Q：AI 接口返回 503 / AUTH 错误？**
检查 `ai` 云函数是否配置了 `AI_API_KEY`，以及 Key 是否与 `AI_BASE_URL` 对应的服务商匹配。

**Q：提示模型不存在（MODEL_NOT_FOUND）？**
调用 `action: 'models'` 查看账号可用模型 ID，并同步修改 `VISION_MODEL`、`CHAT_MODEL`、`TTS_MODEL`。

**Q：图片识别失败？**
大图建议使用云存储 `fileID` 方式传入；同时确认 `recognize` 的图片格式与大小符合模型限制。

**Q：本地后端能启动但 AI 不可用？**
确认已设置 `DASHSCOPE_API_KEY`，并检查本机网络能否访问模型服务。

**Q：开发者工具请求本地后端失败？**
在「详情 → 本地设置」勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」。

## 参赛信息

- 赛事：第九届传智杯 AI 微信小程序开发挑战赛
- 赛道：赛道三 AI 微信小程序开发挑战赛
- 作品：漫途（MANTU）
- 技术形态：微信原生小程序 + 微信云开发

## 说明

- `frontend/images/` 中的图片仅用于作品演示。
- 文中票价、开放时间等信息以官方为准；AI 讲解中的民间传说已标注为「非史实结论」。
