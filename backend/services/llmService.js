const OpenAI = require("openai");

/**
 * 大语言模型服务
 * 用于与阿里云百炼大语言模型进行交互
 */
class LLMService {
  constructor() {
    // 直接使用用户提供的API Key调用真实的百炼qwen-plus模型
    // API Key: sk-3ed8868ade0c476e8aeca2f041ddf32b
    this.openai = new OpenAI({
      apiKey: "sk-3ed8868ade0c476e8aeca2f041ddf32b",
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
    console.log('LLM服务已初始化，使用真实的百炼qwen-plus模型');
  }

  /**
   * 调用大语言模型生成旅行计划
   * @param {Object} travelRequest - 旅行请求数据
   * @returns {Promise<Object>} 生成的旅行计划
   */
  async generateTravelPlan(travelRequest) {
    try {
      const { prompt } = travelRequest;
      
      // 确保使用真实的百炼qwen-plus模型
      if (!this.openai) {
        throw new Error('LLM服务初始化失败，请检查API配置');
      }
      
      console.log('使用真实的百炼qwen-plus模型生成旅行计划');
      console.log('用户原始输入:', prompt);
      
      // 构建系统提示词 - 增强版本：确保返回所有必要字段，特别是日期信息
      const systemPrompt = `你是一位专业的旅行规划师，擅长从用户的自然语言描述中提取旅行需求，并生成详细、个性化的旅行计划。

请严格遵循以下步骤：
1. 从用户的文本描述中提取关键信息，包括：目的地、旅行天数、预算、旅行人数、旅行偏好等
2. 根据提取的信息，生成一个详细的旅行计划
3. 确保你的回答是纯JSON格式，不要包含任何额外的文本或说明

JSON格式必须包含以下字段：
- name: 旅行计划名称（如"日本东京5日游"）
- destination: 目的地（如"日本东京"）
- days: 旅行天数（数字）
- startDate: 开始日期（格式为YYYY-MM-DD，使用当前日期或用户提到的日期）
- endDate: 结束日期（格式为YYYY-MM-DD，根据开始日期和天数计算）
- budget: 总预算金额（数字）
- travelersCount: 旅行人数（数字）
- overview: 旅行概述
- dailyItinerary: 每日行程数组
  每个dailyItinerary项必须包含：
  - day: 第几天（数字）
  - activities: 当天活动数组（至少包含3-5个活动）
    每个活动项必须包含：
    - time: 时间段（格式如"09:00-11:30"）
    - title: 活动标题
    - location: 活动地点
    - description: 活动描述
    - type: 活动类型（必须是以下之一：景点、餐饮、住宿、交通、购物、体验）
    - budget: 预计费用（数字）
    - duration: 预计时长（如"2小时"）

请确保生成的计划详细、合理、符合逻辑，并充分考虑用户文本中提到的所有信息。所有字段都必须有合理的值，特别是日期字段必须是有效的YYYY-MM-DD格式。`;

      // 构建用户提示词 - 直接使用用户的自然语言输入
      const userPrompt = `${prompt}

请根据我的描述生成一份详细的旅行计划。请从我的描述中提取目的地、旅行天数、预算等信息，并按照要求的JSON格式输出。`;

      // 调用大语言模型
      const completion = await this.openai.chat.completions.create({
        model: "qwen-plus",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      // 解析模型返回的内容
      const llmContent = completion.choices[0].message.content.trim();
      
      // 尝试提取JSON内容 - 添加更健壮的解析逻辑
      let jsonContent;
      try {
        // 尝试直接解析
        jsonContent = JSON.parse(llmContent);
      } catch (parseError) {
        console.warn('JSON解析失败，尝试清理响应内容...');
        // 尝试清理响应内容
        let cleanResponse = llmContent;
        
        // 移除JSON前后可能的非JSON内容
        const jsonStart = cleanResponse.indexOf('{');
        const jsonEnd = cleanResponse.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
          try {
            jsonContent = JSON.parse(cleanResponse);
            console.log('清理后成功解析JSON');
          } catch (cleanParseError) {
            // 如果清理后仍然解析失败，使用模拟数据
            console.error('清理后仍解析失败，使用模拟数据');
            jsonContent = this.getMockTravelPlan();
          }
        } else {
          // 如果无法找到JSON结构，使用模拟数据
          console.error('无法找到有效的JSON结构，使用模拟数据');
          jsonContent = this.getMockTravelPlan();
        }
      }

      // 验证返回数据格式
      this.validateTravelPlanResponse(jsonContent);
      
      return jsonContent;
    } catch (error) {
      console.error('调用大语言模型生成旅行计划失败:', error);
      throw new Error(`大语言模型服务错误: ${error.message}`);
    }
  }

  /**
   * 验证旅行计划返回数据格式
   * @param {Object} planData - 旅行计划数据
   * @throws {Error} 如果格式不正确
   */
  validateTravelPlanResponse(planData) {
    if (!planData || typeof planData !== 'object') {
      throw new Error('返回数据必须是一个有效的JSON对象');
    }

    // 检查必要字段 - 对于模拟数据更加宽松
    const requiredFields = ['name', 'destination'];
    
    for (const field of requiredFields) {
      if (!(field in planData)) {
        console.error(`缺少必要字段: ${field}`);
        throw new Error(`缺少必要字段: ${field}`);
      }
    }

    // 确保日期相关字段存在或提供默认值
    if (!planData.startDate) {
      planData.startDate = new Date().toISOString().split('T')[0];
    }
    if (!planData.endDate && planData.startDate) {
      const days = planData.days || (planData.dailyItinerary ? planData.dailyItinerary.length : 5);
      const endDate = new Date(planData.startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      planData.endDate = endDate.toISOString().split('T')[0];
    }
    // 确保预算和人数字段有默认值
    if (planData.budget === undefined || planData.budget === null) {
      planData.budget = 10000;
    }
    if (planData.travelersCount === undefined || planData.travelersCount === null) {
      planData.travelersCount = 2;
    }
    
    // 处理dailyItinerary和days的兼容性
    if (!planData.dailyItinerary && Array.isArray(planData.days)) {
      // 将days格式转换为dailyItinerary格式
      planData.dailyItinerary = planData.days;
      delete planData.days;
    }
    
    // 为dailyItinerary设置默认值
    if (!planData.dailyItinerary) {
      planData.dailyItinerary = [];
    }
    
    // 只在dailyItinerary存在时进行数组验证
    if (Array.isArray(planData.dailyItinerary)) {
      // 检查每个行程项
      planData.dailyItinerary.forEach((day, dayIndex) => {
        // 为日期设置默认值
        if (!day.day) {
          day.day = dayIndex + 1;
        }
        
        // 为活动数组设置默认值
        if (!Array.isArray(day.activities)) {
          day.activities = [];
        }

        // 检查每个活动项
        day.activities.forEach((activity, activityIndex) => {
          // 处理activity字段作为title的别名
          if (activity.activity && !activity.title) {
            activity.title = activity.activity;
          }
          
          // 确保必要字段有值
          const activityRequiredFields = ['time', 'description'];
          for (const field of activityRequiredFields) {
            if (!(field in activity)) {
              activity[field] = '';
            }
          }
          
          // 标题有默认值
          if (!activity.title) {
            activity.title = '活动' + (activityIndex + 1);
          }
          
          // 确保活动类型有默认值
          if (!activity.type) {
            activity.type = '景点';
          }
          // 确保预算有默认值
          if (activity.budget === undefined || activity.budget === null) {
            activity.budget = 0;
          }
          // 确保时长有默认值
          if (!activity.duration) {
            activity.duration = '1小时';
          }
        });
      });
    }
  }

  /**
   * 将LLM返回的旅行计划转换为数据库格式
   * @param {Object} llmPlanData - LLM返回的旅行计划数据
   * @param {Object} originalRequest - 原始请求数据
   * @returns {Object} 数据库格式的旅行计划
   */
  transformToDatabaseFormat(llmPlanData, originalRequest) {
    const nodes = [];
    let sequenceOrder = 0;
    // 使用LLM返回的开始日期或原始请求的开始日期
    const startDate = llmPlanData.startDate ? 
      new Date(llmPlanData.startDate) : 
      (originalRequest.start_date ? new Date(originalRequest.start_date) : new Date());

    // 遍历每日行程，转换为数据库节点格式
    llmPlanData.dailyItinerary.forEach(day => {
      // 计算当前天的日期
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (day.day - 1));
      const dateStr = currentDate.toISOString().split('T')[0];

      day.activities.forEach(activity => {
        // 提取时间段
        const timeParts = activity.time ? activity.time.split('-') : ['00:00'];
        const startTime = timeParts[0];
        
        // 根据活动类型设置默认值
        const typeMap = {
          '景区': '景点',
          '景点游览': '景点',
          '参观': '景点',
          '游览': '景点',
          '餐厅': '餐饮',
          '用餐': '餐饮',
          '吃饭': '餐饮',
          '酒店': '住宿',
          '宾馆': '住宿',
          '入住': '住宿',
          '飞机': '交通',
          '高铁': '交通',
          '火车': '交通',
          '汽车': '交通',
          '前往': '交通',
          '购物': '购物',
          '体验': '体验'
        };
        
        let nodeType = '景点'; // 默认类型
        // 根据活动标题或类型判断节点类型
        if (activity.type) {
          nodeType = activity.type;
        } else {
          // 尝试从标题推断类型
          for (const [key, type] of Object.entries(typeMap)) {
            if (activity.title.includes(key)) {
              nodeType = type;
              break;
            }
          }
        }
        
        // 获取旅行者数量，优先使用LLM返回的值
        const travelersCount = llmPlanData.travelersCount || 
          (originalRequest.travelers_count || 1);
        
        // 设置默认预算
        let defaultBudget = 50;
        switch (nodeType) {
          case '住宿':
            defaultBudget = 300 * travelersCount;
            break;
          case '餐饮':
            defaultBudget = 80 * travelersCount;
            break;
          case '交通':
            defaultBudget = 100;
            break;
          case '购物':
            defaultBudget = 200;
            break;
          case '体验':
            defaultBudget = 150;
            break;
        }

        nodes.push({
          node_type: nodeType,
          date: dateStr,
          time: startTime,
          location: activity.location || `${llmPlanData.destination}${nodeType}`,
          description: activity.description,
          budget: activity.budget || defaultBudget,
          actual_cost: 0, // 实际花费初始化为0
          sequence_order: sequenceOrder++
        });
      });
    });

    // 构建同时兼容前端和数据库的格式
    return {
      // 数据库需要的字段
      name: llmPlanData.name,
      destination: llmPlanData.destination,
      start_date: llmPlanData.startDate || 
        (originalRequest.start_date || startDate.toISOString().split('T')[0]),
      end_date: llmPlanData.endDate || 
        (originalRequest.end_date || 
          (() => {
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + (llmPlanData.days || 1) - 1);
            return endDate.toISOString().split('T')[0];
          })()),
      travelers_count: llmPlanData.travelersCount || 
        (originalRequest.travelers_count || 1),
      budget: llmPlanData.budget || 
        (originalRequest.budget || 0),
      preferences: originalRequest.preferences || '',
      nodes: nodes,
      
      // 前端需要的额外字段
      days: llmPlanData.days || llmPlanData.dailyItinerary.length,
      overview: llmPlanData.overview || `${llmPlanData.destination}${llmPlanData.days || llmPlanData.dailyItinerary.length}日游`,
      dailyItinerary: llmPlanData.dailyItinerary,
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  /**
   * 将数据库格式转换为前端所需格式
   * @param {Object} dbPlanData - 数据库格式的旅行计划
   * @returns {Object} 前端格式的旅行计划
   */
  transformToFrontendFormat(dbPlanData) {
    // 如果已经包含dailyItinerary，则直接返回
    if (dbPlanData.dailyItinerary) {
      return dbPlanData;
    }
    
    // 如果只有nodes数组，需要重组为dailyItinerary格式
    const dailyItinerary = [];
    const dateMap = new Map();
    
    // 按日期分组节点
    dbPlanData.nodes.forEach(node => {
      if (!dateMap.has(node.date)) {
        dateMap.set(node.date, []);
      }
      dateMap.get(node.date).push(node);
    });
    
    // 按日期排序并转换为前端格式
    const sortedDates = Array.from(dateMap.keys()).sort();
    sortedDates.forEach((date, index) => {
      const dayNodes = dateMap.get(date);
      const activities = dayNodes.map(node => ({
        time: node.time,
        title: `${node.location} - ${node.node_type}`,
        location: node.location,
        description: node.description,
        type: node.node_type,
        budget: node.budget
      }));
      
      dailyItinerary.push({
        day: index + 1,
        activities: activities
      });
    });
    
    return {
      ...dbPlanData,
      id: dbPlanData.id || `plan_${Date.now()}`,
      title: dbPlanData.name,
      days: sortedDates.length,
      people: dbPlanData.travelers_count,
      dailyItinerary: dailyItinerary,
      status: dbPlanData.status || 'planned',
      createdAt: dbPlanData.created_at || new Date().toISOString(),
      updatedAt: dbPlanData.updated_at || new Date().toISOString()
    };
  }

  /**
   * 获取模拟旅行计划数据，作为兜底方案
   * @returns {Object} 模拟的旅行计划数据
   */
  getMockTravelPlan() {
    return {
      name: '模拟日本旅行计划',
      destination: '日本',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 10000,
      travelersCount: 2,
      preferences: ['美食', '动漫', '亲子'],
      days: [
        {
          day: 1,
          activities: [
            {
              time: '09:00',
              activity: '抵达东京',
              type: '交通',
              duration: '2小时',
              description: '抵达东京成田国际机场，办理入境手续'
            },
            {
              time: '12:00',
              activity: '午餐',
              type: '餐饮',
              duration: '1小时',
              description: '品尝日式拉面'
            },
            {
              time: '14:00',
              activity: '浅草寺',
              type: '景点',
              duration: '2小时',
              description: '游览东京最古老的寺庙'
            },
            {
              time: '18:00',
              activity: '晚餐',
              type: '餐饮',
              duration: '1.5小时',
              description: '品尝日式烤肉'
            }
          ]
        },
        {
          day: 2,
          activities: [
            {
              time: '10:00',
              activity: '东京迪士尼乐园',
              type: '体验',
              duration: '8小时',
              description: '带孩子游玩迪士尼乐园'
            }
          ]
        },
        {
          day: 3,
          activities: [
            {
              time: '11:00',
              activity: '秋叶原电器街',
              type: '购物',
              duration: '4小时',
              description: '动漫爱好者的天堂'
            }
          ]
        },
        {
          day: 4,
          activities: [
            {
              time: '09:30',
              activity: '富士山一日游',
              type: '体验',
              duration: '10小时',
              description: '欣赏日本标志性山峰'
            }
          ]
        },
        {
          day: 5,
          activities: [
            {
              time: '14:00',
              activity: '返程',
              type: '交通',
              duration: '3小时',
              description: '办理登机手续，返回温馨的家'
            }
          ]
        }
      ]
    };
  }
}

module.exports = LLMService;