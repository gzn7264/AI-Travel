const OpenAI = require("openai");

/**
 * 大语言模型服务
 * 用于与阿里云百炼大语言模型进行交互
 */
class LLMService {
  constructor() {
    // 检查是否有API密钥
    if (process.env.DASHSCOPE_API_KEY) {
      // 初始化OpenAI客户端，连接阿里云百炼
      this.openai = new OpenAI({
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      });
      console.log('LLM服务已初始化');
    } else {
      // 在没有API密钥的情况下，创建一个模拟的客户端
      this.openai = null;
      console.warn('LLM服务：未找到DASHSCOPE_API_KEY，将使用模拟模式');
    }
  }

  /**
   * 调用大语言模型生成旅行计划
   * @param {Object} travelRequest - 旅行请求数据
   * @returns {Promise<Object>} 生成的旅行计划
   */
  async generateTravelPlan(travelRequest) {
    try {
      const { destination, start_date, end_date, budget, travelers_count, preferences } = travelRequest;
      
      // 如果没有初始化openai客户端，返回模拟回复
      if (!this.openai) {
        console.warn('使用模拟模式回复旅行计划请求');
        // 创建模拟的旅行计划数据
        const start = new Date(start_date);
        const end = new Date(end_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        const mockPlan = {
          name: `${destination}${days}日游`,
          destination: destination,
          days: days,
          overview: `${destination}${days}日游行程安排`,
          dailyItinerary: []
        };
        
        // 生成每日模拟行程
        for (let i = 1; i <= days; i++) {
          mockPlan.dailyItinerary.push({
            day: i,
            activities: [
              {
                time: "09:00-12:00",
                title: `${destination}主要景点游览`,
                location: destination,
                description: `在${destination}的第${i}天，游览主要景点。`,
                type: "景点",
                budget: Math.floor(budget / days * 0.4)
              },
              {
                time: "12:00-14:00",
                title: "午餐",
                location: destination,
                description: `当地特色美食体验。`,
                type: "餐饮",
                budget: Math.floor(budget / days * 0.2)
              },
              {
                time: "14:00-17:00",
                title: `${destination}文化体验`,
                location: destination,
                description: `体验${destination}的当地文化。`,
                type: "景点",
                budget: Math.floor(budget / days * 0.3)
              },
              {
                time: "19:00-22:00",
                title: "晚餐与休息",
                location: destination,
                description: `晚餐后回酒店休息。`,
                type: "住宿",
                budget: Math.floor(budget / days * 0.1)
              }
            ]
          });
        }
        
        return mockPlan;
      }
      
      // 构建系统提示词
      const systemPrompt = `你是一位专业的旅行规划师，擅长根据用户需求生成详细、个性化的旅行计划。
      请基于用户提供的信息，为其生成一个结构化的旅行计划。
      请确保你的回答是纯JSON格式，不要包含任何额外的文本或说明。
      JSON格式应包含以下字段：
      - name: 旅行计划名称
      - destination: 目的地
      - days: 旅行天数
      - overview: 旅行概述
      - dailyItinerary: 每日行程数组
        每个dailyItinerary项应包含：
        - day: 第几天
        - activities: 当天活动数组
          每个活动项应包含：
          - time: 时间段（格式如"09:00-11:30"）
          - title: 活动标题
          - location: 活动地点
          - description: 活动描述
          - type: 活动类型（可选值：景点、餐饮、住宿、交通）
          - budget: 预计费用
      请确保生成的计划详细、合理、符合逻辑，并充分考虑用户提供的所有信息。`;

      // 构建用户提示词
      const userPrompt = `请为我生成一份${destination}的旅行计划，具体信息如下：
      - 目的地：${destination}
      - 开始日期：${start_date}
      - 结束日期：${end_date}
      - 旅行人数：${travelers_count}人
      - 总预算：${budget}元
      - 旅行偏好：${preferences || '无特殊偏好'}
      
      请按照指定的JSON格式输出旅行计划，确保计划详细且实用。`;

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
      
      // 尝试提取JSON内容
      let jsonContent;
      try {
        // 尝试直接解析，如果不是纯JSON，则尝试提取JSON部分
        jsonContent = JSON.parse(llmContent);
      } catch (parseError) {
        // 尝试提取JSON部分
        const jsonMatch = llmContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("无法从模型返回中提取有效的JSON数据");
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

    // 检查必要字段
    const requiredFields = ['name', 'destination', 'dailyItinerary'];
    for (const field of requiredFields) {
      if (!(field in planData)) {
        throw new Error(`缺少必要字段: ${field}`);
      }
    }

    // 检查每日行程
    if (!Array.isArray(planData.dailyItinerary)) {
      throw new Error('dailyItinerary必须是一个数组');
    }

    // 检查每个行程项
    planData.dailyItinerary.forEach((day, dayIndex) => {
      if (!day.day || !Array.isArray(day.activities)) {
        throw new Error(`第${dayIndex + 1}天行程格式不正确`);
      }

      // 检查每个活动项
      day.activities.forEach((activity, activityIndex) => {
        const activityRequiredFields = ['time', 'title', 'description'];
        for (const field of activityRequiredFields) {
          if (!(field in activity)) {
            throw new Error(`第${dayIndex + 1}天第${activityIndex + 1}个活动缺少必要字段: ${field}`);
          }
        }
      });
    });
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
    const startDate = new Date(originalRequest.start_date);

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
          '前往': '交通'
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
        
        // 设置默认预算
        let defaultBudget = 50;
        switch (nodeType) {
          case '住宿':
            defaultBudget = 300 * originalRequest.travelers_count;
            break;
          case '餐饮':
            defaultBudget = 80 * originalRequest.travelers_count;
            break;
          case '交通':
            defaultBudget = 100;
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
      start_date: originalRequest.start_date,
      end_date: originalRequest.end_date,
      travelers_count: originalRequest.travelers_count,
      budget: originalRequest.budget,
      preferences: originalRequest.preferences,
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
}

module.exports = LLMService;