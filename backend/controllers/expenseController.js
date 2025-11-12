const expenseService = require('../services/expenseService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/errorHandler');
const { body, validationResult } = require('express-validator');

/**
 * 费用管理控制器
 */
class ExpenseController {
  /**
   * 更新节点费用验证规则
   */
  getUpdateExpenseValidators() {
    return [
      body('expense').isNumeric().withMessage('费用必须是数字'),
      body('notes').optional().isString().withMessage('备注必须是字符串')
    ];
  }

  /**
   * 更新旅行节点费用
   */
  async updateNodeExpense(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const userId = req.user.user_id;
      const nodeId = req.params.nodeId;
      
      const result = await expenseService.updateNodeExpense(userId, nodeId, req.body);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '更新节点费用成功', result.data);
    } catch (error) {
      console.error('更新节点费用控制器错误:', error);
      return errorResponse(res, '更新节点费用失败', 500);
    }
  }

  /**
   * 批量更新旅行节点费用
   */
  async batchUpdateExpenses(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const userId = req.user.user_id;
      const planId = req.params.planId;
      
      // 验证费用数据数组
      if (!Array.isArray(req.body)) {
        return validationErrorResponse(res, [{ msg: '请求体必须是费用数据数组' }]);
      }
      
      const result = await expenseService.batchUpdateExpenses(userId, planId, req.body);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, result.message, result.data);
    } catch (error) {
      console.error('批量更新费用控制器错误:', error);
      return errorResponse(res, '批量更新费用失败', 500);
    }
  }

  /**
   * 从语音识别结果中提取费用信息
   */
  async extractExpenseFromAudio(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const { audioText } = req.body;
      
      const result = await expenseService.extractExpenseFromAudio(audioText);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '提取费用信息成功', result.data);
    } catch (error) {
      console.error('提取费用信息控制器错误:', error);
      return errorResponse(res, '提取费用信息失败', 500);
    }
  }

  /**
   * 获取旅行计划的费用统计
   */
  async getPlanExpenseStats(req, res) {
    try {
      const userId = req.user.user_id;
      const planId = req.params.planId;
      
      const result = await expenseService.getPlanExpenseStats(userId, planId);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '获取费用统计成功', result.data);
    } catch (error) {
      console.error('获取费用统计控制器错误:', error);
      return errorResponse(res, '获取费用统计失败', 500);
    }
  }
}

module.exports = new ExpenseController();