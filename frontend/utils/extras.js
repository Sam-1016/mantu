/**
 * 补充素材库：景点票价/开放时间/建议时长 + 博主推荐笔记
 *            + 交通站点 + 景点附近美食（配图）。
 * 票价与时间为公开信息整理，仅作行程参考，出行前以官方为准。
 */
module.exports = {
  dali: {
    spotMeta: {
      '才村码头': { ticket: '免费', openTime: '全天开放', suggest: '1–2小时' },
      '喜洲古镇': { ticket: '免费（严家民居 ¥25）', openTime: '全天，民居 8:30–17:30', suggest: '半天' },
      '双廊': { ticket: '免费', openTime: '全天开放', suggest: '半天，日落前后最佳' }
    },
    stations: [
      { name: '大理站', kind: '动车', desc: '昆明方向动车约 2 小时，出站打车进古城约 30 分钟' },
      { name: '大理机场', kind: '机场', desc: '直飞航班少，多在昆明中转；机场大巴到古城约 1 小时' }
    ],
    spotFoods: {
      '才村码头': [{ name: '洱海砂锅鱼', desc: '码头边的白族馆子，鱼现点现杀，汤先喝两碗。', image: '/images/foods/砂锅鱼.jpg' }],
      '喜洲古镇': [{ name: '喜洲破酥粑粑', desc: '现场炭火烙的咸口最香，配一杯普洱茶刚好。', image: '/images/foods/喜洲破酥粑粑.jpg' }],
      '双廊': [{ name: '白族酸辣鱼', desc: '洱海酸辣口，配一份水性杨花汤就是完整的一餐。', image: '/images/foods/白族酸辣鱼.jpg' }]
    },
    xhsNotes: [
      { author: '一颗洱海边的菜', tag: '避雷', title: '环海西路骑行说几句实话', text: '电动车环湖很晒，帽子墨镜防晒三件套缺一不可。才村到喜洲段风大，下午三四点的光是全天最好拍的。' },
      { author: '慢游阿澤', tag: '出片', title: '双廊日落机位整理', text: '玉几岛入口处人最多，往珊瑚礁方向再走十分钟人少很多。日落前四十分钟到位就够，不用去太早。' }
    ]
  },
  kyoto: {
    spotMeta: {
      '伏见稻荷': { ticket: '免费', openTime: '全天开放', suggest: '2–3小时，越早越好' },
      '岚山': { ticket: '竹林免费（天龙寺 ¥500）', openTime: '全天，寺院 8:30–17:00', suggest: '半天' },
      '鸭川': { ticket: '免费', openTime: '全天开放', suggest: '1–2小时，傍晚最佳' }
    },
    stations: [
      { name: 'JR 京都站', kind: '高铁站', desc: '新干线直达，站内就是美食街，进出市区都从这里转' },
      { name: '关西国际机场', kind: '机场', desc: 'Haruka 特急约 75 分钟直达京都站' },
      { name: '四条河原町站', kind: '地铁站', desc: '阪急与地下铁交汇，住宿选这附近最方便' }
    ],
    spotFoods: {
      '伏见稻荷': [{ name: '稻荷寿司', desc: '参道小店的甜豆皮寿司，爬山前垫一口正好。', image: '/images/foods/稻荷寿司.jpg' }],
      '岚山': [{ name: '汤豆腐料理', desc: '寺院边的汤豆腐套餐，清淡但很有京都味道。', image: '/images/foods/汤豆腐料理.jpg' }],
      '鸭川': [{ name: '川床料理', desc: '夏季限定的纳凉床晚餐，记得提前订位。', image: '/images/foods/川床料理.jpg' }]
    },
    xhsNotes: [
      { author: '京都在住小王', tag: '省时', title: '伏见稻荷不排队走法', text: '七点前到千本鸟居基本没人。爬到半山就回头，山顶风景和半山差别不大，省下的时间给锦市场。' },
      { author: '抹茶脑袋', tag: '美食', title: '锦市场只买这三样', text: '豆腐、腌菜、当季和果子。正餐千万别在市场里解决，出来走两条街便宜一半。' }
    ]
  },
  iceland: {
    spotMeta: {
      '塞里雅兰瀑布': { ticket: '免费（停车约 ¥50）', openTime: '全天开放', suggest: '1–1.5小时' },
      '黑沙滩': { ticket: '免费', openTime: '全天开放', suggest: '1小时，远离浪线' },
      '冰川潟湖': { ticket: '免费（游船约 ¥300 起）', openTime: '全天开放', suggest: '2–3小时' }
    },
    stations: [
      { name: '凯夫拉维克机场（KEF）', kind: '机场', desc: '国际航班都到这里，Flybus 到雷克雅未克约 45 分钟' },
      { name: '雷克雅未克', kind: '环岛起点', desc: '从这里取车出发，南岸第一天的驾驶约 3 小时' }
    ],
    spotFoods: {
      '塞里雅兰瀑布': [{ name: '冰岛羊肉汤', desc: 'Selfoss 镇上的热汤，正好驱走瀑布水汽的寒。', image: '/images/foods/冰岛羊肉汤.jpg' }],
      '黑沙滩': [{ name: '维克镇海鲜汤', desc: 'Vik 镇小馆用面包碗装汤，边看海边喝完。', image: '/images/foods/维克镇海鲜汤.jpg' }],
      '冰川潟湖': [{ name: '赫本龙虾餐', desc: 'Höfn 是龙虾小镇，环岛路上最值得停的一餐。', image: '/images/foods/赫本龙虾餐.jpg' }]
    },
    xhsNotes: [
      { author: '北欧老白', tag: '安全', title: '黑沙滩真的不是开玩笑', text: '每年都有人被浪卷倒。站在完全干燥的区域拍，浪速比看起来快得多，别背对海。' },
      { author: '环岛七日的桃', tag: '省钱', title: '冰岛吃饭怎么不破产', text: 'Bonus 超市买三明治当午饭，晚饭再吃餐厅。加油站热狗是环岛路上最便宜的热食。' }
    ]
  },
  chengdu: {
    spotMeta: {
      '人民公园': { ticket: '免费（茶位 ¥15 起）', openTime: '6:00–22:00', suggest: '2–3小时' },
      '玉林': { ticket: '免费', openTime: '全天开放', suggest: '半天，傍晚更有味道' },
      '火锅': { ticket: '人均 ¥80–120', openTime: '多为 11:00–次日 2:00', suggest: '1.5–2小时' }
    },
    stations: [
      { name: '成都东站', kind: '高铁站', desc: '高铁主站，地铁 2/7 号线进城约 20 分钟' },
      { name: '双流 / 天府机场', kind: '机场', desc: '双流离市区近（地铁 10 号线）；天府航班多但远' },
      { name: '天府广场站', kind: '地铁站', desc: '1/2 号线换乘点，住这附近去哪都顺' }
    ],
    spotFoods: {
      '人民公园': [{ name: '钟水饺', desc: '公园出来步行可达，红油的甜辣比例刚好。', image: '/images/foods/钟水饺.jpg' }],
      '玉林': [{ name: '冷锅串串', desc: '玉林小巷里数签签结账，鸭肠和土豆片必拿。', image: '/images/foods/冷锅串串.jpg' }],
      '火锅': [{ name: '牛油火锅', desc: '毛肚鸭肠先下锅，香油碟加蒜泥是本地吃法。', image: '/images/foods/牛油火锅.jpg' }]
    },
    xhsNotes: [
      { author: '成都胃小圆', tag: '美食', title: '火锅点菜避雷清单', text: '脑花、兔腰先问同桌接不接受再点。微辣对外地人已经很够，鸳鸯锅不丢人。' },
      { author: '巷子里晒太阳', tag: '慢游', title: '人民公园的正确打开方式', text: '鹤鸣茶社上午十点后一座难求，想坐树荫位九点前到。掏耳朵可以体验，记得先问价。' }
    ]
  },
  sanya: {
    spotMeta: {
      '亚龙湾': { ticket: '免费', openTime: '全天开放', suggest: '半天，九点前下水' },
      '海棠湾': { ticket: '免费', openTime: '全天开放', suggest: '半天' },
      '西岛': { ticket: '门票+船票约 ¥95', openTime: '8:00–17:30', suggest: '半天' }
    },
    stations: [
      { name: '三亚站', kind: '高铁站', desc: '环岛高铁从海口过来约 2 小时，去亚龙湾有支线' },
      { name: '凤凰机场', kind: '机场', desc: '到市区打车约 30 分钟，旺季建议提前约车' }
    ],
    spotFoods: {
      '亚龙湾': [{ name: '椰子鸡', desc: '三个椰子一只鸡，海鲜吃腻了就来这顿清淡的。', image: '/images/foods/椰子鸡.jpg' }],
      '海棠湾': [{ name: '疍家渔排海鲜', desc: '渔排现捞现做，坐下前先把计价问清楚。', image: '/images/foods/疍家渔排海鲜.jpg' }],
      '西岛': [{ name: '渔家海边烧烤', desc: '下岛前的一顿烧烤，烤鱿鱼和生蚝是招牌。', image: '/images/foods/渔家海边烧烤.jpg' }]
    },
    xhsNotes: [
      { author: '岛民小林', tag: '避雷', title: '三亚海鲜防坑三句', text: '先问称重还是按份、加工费多少、有没有最低消费。问完这三句再坐下，能省一半。' },
      { author: '椰子不加冰', tag: '亲子', title: '带娃别硬排海上项目', text: '亚龙湾沙滩挖沙游泳娃就能玩一天。出海项目风浪大随时取消，别把它排在最后一天。' }
    ]
  },
  beijing: {
    spotMeta: {
      '故宫': { ticket: '¥60（旺季）', openTime: '8:30–17:00，周一闭馆', suggest: '3–4小时，需提前预约' },
      '景山': { ticket: '¥2', openTime: '6:30–21:00', suggest: '40分钟–1小时' },
      '胡同': { ticket: '免费', openTime: '全天开放', suggest: '2–3小时' }
    },
    stations: [
      { name: '北京南站', kind: '高铁站', desc: '京沪/京津高铁主站，地铁 4/14 号线进城' },
      { name: '首都 / 大兴机场', kind: '机场', desc: '首都机场快轨到东直门；大兴机场线到草桥换乘' },
      { name: '前门站', kind: '地铁站', desc: '2 号线，看升旗、进故宫都从这里走' }
    ],
    spotFoods: {
      '故宫': [{ name: '四季民福烤鸭（故宫店）', desc: '景观位正看角楼，饭点必排队，先取号再逛。', image: '/images/foods/四季民福烤鸭（故宫店）.jpg' }],
      '景山': [{ name: '护国寺小吃', desc: '豌豆黄、面茶、驴打滚一次尝全。', image: '/images/foods/护国寺小吃.jpg' }],
      '胡同': [{ name: '铜锅涮肉', desc: '胡同里的炭火铜锅，麻酱调料是灵魂。', image: '/images/foods/铜锅涮肉.jpg' }]
    },
    xhsNotes: [
      { author: '胡同串子大伟', tag: '预约', title: '故宫抢票全流程', text: '提前 7 天晚 8 点放票，定闹钟卡点进。没抢到就刷退票，出发前一天晚上成功率最高。' },
      { author: '北平秋日', tag: '出片', title: '景山万春亭机位', text: '神武门出来直接上万春亭，拍故宫全景要站南侧栏杆。下午顺光，上午拍的是剪影。' }
    ]
  },
  xiamen: {
    spotMeta: {
      '鼓浪屿': { ticket: '上岛免费（船票 ¥35 往返）', openTime: '轮渡 7:10–17:30', suggest: '半天' },
      '八市': { ticket: '免费', openTime: '约 6:00–20:00', suggest: '1–2小时，早上最鲜活' },
      '环岛路': { ticket: '免费', openTime: '全天开放', suggest: '2–3小时，适合骑行' }
    },
    stations: [
      { name: '厦门站', kind: '火车站', desc: '在岛内，离轮渡码头最近，到达首选' },
      { name: '厦门北站', kind: '高铁站', desc: '在岛外，地铁 1 号线进岛约 40 分钟' },
      { name: '高崎机场', kind: '机场', desc: '岛内机场，打车到轮渡码头约 25 分钟' }
    ],
    spotFoods: {
      '鼓浪屿': [{ name: '叶氏麻糍', desc: '龙头路的小摊，现包现卖，排队很快。', image: '/images/foods/叶氏麻糍.jpg' }],
      '八市': [{ name: '沙茶面', desc: '汤头浓，配料自选，本地人的早餐主场。', image: '/images/foods/沙茶面.jpg' }],
      '环岛路': [{ name: '海蛎煎', desc: '黄厝村口的老摊，趁热吃，蘸酱别盖过海蛎味。', image: '/images/foods/海蛎煎.jpg' }]
    },
    xhsNotes: [
      { author: '阿吉仔在厦门', tag: '避雷', title: '鼓浪屿别踩的三个坑', text: '船票买邮轮中心厦鼓码头，别买错码头。岛上网红奶茶又贵又普通，龙头路看看就好别久留。' },
      { author: '早起吃八市', tag: '美食', title: '八市早餐动线', text: '局口街进去先吃沙茶面，再买份满煎糕带走。海鲜加工店中午才去，早上先吃小吃。' }
    ]
  },
  bali: {
    spotMeta: {
      '德格拉朗梯田': { ticket: '约 ¥25', openTime: '6:00–18:00', suggest: '2小时，清晨最佳' },
      '海神庙': { ticket: '约 ¥30', openTime: '7:00–19:00', suggest: '1–2小时，先查潮汐' },
      '乌布': { ticket: '皇宫免费（区域小）', openTime: '8:00–19:00', suggest: '半天' }
    },
    stations: [
      { name: '登巴萨机场（DPS）', kind: '机场', desc: '南部入境，库塔最近；去乌布车程约 1.5 小时' },
      { name: '岛上交通', kind: '包车', desc: '没有轨道交通，按天包车或 Grab 打车，先谈好总价' }
    ],
    spotFoods: {
      '德格拉朗梯田': [{ name: '脏鸭餐', desc: '梯田景观位餐厅，半只鸭够两个人分。', image: '/images/foods/脏鸭餐.jpg' }],
      '海神庙': [{ name: '烤乳猪饭', desc: 'Babi Guling，皮脆肉嫩，配一勺辣参巴。', image: '/images/foods/烤乳猪饭.jpg' }],
      '乌布': [{ name: '印尼炒饭', desc: 'Nasi Goreng 加个煎蛋，是最稳的一餐。', image: '/images/foods/印尼炒饭.jpg' }]
    },
    xhsNotes: [
      { author: '巴厘妮可', tag: '交通', title: '包车防坑指南', text: '按天包车先谈好总价含不含油费停车费，超时一小时多少钱写清楚。临时加景点最容易起争执。' },
      { author: '梯田咖啡馆老板', tag: '出片', title: '德格拉朗几点去', text: '八点前到，光线斜、旅行团没到。秋千拍照要排队，想拍就第一批进。' }
    ]
  },
  shanghai: {
    spotMeta: {
      '武康路': { ticket: '免费', openTime: '全天开放', suggest: '2小时' },
      '外滩': { ticket: '免费', openTime: '全天开放', suggest: '1–2小时，日落最佳' },
      '苏州河': { ticket: '免费', openTime: '全天开放', suggest: '1–2小时，夜晚更舒服' }
    },
    stations: [
      { name: '虹桥站', kind: '高铁站', desc: '高铁与机场一体，地铁 2/10 号线进市区' },
      { name: '浦东机场', kind: '机场', desc: '国际航班为主，磁悬浮或 2 号线进城' },
      { name: '南京东路站', kind: '地铁站', desc: '2/10 号线，去外滩最近的一站' }
    ],
    spotFoods: {
      '武康路': [{ name: '老吉士本帮菜', desc: '红烧肉和草头圈子是招牌，务必先订位。', image: '/images/foods/老吉士本帮菜.jpg' }],
      '外滩': [{ name: '蟹粉小笼', desc: '蟹粉季限定，先开窗、后喝汤。', image: '/images/foods/蟹粉小笼.jpg' }],
      '苏州河': [{ name: '河边早午餐', desc: '昌平路一带咖啡馆密集，适合行程收尾。', image: '/images/foods/河边早午餐.jpg' }]
    },
    xhsNotes: [
      { author: '梧桐区住户', tag: '出片', title: '武康大楼拍照别站路口', text: '最佳机位在对面余庆路口，早上九点前人少。拍完往里走，安福路的咖啡馆比武康路好坐。' },
      { author: '夜走苏州河', tag: '小众', title: '外滩人挤人时的平替', text: '从邮政博物馆沿苏州河走到昌平路，夜景不差外滩，人只有十分之一。' }
    ]
  },
  guilin: {
    spotMeta: {
      '漓江': { ticket: '兴坪段免费（游船另计）', openTime: '全天开放', suggest: '半天，清晨有雾最佳' },
      '遇龙河': { ticket: '竹筏约 ¥160/人', openTime: '8:00–17:00', suggest: '半天–1天' },
      '十里画廊': { ticket: '免费（内部景点单独收费）', openTime: '全天开放', suggest: '半天，骑行' }
    },
    stations: [
      { name: '桂林北站', kind: '高铁站', desc: '高铁主站，公交 100 路到市区约 40 分钟' },
      { name: '两江机场', kind: '机场', desc: '机场大巴到民航大厦约 50 分钟' },
      { name: '阳朔站', kind: '高铁站', desc: '在兴坪方向，下车转中巴到阳朔县城约 40 分钟' }
    ],
    spotFoods: {
      '漓江': [{ name: '阳朔啤酒鱼', desc: '活鱼现做，番茄辣汤特别下饭，辣度先问。', image: '/images/foods/啤酒鱼.jpg' }],
      '遇龙河': [{ name: '竹筒饭', desc: '码头边的竹筒饭，腊肉香混着竹子香。', image: '/images/foods/竹筒饭.jpg' }],
      '十里画廊': [{ name: '田螺酿', desc: '螺肉混猪肉回酿，配冰啤酒刚好。', image: '/images/foods/田螺酿.jpg' }]
    },
    xhsNotes: [
      { author: '阳朔骑车侠', tag: '路线', title: '遇龙河骑行+竹筏一天安排', text: '上午租车骑行十里画廊，下午金龙桥码头坐竹筏。顺序别反，竹筏下午四点后可能停航。' },
      { author: '桂林米粉研究员', tag: '美食', title: '本地人吃粉的门道', text: '先干拌后加汤，卤水自己加。景区门口的店比县城里的贵一倍，味道还打折。' }
    ]
  },
  qinhuangdao: {
    spotMeta: {
      '老龙头': { ticket: '¥50', openTime: '7:30–17:30', suggest: '2–3小时' },
      '鸽子窝': { ticket: '¥25', openTime: '4:30–18:00', suggest: '2小时，日出最佳' },
      '北戴河': { ticket: '免费（部分浴场收费）', openTime: '全天开放', suggest: '半天' }
    },
    stations: [
      { name: '北戴河站', kind: '高铁站', desc: '北京方向动车约 2 小时，离鸽子窝、北戴河最近' },
      { name: '秦皇岛站', kind: '火车站', desc: '市区主站，去老龙头打车约 25 分钟' }
    ],
    spotFoods: {
      '老龙头': [{ name: '山海关浑锅', desc: '酸菜白肉加海鲜一锅端，分量很扎实。', image: '/images/foods/山海浑锅.jpg' }],
      '鸽子窝': [{ name: '鲅鱼饺子', desc: '看日出前的早餐，皮薄馅大，趁热吃。', image: '/images/foods/鲅鱼饺子.jpg' }],
      '北戴河': [{ name: '炭烤生蚝', desc: '夜市按打卖，蒜蓉味最稳，先问单价。', image: '/images/foods/炭烤生蚝.jpg' }]
    },
    xhsNotes: [
      { author: '海边长大的团子', tag: '避雷', title: '秦皇岛吃海鲜别去景区', text: '鸽子窝门口的大排档价格翻倍。回市区找本地人排队的店，先问称重还是按份。' },
      { author: '周末看海计划', tag: '日出', title: '鸽子窝日出全攻略', text: '提前查日出时间，早到二十分钟占位置。九月海边清晨风大，带件外套比带三脚架重要。' }
    ]
  },
  suzhou: {
    spotMeta: {
      '拙政园': { ticket: '旺季 ¥80，淡季 ¥70', openTime: '7:30–17:30，17:00 停止入园', suggest: '1.5–2 小时' },
      '平江路': { ticket: '免费', openTime: '全天开放', suggest: '2–3 小时，早上人最少' },
      '虎丘': { ticket: '¥70', openTime: '7:30–17:30', suggest: '2–3 小时，傍晚光线好' }
    },
    stations: [
      { name: '苏州站', kind: '火车站', desc: '京沪线主站，地铁 4 号线两站到拙政园' },
      { name: '苏州北站', kind: '高铁站', desc: '京沪高铁站，离古城较远，地铁 2 号线进城约 30 分钟' }
    ],
    spotFoods: {
      '拙政园': [{ name: '苏式汤面', desc: '焖肉或爆鱼浇头，汤清面细，早上吃最对。', image: '/images/cover-alley.jpg' }],
      '平江路': [{ name: '桂花糖粥', desc: '沿河小店现煮，甜糯不腻，配一块蟹壳黄刚好。', image: '/images/cover-alley.jpg' }],
      '虎丘': [{ name: '梅花糕', desc: '老式铜模现做，豆沙馅趁热吃。', image: '/images/cover-alley.jpg' }]
    },
    xhsNotes: [
      { author: '园子里的猫', tag: '避雷', title: '园林别九点后才到', text: '拙政园九点后团队游客成批进，中部水景全是人头。开园就进，一个半小时看完出来，正好接平江路的早茶。' },
      { author: '慢游阿澤', tag: '出片', title: '平江路早八点的光', text: '八点前街面几乎没人，逆光拍河面和石桥最好看。评弹馆门口可以站着听，不用买票。' }
    ]
  },
  luoyang: {
    spotMeta: {
      '龙门石窟': { ticket: '¥90（含西山、东山、香山寺、白园）', openTime: '8:00–18:30', suggest: '3–4 小时' },
      '白马寺': { ticket: '¥35', openTime: '7:30–17:30', suggest: '2 小时' },
      '洛邑古城': { ticket: '免费', openTime: '全天，19:00 后亮灯', suggest: '2 小时' }
    },
    stations: [
      { name: '洛阳龙门站', kind: '高铁站', desc: '离龙门石窟最近，打车约 15 分钟；进城地铁 2 号线' },
      { name: '洛阳站', kind: '火车站', desc: '老城方向，打车 10 分钟到十字街' }
    ],
    spotFoods: {
      '龙门石窟': [{ name: '不翻汤', desc: '洛阳传统早点，酸辣开胃，景区外镇上就有。', image: '/images/cover-wall.jpg' }],
      '白马寺': [{ name: '素斋面', desc: '寺院周边斋堂的素面，清淡解乏。', image: '/images/cover-wall.jpg' }],
      '洛邑古城': [{ name: '浆面条', desc: '发酵面汤微酸，本地人配芹菜和辣椒吃。', image: '/images/cover-wall.jpg' }]
    },
    xhsNotes: [
      { author: '中原走读生', tag: '避雷', title: '牡丹花期别临时订房', text: '四月花期洛阳酒店涨价明显，提前两周订。王城公园和隋唐城遗址植物园都能看牡丹，后者人少些。' },
      { author: '石窟打卡记', tag: '路线', title: '龙门建议买含电瓶车的票', text: '西山到东山走路暴晒且远，电瓶车省下的体力刚好留给奉先寺。上午去，卢舍那大佛顺光。' }
    ]
  },
  lhasa: {
    spotMeta: {
      '布达拉宫': { ticket: '旺季 ¥200，淡季 ¥100', openTime: '9:00–16:00，按预约时段进宫', suggest: '2 小时' },
      '大昭寺': { ticket: '¥85', openTime: '9:00–17:30', suggest: '1.5 小时，下午金顶最佳' },
      '八廓街': { ticket: '免费', openTime: '全天开放', suggest: '1–2 小时，清晨转经人多' }
    },
    stations: [
      { name: '拉萨贡嘎机场', kind: '机场', desc: '距市区约 60 公里，机场大巴进城约 1 小时' },
      { name: '拉萨站', kind: '火车站', desc: '青藏铁路终点，打车到八廓街约 20 分钟' }
    ],
    spotFoods: {
      '布达拉宫': [{ name: '藏面配甜茶', desc: '宫外小馆的早午餐，面条偏硬，甜茶按壶续。', image: '/images/cover-peak.jpg' }],
      '大昭寺': [{ name: '光明港琼甜茶馆', desc: '本地人排队的甜茶馆，一杯甜茶坐一下午。', image: '/images/cover-peak.jpg' }],
      '八廓街': [{ name: '牦牛肉藏餐', desc: '玛吉阿米一带的藏餐，第一次少量尝试。', image: '/images/cover-peak.jpg' }]
    },
    xhsNotes: [
      { author: '高原慢走', tag: '避雷', title: '第一天千万别洗澡', text: '高反多在夜里出现，首日不洗头洗澡、不跑跳、不喝酒。多喝甜茶，早点睡，第二天再安排布达拉宫。' },
      { author: '预约小助手', tag: '预约', title: '布达拉宫要提前抢', text: '公众号提前放票，旺季常常秒没。进宫按预约时段，迟到可能不放行，台阶多，走慢点。' }
    ]
  }
}
