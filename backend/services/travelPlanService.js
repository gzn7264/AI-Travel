const { supabase } = require('../config/supabase');
const dbService = require('./dbService');
const LLMService = require('./llmService');

// 创建LLM服务实例
const llmService = new LLMService();

/**
 * 旅行计划服务
 */
class TravelPlanService {
  /**
   * 生成旅行计划（调用AI服务）
   * @param {object} planData - 计划数据
   * @returns {Promise<Object>} 生成的旅行计划，包含success和data字段
   */
  async generatePlan(planData) {
    try {
      // 验证必要参数
      if (!planData || !planData.prompt || planData.prompt.trim() === '') {
        return {
          success: false,
          error: '缺少必要的旅行需求描述'
        };
      }
      
      console.log('正在调用大语言模型生成旅行计划...');
      console.log('接收到的提示词:', planData.prompt);
      
      // 辅助函数 - 生成临时ID（避免this上下文问题）
      function generateTempId() {
        return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      // 辅助函数 - 映射活动类型
      function mapActivityTypeToNodeType(activityType) {
        const typeMap = {
          '景点': '景点',
          '餐饮': '餐饮',
          '住宿': '住宿',
          '交通': '交通',
          '购物': '购物',
          '体验': '体验'
        };
        return typeMap[activityType] || '景点';
      }
      
      // 辅助函数 - 计算日期
      function calculateDate(startDate, dayOffset) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().split('T')[0];
      }
      
      // 调用LLM服务生成旅行计划
      const llmResult = await llmService.generateTravelPlan({ prompt: planData.prompt });
      
      // 确保返回的数据结构与前端期望一致
      const formattedResult = {
        id: generateTempId(),
        name: llmResult.name || '智能生成旅行计划',
        destination: llmResult.destination || '',
        startDate: llmResult.startDate || new Date().toISOString().split('T')[0],
        endDate: llmResult.endDate || new Date().toISOString().split('T')[0],
        budget: llmResult.budget || 0,
        travelersCount: llmResult.travelersCount || 1,
        preferences: planData.prompt || '',
        nodes: []
      };
      
      // 转换dailyItinerary为nodes格式
      if (llmResult.dailyItinerary && Array.isArray(llmResult.dailyItinerary)) {
        llmResult.dailyItinerary.forEach((day, dayIndex) => {
          if (day.activities && Array.isArray(day.activities)) {
            day.activities.forEach((activity) => {
              const node = {
                id: generateTempId(),
                node_type: mapActivityTypeToNodeType(activity.type || '景点'),
                date: calculateDate(formattedResult.startDate, dayIndex),
                time: activity.time || '',
                location: activity.location || '',
                description: activity.description || '',
                estimatedDuration: activity.duration || '',
                budget: activity.budget || 0,
                expense: 0
              };
              formattedResult.nodes.push(node);
            });
          }
        });
      }
      
      console.log('旅行计划生成成功');
      return { success: true, data: formattedResult };
    } catch (error) {
      console.error('生成旅行计划失败:', error);
      // 返回错误信息，不使用模拟数据，确保使用真实的LLM服务
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 将活动类型映射为节点类型
   * @param {string} activityType - 活动类型
   * @returns {string} 节点类型
   */
  mapActivityTypeToNodeType(activityType) {
    const typeMap = {
      '景点': '景点',
      '餐饮': '餐饮',
      '住宿': '住宿',
      '交通': '交通',
      '购物': '购物',
      '体验': '体验'
    };
    return typeMap[activityType] || '景点';
  }
  
  /**
   * 根据开始日期计算第n天的日期
   * @param {string} startDate - 开始日期
   * @param {number} dayOffset - 天数偏移
   * @returns {string} 计算后的日期
   */
  calculateDate(startDate, dayOffset) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0];
  }

  /**
   * 生成临时ID
   */
  generateTempId() {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * 备用方案：生成模拟旅行计划
   * @param {object} planData - 计划数据
   */
  generateMockPlan(planData) {
    const mockPlan = {
      name: planData.destination + '旅行计划',
      destination: planData.destination,
      start_date: planData.start_date,
      end_date: planData.end_date,
      travelers_count: planData.travelers_count,
      budget: planData.budget,
      preferences: planData.preferences,
      nodes: this.generateMockNodes(planData)
    };
    
    return mockPlan;
  }

  /**
   * 生成模拟节点数据
   */
  generateMockNodes(planData) {
    const startDate = new Date(planData.start_date);
    const endDate = new Date(planData.end_date);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const nodes = [];
    
    // 为每天生成节点
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // 早上
      nodes.push({
        node_type: '景点',
        date: dateStr,
        time: '09:00',
        location: planData.destination + '主要景点',
        description: '游览当地著名景点',
        budget: 50,
        actual_cost: 0,
        sequence_order: i * 4
      });
      
      // 中午
      nodes.push({
        node_type: '餐饮',
        date: dateStr,
        time: '12:00',
        location: planData.destination + '特色餐厅',
        description: '品尝当地美食',
        budget: 80,
        actual_cost: 0,
        sequence_order: i * 4 + 1
      });
      
      // 下午
      nodes.push({
        node_type: '景点',
        date: dateStr,
        time: '14:00',
        location: planData.destination + '文化景点',
        description: '体验当地文化',
        budget: 30,
        actual_cost: 0,
        sequence_order: i * 4 + 2
      });
      
      // 晚上（除了最后一天）
      if (i < days) {
        nodes.push({
          node_type: '住宿',
          date: dateStr,
          time: '19:00',
          location: planData.destination + '酒店',
          description: '入住酒店休息',
          budget: 200,
          actual_cost: 0,
          sequence_order: i * 4 + 3
        });
      }
    }
    
    return nodes;
  }

  /**
   * 保存旅行计划
   * @param {string} userId - 用户ID
   * @param {object} planData - 计划数据
   */
  async savePlan(userId, planData) {
    try {
      // 开启事务
      const { data: planResult, error: planError } = await supabase
        .from('travel_plans')
        .insert({
          user_id: userId,
          name: planData.name,
          destination: planData.destination,
          start_date: planData.start_date,
          end_date: planData.end_date,
          budget: planData.budget,
          travelers_count: planData.travelers_count,
          preferences: planData.preferences,
          is_active: true
        })
        .select()
        .single();
      
      if (planError) {
        throw planError;
      }
      
      // 保存节点
      if (planData.nodes && planData.nodes.length > 0) {
        const nodesWithPlanId = planData.nodes.map(node => ({
          ...node,
          plan_id: planResult.id
        }));
        
        await dbService.bulkCreate('travel_nodes', nodesWithPlanId);
      }
      
      return {
        success: true,
        data: {
          plan_id: planResult.id,
          ...planResult
        }
      };
    } catch (error) {
      console.error('保存旅行计划失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取用户的旅行计划列表
   * @param {string} userId - 用户ID
   * @param {object} pagination - 分页参数
   */
  async getPlans(userId, pagination = { page: 1, pageSize: 10 }) {
    try {
      const { page = 1, pageSize = 10 } = pagination;
      const offset = (page - 1) * pageSize;
      
      const result = await dbService.query('travel_plans', {
        filters: { user_id: userId, is_active: true },
        order: { field: 'created_at', ascending: false },
        limit: pageSize,
        offset: offset
      });
      
      // 获取总数
      const { count } = await supabase
        .from('travel_plans')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true);
      
      return {
        success: true,
        data: {
          plans: result.data,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        }
      };
    } catch (error) {
      console.error('获取旅行计划列表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取旅行计划详情
   * @param {string} userId - 用户ID
   * @param {string} planId - 计划ID
   */
  async getPlanDetail(userId, planId) {
    try {
      // 获取计划基本信息
      const planResult = await dbService.getOne('travel_plans', {
        id: planId,
        user_id: userId,
        is_active: true
      });
      
      if (!planResult.data) {
        throw new Error('旅行计划不存在');
      }
      
      // 获取所有节点
      const nodesResult = await dbService.query('travel_nodes', {
        filters: { plan_id: planId },
        order: { field: 'sequence_order', ascending: true }
      });
      
      const planWithNodes = {
        ...planResult.data,
        nodes: nodesResult.data
      };
      
      // 转换为前端所需格式
      const frontendFormatPlan = llmService.transformToFrontendFormat(planWithNodes);
      
      return {
        success: true,
        data: frontendFormatPlan
      };
    } catch (error) {
      console.error('获取旅行计划详情失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新旅行计划
   * @param {string} userId - 用户ID
   * @param {string} planId - 计划ID
   * @param {object} updates - 更新数据
   */
  async updatePlan(userId, planId, updates) {
    try {
      // 检查计划是否存在且属于当前用户
      const planResult = await dbService.getOne('travel_plans', {
        id: planId,
        user_id: userId
      });
      
      if (!planResult.data) {
        throw new Error('旅行计划不存在或无权修改');
      }
      
      // 更新计划基本信息
      const updateResult = await dbService.update('travel_plans', {
        id: planId,
        user_id: userId
      }, updates);
      
      return {
        success: true,
        data: updateResult.data[0]
      };
    } catch (error) {
      console.error('更新旅行计划失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除旅行计划（软删除）
   * @param {string} userId - 用户ID
   * @param {string} planId - 计划ID
   */
  async deletePlan(userId, planId) {
    try {
      // 软删除
      const result = await dbService.update('travel_plans', {
        id: planId,
        user_id: userId
      }, { is_active: false });
      
      if (result.data.length === 0) {
        throw new Error('旅行计划不存在或无权删除');
      }
      
      return { success: true, message: '旅行计划删除成功' };
    } catch (error) {
      console.error('删除旅行计划失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取用户旅行统计数据
   * @param {string} userId - 用户ID
   */
  async getPlanStats(userId) {
    try {
      // 获取总计划数
      const { count: totalPlans } = await supabase
        .from('travel_plans')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      
      // 获取活跃计划数
      const { count: activePlans } = await supabase
        .from('travel_plans')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true);
      
      // 获取总预算
      const { data: budgetData } = await supabase
        .from('travel_plans')
        .select('budget')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      const totalBudget = budgetData.reduce((sum, plan) => sum + (parseFloat(plan.budget) || 0), 0);
      
      // 获取最常去的目的地
      const { data: destinations } = await supabase
        .from('travel_plans')
        .select('destination, count(*) as count')
        .eq('user_id', userId)
        .eq('is_active', true)
        .group('destination')
        .order('count', { ascending: false })
        .limit(5);
      
      return {
        success: true,
        data: {
          total_plans: totalPlans,
          active_plans: activePlans,
          total_budget: totalBudget,
          favorite_destinations: destinations
        }
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TravelPlanService();