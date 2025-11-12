const travelPlanService = require('../services/travelPlanService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/errorHandler');
const { body, validationResult, query } = require('express-validator');

/**
 * 旅行计划控制器
 */
class TravelPlanController {
  /**
   * 生成计划验证规则
   */
  getGeneratePlanValidators() {
    return [
      body('destination').notEmpty().withMessage('目的地不能为空'),
      body('start_date').isISO8601().withMessage('开始日期格式不正确'),
      body('end_date').isISO8601().withMessage('结束日期格式不正确'),
      body('budget').isNumeric().withMessage('预算必须是数字'),
      body('travelers_count').isInt({ min: 1 }).withMessage('旅行人数必须大于0')
    ];
  }

  /**
   * 保存计划验证规则
   */
  getSavePlanValidators() {
    return [
      body('name').notEmpty().withMessage('计划名称不能为空'),
      body('destination').notEmpty().withMessage('目的地不能为空'),
      body('start_date').isISO8601().withMessage('开始日期格式不正确'),
      body('end_date').isISO8601().withMessage('结束日期格式不正确')
    ];
  }

  /**
   * 生成旅行计划
   */
  async generatePlan(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const result = await travelPlanService.generatePlan(req.body);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '生成旅行计划成功', result.data);
    } catch (error) {
      console.error('生成旅行计划控制器错误:', error);
      return errorResponse(res, '生成旅行计划失败', 500);
    }
  }

  /**
   * 保存旅行计划
   */
  async savePlan(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const userId = req.user.user_id;
      const result = await travelPlanService.savePlan(userId, req.body);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '保存旅行计划成功', result.data);
    } catch (error) {
      console.error('保存旅行计划控制器错误:', error);
      return errorResponse(res, '保存旅行计划失败', 500);
    }
  }

  /**
   * 获取旅行计划列表
   */
  async getPlans(req, res) {
    try {
      // 验证分页参数
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      
      const userId = req.user.user_id;
      const result = await travelPlanService.getPlans(userId, { page, pageSize });
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '获取旅行计划列表成功', result.data);
    } catch (error) {
      console.error('获取旅行计划列表控制器错误:', error);
      return errorResponse(res, '获取旅行计划列表失败', 500);
    }
  }

  /**
   * 获取旅行计划详情
   */
  async getPlanDetail(req, res) {
    try {
      const userId = req.user.user_id;
      const planId = req.params.id;
      
      const result = await travelPlanService.getPlanDetail(userId, planId);
      
      if (!result.success) {
        return errorResponse(res, result.error, 404);
      }
      
      return successResponse(res, '获取旅行计划详情成功', result.data);
    } catch (error) {
      console.error('获取旅行计划详情控制器错误:', error);
      return errorResponse(res, '获取旅行计划详情失败', 500);
    }
  }

  /**
   * 更新旅行计划
   */
  async updatePlan(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const userId = req.user.user_id;
      const planId = req.params.id;
      
      const result = await travelPlanService.updatePlan(userId, planId, req.body);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '更新旅行计划成功', result.data);
    } catch (error) {
      console.error('更新旅行计划控制器错误:', error);
      return errorResponse(res, '更新旅行计划失败', 500);
    }
  }

  /**
   * 删除旅行计划
   */
  async deletePlan(req, res) {
    try {
      const userId = req.user.user_id;
      const planId = req.params.id;
      
      const result = await travelPlanService.deletePlan(userId, planId);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, result.message);
    } catch (error) {
      console.error('删除旅行计划控制器错误:', error);
      return errorResponse(res, '删除旅行计划失败', 500);
    }
  }

  /**
   * 获取旅行统计数据
   */
  async getPlanStats(req, res) {
    try {
      const userId = req.user.user_id;
      
      const result = await travelPlanService.getPlanStats(userId);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '获取统计数据成功', result.data);
    } catch (error) {
      console.error('获取统计数据控制器错误:', error);
      return errorResponse(res, '获取统计数据失败', 500);
    }
  }
}

module.exports = new TravelPlanController();