import axiosInstance from './axiosInstance';

// 旅行计划服务
export default {
  // 生成旅行计划
  async generatePlan(travelRequest) {
    try {
      // 发送请求到后端API生成旅行计划
      const response = await axiosInstance.post('/travel-plans/generate', travelRequest);
      return response;
    } catch (error) {
      console.error('生成旅行计划失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '生成计划失败，请稍后重试'
      };
    }
  },
  
  // 生成模拟的旅行计划
  generateMockPlan(request) {
    const today = new Date();
    const startDate = request.startDate || today.toISOString().split('T')[0];
    const days = request.days || 3;
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    
    // 模拟不同目的地的景点和活动
    const destinationsData = {
      '北京': {
        attractions: ['故宫', '长城', '天安门广场', '颐和园', '天坛', '王府井', '后海'],
        food: ['北京烤鸭', '炸酱面', '老北京铜锅涮肉', '豆汁儿', '冰糖葫芦', '卤煮火烧']
      },
      '上海': {
        attractions: ['外滩', '东方明珠', '迪士尼乐园', '豫园', '南京路步行街', '田子坊', '上海博物馆'],
        food: ['小笼包', '生煎包', '上海本帮菜', '南翔馒头', '蟹粉狮子头', '红烧肉']
      },
      '广州': {
        attractions: ['广州塔', '陈家祠', '白云山', '越秀公园', '沙面', '上下九步行街', '长隆欢乐世界'],
        food: ['早茶', '广州肠粉', '烧腊', '煲仔饭', '粤式炖汤', '虾饺']
      },
      '深圳': {
        attractions: ['世界之窗', '东部华侨城', '深圳湾公园', '华侨城创意文化园', '大梅沙', '仙湖植物园'],
        food: ['椰子鸡', '潮汕牛肉火锅', '沙井生蚝', '虾饺', '早茶', '烧腊']
      },
      '杭州': {
        attractions: ['西湖', '灵隐寺', '雷峰塔', '千岛湖', '西溪湿地', '宋城', '龙井村'],
        food: ['西湖醋鱼', '东坡肉', '叫花鸡', '龙井虾仁', '杭州小笼包', '葱包桧']
      },
      '成都': {
        attractions: ['大熊猫繁育研究基地', '宽窄巷子', '锦里', '都江堰', '青城山', '武侯祠', '春熙路'],
        food: ['火锅', '串串香', '川菜', '担担面', '龙抄手', '三大炮']
      },
      '重庆': {
        attractions: ['洪崖洞', '解放碑', '长江索道', '磁器口古镇', '武隆天坑', '仙女山', '鹅岭二厂'],
        food: ['重庆火锅', '酸辣粉', '小面', '重庆江湖菜', '烤鱼', '山城小汤圆']
      },
      '西安': {
        attractions: ['兵马俑', '大雁塔', '城墙', '回民街', '华清宫', '陕西历史博物馆', '钟鼓楼'],
        food: ['肉夹馍', '凉皮', '羊肉泡馍', 'biangbiang面', '油泼面', '贾三灌汤包']
      }
    };
    
    const destination = request.destination;
    const destData = destinationsData[destination] || destinationsData['北京'];
    
    // 生成每日行程
    const dailyItinerary = [];
    for (let i = 1; i <= days; i++) {
      const activities = this.generateDailyActivities(i, days, destData, destination);
      dailyItinerary.push({
        day: i,
        activities: activities
      });
    }
    
    return {
      id: 'plan_' + Date.now(),
      title: `${destination}${days}日游`,
      destination: destination,
      startDate: startDate,
      endDate: endDate.toISOString().split('T')[0],
      days: days,
      people: request.people || 2,
      budget: request.budget || days * 1500,
      status: 'planned',
      overview: `${destination}经典景点游览，共${days}天行程，适合${request.people || 2}人，预算约${request.budget || days * 1500}元`,
      dailyItinerary: dailyItinerary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
  
  // 生成每日活动
  generateDailyActivities(day, totalDays, destData, destination) {
    const { attractions, food } = destData;
    const morningActivities = [];
    const afternoonActivities = [];
    const eveningActivities = [];
    
    // 为每天分配景点，避免重复
    const assignedAttractions = new Set();
    const totalAttractionsNeeded = Math.min(attractions.length, totalDays * 2);
    
    // 计算当前天应该分配的景点
    for (let i = 0; i < Math.min(2, attractions.length - ((day - 1) * 2)); i++) {
      const attractionIndex = (day - 1) * 2 + i;
      if (attractionIndex < attractions.length) {
        assignedAttractions.add(attractions[attractionIndex]);
      }
    }
    
    // 生成早上活动
    morningActivities.push({
      time: '09:00-11:30',
      title: Array.from(assignedAttractions)[0] || attractions[0],
      description: `参观${destination}著名景点${Array.from(assignedAttractions)[0] || attractions[0]}`
    });
    
    // 生成下午活动
    afternoonActivities.push({
      time: '13:30-16:00',
      title: Array.from(assignedAttractions)[1] || attractions[1],
      description: `游览${destination}著名景点${Array.from(assignedAttractions)[1] || attractions[1]}`
    });
    
    // 生成晚上活动
    const randomFood = food[Math.floor(Math.random() * food.length)];
    eveningActivities.push({
      time: '18:00-20:00',
      title: `品尝${randomFood}`,
      description: `体验${destination}当地特色美食${randomFood}`
    });
    
    // 根据天数调整活动安排
    if (day === 1) {
      return [
        { time: '09:00-10:00', title: '抵达目的地', description: '入住酒店，稍作休息' },
        ...morningActivities.slice(0, 1),
        ...afternoonActivities,
        ...eveningActivities
      ];
    } else if (day === totalDays) {
      return [
        ...morningActivities,
        { time: '16:00-18:00', title: '返程准备', description: '整理行李，准备返程' },
        ...eveningActivities.slice(0, 1)
      ];
    }
    
    // 中间天数的活动
    return [...morningActivities, ...afternoonActivities, ...eveningActivities];
  },
  
  // 获取旅行计划列表
  async getPlanList(filters = {}) {
    try {
      // 模拟API调用延迟
      await delay(800);
      
      // 从本地存储获取计划列表
      let storedPlans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
      
      // 如果没有数据，使用模拟数据初始化
      if (storedPlans.length === 0) {
        storedPlans = this.getMockTravelPlans();
        localStorage.setItem('travelPlans', JSON.stringify(storedPlans));
      }
      
      // 应用筛选条件
      let filteredPlans = [...storedPlans];
      
      if (filters.destination) {
        filteredPlans = filteredPlans.filter(plan => 
          plan.destination.toLowerCase().includes(filters.destination.toLowerCase())
        );
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredPlans = filteredPlans.filter(plan => new Date(plan.startDate) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredPlans = filteredPlans.filter(plan => new Date(plan.endDate) <= endDate);
      }
      
      if (filters.status) {
        filteredPlans = filteredPlans.filter(plan => plan.status === filters.status);
      }
      
      // 按创建时间倒序排序
      filteredPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return {
        success: true,
        data: filteredPlans,
        total: filteredPlans.length
      };
    } catch (error) {
      console.error('获取旅行计划列表失败:', error);
      return {
        success: false,
        error: '获取计划列表失败，请稍后重试'
      };
    }
  },
  
  // 获取模拟旅行计划数据
  getMockTravelPlans() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return [
      {
        id: 'plan_001',
        title: '北京三日游',
        destination: '北京',
        startDate: nextWeek.toISOString().split('T')[0],
        endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days: 3,
        people: 2,
        budget: 5000,
        status: 'planned',
        overview: '故宫、长城、天安门、颐和园等经典景点游览',
        dailyItinerary: [
          {
            day: 1,
            activities: [
              { time: '09:00-12:00', title: '故宫博物院', description: '参观紫禁城，了解中国历史' },
              { time: '12:00-13:30', title: '午餐', description: '品尝北京烤鸭' },
              { time: '14:00-17:00', title: '天安门广场', description: '参观纪念碑和天安门城楼' },
              { time: '18:00-20:00', title: '晚餐', description: '王府井小吃街' }
            ]
          },
          {
            day: 2,
            activities: [
              { time: '08:00-15:00', title: '八达岭长城', description: '登长城，感受雄伟壮观' },
              { time: '16:00-18:00', title: '明十三陵', description: '参观明朝皇帝陵墓' }
            ]
          },
          {
            day: 3,
            activities: [
              { time: '09:00-12:00', title: '颐和园', description: '游览皇家园林' },
              { time: '13:00-16:00', title: '圆明园', description: '参观历史遗址' },
              { time: '16:30-18:30', title: '后海酒吧街', description: '休闲放松，体验北京夜生活' }
            ]
          }
        ],
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      },
      {
        id: 'plan_002',
        title: '上海周末游',
        destination: '上海',
        startDate: tomorrow.toISOString().split('T')[0],
        endDate: new Date(tomorrow.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days: 2,
        people: 3,
        budget: 3000,
        status: 'planned',
        overview: '上海迪士尼乐园一日游，第二天市区观光',
        dailyItinerary: [
          {
            day: 1,
            activities: [
              { time: '08:00-21:00', title: '上海迪士尼乐园', description: '全天游览迪士尼乐园' }
            ]
          },
          {
            day: 2,
            activities: [
              { time: '10:00-12:00', title: '外滩', description: '观赏黄浦江两岸风光' },
              { time: '12:00-14:00', title: '午餐', description: '南京路步行街品尝美食' },
              { time: '14:00-17:00', title: '上海博物馆', description: '参观中国古代艺术' }
            ]
          }
        ],
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'plan_003',
        title: '杭州西湖一日游',
        destination: '杭州',
        startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days: 1,
        people: 2,
        budget: 1500,
        status: 'planned',
        overview: '西湖十景，断桥残雪，雷峰塔等景点游览',
        dailyItinerary: [
          {
            day: 1,
            activities: [
              { time: '09:00-11:00', title: '断桥残雪', description: '西湖著名景点' },
              { time: '11:00-13:00', title: '白堤漫步', description: '观赏西湖风光' },
              { time: '13:00-14:30', title: '午餐', description: '楼外楼品尝杭帮菜' },
              { time: '15:00-17:00', title: '雷峰塔', description: '登高远眺西湖全景' },
              { time: '17:00-19:00', title: '西湖夜游', description: '欣赏西湖夜景' }
            ]
          }
        ],
        createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  },
  
  // 获取旅行计划详情
  async getPlanDetail(planId) {
    try {
      // 发送请求到后端API获取旅行计划详情
      const response = await axiosInstance.get(`/travel-plans/${planId}`);
      return response;
    } catch (error) {
      console.error('获取旅行计划详情失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '获取计划详情失败，请稍后重试'
      };
    }
  },
  
  // 更新旅行计划
  async updatePlan(planId, updatedData) {
    try {
      // 发送请求到后端API更新旅行计划
      const response = await axiosInstance.put(`/travel-plans/${planId}`, updatedData);
      return response;
    } catch (error) {
      console.error('更新旅行计划失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '更新计划失败，请稍后重试'
      };
    }
  },
  
  // 删除旅行计划
  async deletePlan(planId) {
    try {
      // 模拟API调用延迟
      await delay(600);
      
      // 从本地存储获取计划列表
      const storedPlans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
      const planIndex = storedPlans.findIndex(p => p.id === planId);
      
      if (planIndex === -1) {
        throw new Error('未找到该旅行计划');
      }
      
      // 删除计划
      storedPlans.splice(planIndex, 1);
      
      // 保存到本地存储
      localStorage.setItem('travelPlans', JSON.stringify(storedPlans));
      
      return {
        success: true,
        message: '旅行计划删除成功'
      };
    } catch (error) {
      console.error('删除旅行计划失败:', error);
      return {
        success: false,
        error: error.message || '删除计划失败，请稍后重试'
      };
    }
  },
  
  // 分享旅行计划
  async sharePlan(planId) {
    try {
      // 模拟API调用延迟
      await delay(500);
      
      // 生成分享链接
      const shareUrl = `https://aitravel.example.com/share/${planId}`;
      
      // 复制到剪贴板（仅在浏览器环境中可用）
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          console.log('分享链接已复制到剪贴板');
        } catch (err) {
          console.warn('复制到剪贴板失败:', err);
        }
      }
      
      return {
        success: true,
        data: {
          shareUrl: shareUrl
        },
        message: '旅行计划分享链接已生成'
      };
    } catch (error) {
      console.error('分享旅行计划失败:', error);
      return {
        success: false,
        error: '分享计划失败，请稍后重试'
      };
    }
  },
  
  // 保存旅行计划
  async savePlan(planData) {
    try {
      // 模拟API调用延迟
      await delay(700);
      
      // 从本地存储获取计划列表
      const storedPlans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
      
      // 检查是否已存在
      const existingIndex = storedPlans.findIndex(p => p.id === planData.id);
      
      if (existingIndex !== -1) {
        // 更新现有计划
        storedPlans[existingIndex] = {
          ...storedPlans[existingIndex],
          ...planData,
          updatedAt: new Date().toISOString()
        };
      } else {
        // 添加新计划
        const newPlan = {
          ...planData,
          id: 'plan_' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        storedPlans.unshift(newPlan);
      }
      
      // 保存到本地存储
      localStorage.setItem('travelPlans', JSON.stringify(storedPlans));
      
      return {
        success: true,
        message: '旅行计划保存成功'
      };
    } catch (error) {
      console.error('保存旅行计划失败:', error);
      return {
        success: false,
        error: '保存计划失败，请稍后重试'
      };
    }
  },
  
  // 获取热门目的地推荐
  async getRecommendedDestinations() {
    try {
      // 发送请求到后端API获取热门目的地推荐
      const response = await axiosInstance.get('/travel-plans/recommended-destinations');
      return response;
    } catch (error) {
      console.error('获取推荐目的地失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || '获取推荐失败，请稍后重试'
      };
    }
  }
};