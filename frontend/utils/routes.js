/**
 * 路线数据：每个目的地按推荐顺序排列景点，
 * 景点之间标注距离(km)、交通方式和耗时。
 * 交通方式：walk(步行) / taxi(打车) / subway(地铁) / bus(公交) / bike(骑车) / drive(自驾) / boat(船)
 */
const routes = {
  dali: {
    name: '大理 · 环海慢游',
    duration: '3天',
    desc: '古城 → 喜洲 → 海舌 → 双廊，环海西线走一遍',
    spots: [
      { name: '人民公园', day: 1, time: '09:00', note: '古城慢慢走，喝一碗茶再出发' },
      { name: '喜洲古镇', day: 1, time: '14:00', note: '严家民居逛完进小巷找破酥粑粑' },
      { name: '才村码头', day: 1, time: '18:00', note: '日落前到，别再折返古城吃晚饭' },
      { name: '双廊', day: 2, time: '16:00', note: '玉几岛看海，晚饭推迟到日落之后' }
    ],
    segments: [
      { from: '人民公园', to: '喜洲古镇', distance: 24, transport: 'drive', cost: '自驾约 40 分钟' },
      { from: '喜洲古镇', to: '才村码头', distance: 14, transport: 'bike', cost: '骑车约 30 分钟 / 电瓶车约 20 分钟' },
      { from: '才村码头', to: '双廊', distance: 28, transport: 'drive', cost: '自驾约 50 分钟，走环海西路' }
    ]
  },
  luoyang: {
    name: '洛阳 · 石窟与古城',
    duration: '2天',
    desc: '龙门石窟 → 白马寺 → 洛邑古城',
    spots: [
      { name: '龙门石窟', day: 1, time: '09:00', note: '上午西山顺光，卢舍那大佛在奉先寺' },
      { name: '白马寺', day: 2, time: '09:00', note: '上午清净，四国佛殿都可以进' },
      { name: '洛邑古城', day: 2, time: '19:00', note: '晚上灯光亮起来最好，文峰塔一带人多' }
    ],
    segments: [
      { from: '龙门石窟', to: '白马寺', distance: 32, transport: 'taxi', cost: '打车约 45 分钟，也可公交 58 路' },
      { from: '白马寺', to: '洛邑古城', distance: 15, transport: 'subway', cost: '地铁 1 号线直达，约 30 分钟' }
    ]
  },
  beijing: {
    name: '北京 · 中轴线一日',
    duration: '1天',
    desc: '故宫 → 景山 → 胡同',
    spots: [
      { name: '故宫', day: 1, time: '08:30', note: '提前预约，午门进神武门出' },
      { name: '景山', day: 1, time: '12:30', note: '用很短时间看整座城的轮廓' },
      { name: '胡同', day: 1, time: '15:00', note: '国子监和五道营比南锣安静' }
    ],
    segments: [
      { from: '故宫', to: '景山', distance: 1, transport: 'walk', cost: '步行约 15 分钟，神武门出来直接上' },
      { from: '景山', to: '胡同', distance: 3, transport: 'walk', cost: '步行约 40 分钟，或打车 10 分钟' }
    ]
  },
  xian: {
    name: '西安 · 古都精华',
    duration: '3天',
    desc: '兵马俑 → 城墙 → 大唐不夜城',
    spots: [
      { name: '兵马俑', day: 1, time: '08:00', note: '一号坑清晨人最少，约 2.5 小时' },
      { name: '西安城墙', day: 2, time: '16:00', note: '日落前上去最好，租自行车骑一圈' },
      { name: '大唐不夜城', day: 2, time: '19:30', note: '晚上不倒翁和唐风演出，人多但气氛足' }
    ],
    segments: [
      { from: '兵马俑', to: '西安城墙', distance: 45, transport: 'subway', cost: '地铁 9 号线换 2 号线，约 1 小时' },
      { from: '西安城墙', to: '大唐不夜城', distance: 4, transport: 'subway', cost: '地铁 2 号线直达，约 15 分钟' }
    ]
  },
  chongqing: {
    name: '重庆 · 8D 山城',
    duration: '2天',
    desc: '洪崖洞 → 李子坝 → 长江索道',
    spots: [
      { name: '洪崖洞', day: 1, time: '19:00', note: '晚上 7 点后亮灯，从千厮门大桥上拍全景' },
      { name: '李子坝', day: 2, time: '14:00', note: '2 号线穿楼，楼下观景平台免费' },
      { name: '长江索道', day: 2, time: '16:00', note: '新华路站上新街站下，傍晚过江看两岸' }
    ],
    segments: [
      { from: '洪崖洞', to: '李子坝', distance: 5, transport: 'subway', cost: '地铁 1 号线换 2 号线，约 25 分钟' },
      { from: '李子坝', to: '长江索道', distance: 5, transport: 'subway', cost: '地铁 2 号线换 1 号线，约 25 分钟' }
    ]
  },
  hangzhou: {
    name: '杭州 · 西湖与灵隐',
    duration: '2天',
    desc: '苏堤 → 灵隐寺 → 九溪烟树',
    spots: [
      { name: '苏堤', day: 1, time: '07:00', note: '清晨 7 点前只有晨练的人，春天桃柳相间' },
      { name: '灵隐寺', day: 2, time: '09:00', note: '飞来峰 + 香花券，工作日早晨去' },
      { name: '九溪烟树', day: 2, time: '14:00', note: '从九溪走到龙井村，溪水茶园一路' }
    ],
    segments: [
      { from: '苏堤', to: '灵隐寺', distance: 6, transport: 'taxi', cost: '打车约 20 分钟' },
      { from: '灵隐寺', to: '九溪烟树', distance: 8, transport: 'taxi', cost: '打车约 25 分钟，或公交 103 路' }
    ]
  },
  shanghai: {
    name: '上海 · 梧桐与外滩',
    duration: '2天',
    desc: '武康路 → 外滩 → 苏州河',
    spots: [
      { name: '武康路', day: 1, time: '10:00', note: '梧桐和拐角咖啡馆，适合没目的的两小时' },
      { name: '外滩', day: 1, time: '17:00', note: '日落时到，天完全黑后再离开' },
      { name: '苏州河', day: 1, time: '20:00', note: '从邮政博物馆走到昌平路，夜风舒服' }
    ],
    segments: [
      { from: '武康路', to: '外滩', distance: 5, transport: 'subway', cost: '地铁 10 号线换 2 号线，约 25 分钟' },
      { from: '外滩', to: '苏州河', distance: 3, transport: 'walk', cost: '步行约 35 分钟，或打车 10 分钟' }
    ]
  },
  guilin: {
    name: '桂林 · 山水甲天下',
    duration: '4天',
    desc: '漓江 → 遇龙河 → 十里画廊',
    spots: [
      { name: '漓江', day: 1, time: '08:00', note: '兴坪段最有层次，早上雾是加分项' },
      { name: '遇龙河', day: 2, time: '09:00', note: '上午骑行，下午坐筏，同一条河两种速度' },
      { name: '十里画廊', day: 3, time: '15:00', note: '租一辆车慢慢骑，不要跟团赶点' }
    ],
    segments: [
      { from: '漓江', to: '遇龙河', distance: 20, transport: 'taxi', cost: '打车约 35 分钟' },
      { from: '遇龙河', to: '十里画廊', distance: 12, transport: 'bike', cost: '骑车约 25 分钟，沿岸田园风光' }
    ]
  },
  sanya: {
    name: '三亚 · 海岛慢时光',
    duration: '4天',
    desc: '亚龙湾 → 海棠湾 → 西岛',
    spots: [
      { name: '亚龙湾', day: 1, time: '09:00', note: '早上九点前最适合下水，沙细水清' },
      { name: '海棠湾', day: 2, time: '10:00', note: '酒店密，公共沙滩能走到安静的一段' },
      { name: '西岛', day: 3, time: '09:00', note: '想看更干净的水，安排半天不必住下' }
    ],
    segments: [
      { from: '亚龙湾', to: '海棠湾', distance: 22, transport: 'taxi', cost: '打车约 35 分钟' },
      { from: '海棠湾', to: '西岛', distance: 30, transport: 'taxi', cost: '打车约 45 分钟，西岛船票另算' }
    ]
  },
  kyoto: {
    name: '京都 · 千年古都',
    duration: '2天',
    desc: '伏见稻荷 → 岚山 → 鸭川',
    spots: [
      { name: '伏见稻荷', day: 1, time: '06:30', note: '开门就去，千本鸟居上午九点后失层次' },
      { name: '岚山', day: 1, time: '14:00', note: '竹林很短，把时间留给河边和寺院' },
      { name: '鸭川', day: 1, time: '18:00', note: '日落前后坐岸边，比再赶一个景点值' }
    ],
    segments: [
      { from: '伏见稻荷', to: '岚山', distance: 18, transport: 'subway', cost: 'JR 奈良线换山阴本线，约 40 分钟' },
      { from: '岚山', to: '鸭川', distance: 10, transport: 'subway', cost: 'JR 山阴本线直达，约 25 分钟' }
    ]
  },
  iceland: {
    name: '冰岛 · 南岸环岛',
    duration: '3天',
    desc: '塞里雅兰瀑布 → 黑沙滩 → 冰川潟湖',
    spots: [
      { name: '塞里雅兰瀑布', day: 1, time: '10:00', note: '可以走到瀑布后面，风大穿雨衣' },
      { name: '黑沙滩', day: 1, time: '16:00', note: '浪很危险，站在湿沙之外拍照' },
      { name: '冰川潟湖', day: 2, time: '11:00', note: '蓝冰在阴天更明显，留足停留时间' }
    ],
    segments: [
      { from: '塞里雅兰瀑布', to: '黑沙滩', distance: 50, transport: 'drive', cost: '自驾约 1 小时 15 分钟，沿 1 号公路' },
      { from: '黑沙滩', to: '冰川潟湖', distance: 240, transport: 'drive', cost: '自驾约 3 小时 15 分钟，不要天黑后开' }
    ]
  },
  chengdu: {
    name: '成都 · 休闲慢游',
    duration: '2天',
    desc: '人民公园 → 玉林 → 火锅',
    spots: [
      { name: '人民公园', day: 1, time: '10:00', note: '鹤鸣茶社点一碗茶，把手机放下半小时' },
      { name: '玉林', day: 1, time: '17:00', note: '小酒馆和晚饭比宽窄更有生活气' },
      { name: '火锅', day: 1, time: '19:30', note: '选牛油还是清油比选择哪家网红更重要' }
    ],
    segments: [
      { from: '人民公园', to: '玉林', distance: 5, transport: 'subway', cost: '地铁 2 号线直达，约 20 分钟' },
      { from: '玉林', to: '火锅', distance: 3, transport: 'walk', cost: '步行约 35 分钟，玉林本地火锅店很多' }
    ]
  },
  sanya_extra: null,
  xiamen: {
    name: '厦门 · 海上花园',
    duration: '3天',
    desc: '鼓浪屿 → 八市 → 环岛路',
    spots: [
      { name: '鼓浪屿', day: 1, time: '08:30', note: '避开团体到达的中午，早上或傍晚更合适' },
      { name: '八市', day: 2, time: '07:30', note: '早点来，沙茶面和海鲜都还新鲜' },
      { name: '环岛路', day: 2, time: '16:00', note: '下午骑行或走路，看海看到天色变暖' }
    ],
    segments: [
      { from: '鼓浪屿', to: '八市', distance: 3, transport: 'boat', cost: '渡轮回本岛后打车，约 20 分钟' },
      { from: '八市', to: '环岛路', distance: 8, transport: 'taxi', cost: '打车约 25 分钟，也可骑行' }
    ]
  },
  bali: {
    name: '巴厘岛 · 梯田与海',
    duration: '5天',
    desc: '德格拉朗梯田 → 海神庙 → 乌布',
    spots: [
      { name: '德格拉朗梯田', day: 1, time: '09:00', note: '早上去，中午的光会把绿意照平' },
      { name: '海神庙', day: 2, time: '17:00', note: '退潮才能走近，先查潮汐再出发' },
      { name: '乌布', day: 3, time: '10:00', note: '市场看一眼就好，真正的时间在周边小路' }
    ],
    segments: [
      { from: '德格拉朗梯田', to: '海神庙', distance: 35, transport: 'taxi', cost: '打车约 1 小时，巴厘岛交通普遍拥堵' },
      { from: '海神庙', to: '乌布', distance: 22, transport: 'taxi', cost: '打车约 45 分钟' }
    ]
  },
  qinhuangdao: {
    name: '秦皇岛 · 海边两天',
    duration: '2天',
    desc: '老龙头 → 鸽子窝 → 北戴河',
    spots: [
      { name: '老龙头', day: 1, time: '09:00', note: '长城碰到海的地方，晴天最清楚' },
      { name: '鸽子窝', day: 2, time: '05:30', note: '日出比白天值得，风大就加一件外套' },
      { name: '北戴河', day: 2, time: '10:00', note: '沿着海岸走一段，比赶多个公园从容' }
    ],
    segments: [
      { from: '老龙头', to: '鸽子窝', distance: 28, transport: 'taxi', cost: '打车约 40 分钟' },
      { from: '鸽子窝', to: '北戴河', distance: 8, transport: 'taxi', cost: '打车约 20 分钟' }
    ]
  },
  dunhuang: {
    name: '敦煌 · 丝路明珠',
    duration: '3天',
    desc: '鸣沙山月牙泉 → 莫高窟 → 沙洲夜市',
    spots: [
      { name: '鸣沙山月牙泉', day: 1, time: '17:00', note: '中午太热不进沙漠，下午 5 点后进去' },
      { name: '莫高窟', day: 2, time: '09:00', note: '按预约时间进宫，迟到票会作废' },
      { name: '沙洲夜市', day: 2, time: '19:30', note: '驴肉黄面和杏皮水是标配' }
    ],
    segments: [
      { from: '鸣沙山月牙泉', to: '莫高窟', distance: 25, transport: 'taxi', cost: '打车约 35 分钟' },
      { from: '莫高窟', to: '沙洲夜市', distance: 18, transport: 'taxi', cost: '打车约 30 分钟' }
    ]
  },
  qingdao: {
    name: '青岛 · 红瓦绿树',
    duration: '2天',
    desc: '栈桥 → 八大关 → 啤酒博物馆',
    spots: [
      { name: '栈桥', day: 1, time: '09:00', note: '免费地标，清晨或傍晚去，冬天有海鸥' },
      { name: '八大关', day: 2, time: '09:30', note: '免费街区，梧桐银杏季节最美' },
      { name: '啤酒博物馆', day: 2, time: '14:00', note: '60 元含两杯鲜啤，原浆只有当天的好喝' }
    ],
    segments: [
      { from: '栈桥', to: '八大关', distance: 5, transport: 'taxi', cost: '打车约 20 分钟' },
      { from: '八大关', to: '啤酒博物馆', distance: 6, transport: 'taxi', cost: '打车约 25 分钟' }
    ]
  },
  changsha: {
    name: '长沙 · 夜生活之都',
    duration: '2天',
    desc: '橘子洲 → 岳麓山 → 超级文和友',
    spots: [
      { name: '橘子洲', day: 1, time: '09:00', note: '步行往返两小时，小火车 20 元省力' },
      { name: '岳麓山', day: 1, time: '14:00', note: '免费，东门进南门出正好下山到湖大' },
      { name: '超级文和友', day: 2, time: '16:00', note: '不吃饭也能进去逛拍，早点去少排队' }
    ],
    segments: [
      { from: '橘子洲', to: '岳麓山', distance: 6, transport: 'subway', cost: '地铁 2 号线直达，约 25 分钟' },
      { from: '岳麓山', to: '超级文和友', distance: 8, transport: 'subway', cost: '地铁 2 号线直达，约 30 分钟' }
    ]
  },
  suzhou: {
    name: '苏州 · 园林慢戏',
    duration: '2天',
    desc: '拙政园 → 平江路 → 虎丘',
    spots: [
      { name: '拙政园', day: 1, time: '07:30', note: '开园即入，先走中部水景，团队九点后到' },
      { name: '平江路', day: 1, time: '11:00', note: '早上去最安静，沿河小巷比主街值得走' },
      { name: '虎丘', day: 2, time: '16:00', note: '傍晚的光线最好，斜塔与剑池半天足够' }
    ],
    segments: [
      { from: '拙政园', to: '平江路', distance: 2, transport: 'walk', cost: '步行约 25 分钟' },
      { from: '平江路', to: '虎丘', distance: 6, transport: 'taxi', cost: '打车约 20 分钟' }
    ]
  },
  lhasa: {
    name: '拉萨 · 圣城三日',
    duration: '3天',
    desc: '布达拉宫 → 大昭寺 → 八廓街',
    spots: [
      { name: '八廓街', day: 1, time: '09:00', note: '第一天只适应，顺时针随人流走' },
      { name: '布达拉宫', day: 2, time: '09:00', note: '按预约时间进宫，台阶多别急' },
      { name: '大昭寺', day: 3, time: '15:00', note: '下午金顶光线最好，殿内不许拍照' }
    ],
    segments: [
      { from: '八廓街', to: '布达拉宫', distance: 2, transport: 'walk', cost: '步行约 25 分钟，或打车 10 分钟' },
      { from: '布达拉宫', to: '大昭寺', distance: 1, transport: 'walk', cost: '步行约 20 分钟，八廓街转经道可达' }
    ]
  }
}

/** 交通方式图标映射（统一为字形图标，避免 emoji 风格不一致） */
const TRANSPORT_ICON = {
  walk: { icon: '步', label: '步行', color: '#3c7a57' },
  taxi: { icon: '车', label: '打车', color: '#a8813f' },
  subway: { icon: '铁', label: '地铁', color: '#3f6b78' },
  bus: { icon: '公', label: '公交', color: '#4f6b58' },
  bike: { icon: '骑', label: '骑车', color: '#3f6b78' },
  drive: { icon: '驾', label: '自驾', color: '#244b3c' },
  boat: { icon: '船', label: '乘船', color: '#3f6b78' }
}

function getRoute(destId) {
  const r = routes[destId]
  if (!r) return null
  return Object.assign({}, r, { id: destId })
}

function allRoutes() {
  return Object.keys(routes)
    .filter(function (k) { return routes[k] })
    .map(function (k) { return Object.assign({}, routes[k], { id: k }) })
}

function transportInfo(type) {
  return TRANSPORT_ICON[type] || { icon: '📍', label: '到达', color: '#666' }
}

module.exports = {
  routes: routes,
  getRoute: getRoute,
  allRoutes: allRoutes,
  transportInfo: transportInfo,
  TRANSPORT_ICON: TRANSPORT_ICON
}
