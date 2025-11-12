const { supabase } = require('../config/supabase');
const dbService = require('./dbService');

/**
 * 费用管理服务
 */
class ExpenseService {
  /**
   * 更新旅行节点费用
   * @param {string} userId - 用户ID
   * @param {string} nodeId - 节点ID
   * @param {object} expenseData - 费用数据
   */
  async updateNodeExpense(userId, nodeId, expenseData) {
    try {
      // 验证节点是否存在且属于当前用户
      const { data: nodeData, error: nodeError } = await supabase
        .from('travel_nodes')
        .select('plan_id')
        .eq('id', nodeId)
        .single();
      
      if (nodeError || !nodeData) {
        throw new Error('旅行节点不存在');
      }
      
      // 验证计划是否属于当前用户
      const { data: planData, error: planError } = await supabase
        .from('travel_plans')
        .select('id')
        .eq('id', nodeData.plan_id)
        .eq('user_id', userId)
        .single();
      
      if (planError || !planData) {
        throw new Error('无权修改此旅行节点');
      }
      
      // 更新节点费用
      const result = await dbService.update('travel_nodes', {
        id: nodeId
      }, {
        expense: expenseData.expense,
        expense_notes: expenseData.notes
      });
      
      if (result.data.length === 0) {
        throw new Error('更新失败，节点不存在');
      }
      
      return {
        success: true,
        data: result.data[0]
      };
    } catch (error) {
      console.error('更新节点费用失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 批量更新旅行节点费用
   * @param {string} userId - 用户ID
   * @param {string} planId - 计划ID
   * @param {array} expenses - 费用数据数组
   */
  async batchUpdateExpenses(userId, planId, expenses) {
    try {
      // 验证计划是否属于当前用户
      const { data: planData, error: planError } = await supabase
        .from('travel_plans')
        .select('id')
        .eq('id', planId)
        .eq('user_id', userId)
        .single();
      
      if (planError || !planData) {
        throw new Error('无权修改此旅行计划');
      }
      
      // 批量更新
      const updatedNodes = [];
      
      for (const expense of expenses) {
        const result = await this.updateNodeExpense(userId, expense.node_id, {
          expense: expense.expense,
          notes: expense.notes
        });
        
        if (result.success) {
          updatedNodes.push(result.data);
        }
      }
      
      return {
        success: true,
        data: updatedNodes,
        message: `成功更新${updatedNodes.length}个节点的费用`
      };
    } catch (error) {
      console.error('批量更新费用失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 从语音识别结果中提取费用信息
   * @param {string} audioText - 语音识别文本
   */
  async extractExpenseFromAudio(audioText) {
    try {
      // 简单的费用提取逻辑
      // 实际应该使用更复杂的NLP模型
      const expensePatterns = [
        // 匹配类似 "花费了50元"、"消费100块" 的模式
        /(花费|消费|支付|花了)\s*(\d+(?:\.\d+)?)\s*(元|块|块钱)/i,
        // 匹配类似 "50元的午餐"、"100块的门票" 的模式
        /(\d+(?:\.\d+)?)\s*(元|块|块钱)\s*(?:的)?\s*(.*?)(?=的|了|$)/i,
        // 匹配类似 "午餐50元"、"门票100块" 的模式
        /([^\d]+)\s*(\d+(?:\.\d+)?)\s*(元|块|块钱)/i
      ];
      
      let extractedExpenses = [];
      let text = audioText;
      
      // 尝试所有模式
      for (const pattern of expensePatterns) {
        const matches = text.match(pattern);
        if (matches) {
          const amount = parseFloat(matches[2]);
          let category = '';
          let description = '';
          
          // 根据不同的匹配组提取类别和描述
          if (matches.length >= 4) {
            description = matches[3] || '';
          }
          
          // 简单的类别判断
          if (description.includes('餐') || description.includes('饭') || description.includes('吃')) {
            category = '餐饮';
          } else if (description.includes('住') || description.includes('酒店') || description.includes('民宿')) {
            category = '住宿';
          } else if (description.includes('车') || description.includes('交通')) {
            category = '交通';
          } else if (description.includes('票') || description.includes('景点') || description.includes('玩')) {
            category = '景点';
          }
          
          extractedExpenses.push({
            amount,
            category,
            description,
            confidence: 0.8 // 模拟置信度
          });
          
          // 移除已匹配的部分
          text = text.replace(matches[0], '');
        }
      }
      
      // 如果没有提取到费用，返回空数组
      if (extractedExpenses.length === 0) {
        return {
          success: true,
          data: [],
          message: '未从语音中识别到费用信息'
        };
      }
      
      return {
        success: true,
        data: extractedExpenses
      };
    } catch (error) {
      console.error('提取费用信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取旅行计划的费用统计
   * @param {string} userId - 用户ID
   * @param {string} planId - 计划ID
   */
  async getPlanExpenseStats(userId, planId) {
    try {
      // 验证计划是否属于当前用户
      const { data: planData, error: planError } = await supabase
        .from('travel_plans')
        .select('id')
        .eq('id', planId)
        .eq('user_id', userId)
        .single();
      
      if (planError || !planData) {
        throw new Error('旅行计划不存在或无权访问');
      }
      
      // 获取所有节点的费用
      const { data: nodes, error: nodesError } = await supabase
        .from('travel_nodes')
        .select('node_type, expense, budget')
        .eq('plan_id', planId);
      
      if (nodesError) {
        throw nodesError;
      }
      
      // 计算统计数据
      const stats = {
        total_expense: 0,
        total_budget: 0,
        by_type: {},
        over_budget: false
      };
      
      // 按类型统计
      const types = ['餐饮', '景点', '住宿', '交通'];
      types.forEach(type => {
        stats.by_type[type] = {
          expense: 0,
          budget: 0,
          count: 0
        };
      });
      
      // 汇总数据
      nodes.forEach(node => {
        const expense = parseFloat(node.expense) || 0;
        const budget = parseFloat(node.budget) || 0;
        
        stats.total_expense += expense;
        stats.total_budget += budget;
        
        if (stats.by_type[node.node_type]) {
          stats.by_type[node.node_type].expense += expense;
          stats.by_type[node.node_type].budget += budget;
          stats.by_type[node.node_type].count += 1;
        }
      });
      
      // 检查是否超预算
      stats.over_budget = stats.total_expense > stats.total_budget;
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('获取费用统计失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ExpenseService();