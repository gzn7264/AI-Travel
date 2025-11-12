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
      body('prompt').notEmpty().withMessage('提示词不能为空')
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
   * 生成旅行计划（不保存到数据库）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async generatePlan(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      // 支持多种参数格式以兼容前端调用
      let prompt = req.body.prompt || req.body.text || req.body.travelRequest;
      
      // 如果是完整的对象，尝试从中提取prompt
      if (typeof prompt === 'object') {
        prompt = prompt.prompt || prompt.text || JSON.stringify(prompt);
      }
      
      if (!prompt || prompt.trim() === '') {
        return errorResponse(res, '缺少必要的旅行需求描述', 400);
      }
      
      // 添加路由信息，帮助识别是哪个路径被调用
      console.log('路由路径:', req.path, ' | 完整URL:', req.originalUrl);
      console.log('接收旅行计划生成请求，用户输入:', prompt);

      const result = await travelPlanService.generatePlan({ prompt });
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      // 确保返回的数据包含所有前端需要的字段
      const formattedResult = {
        id: `temp_${Date.now()}`, // 生成临时ID
        title: result.data.name || '旅行计划',
        destination: result.data.destination,
        startDate: result.data.startDate || new Date().toISOString().split('T')[0],
        endDate: result.data.endDate,
        days: result.data.days,
        travelers: result.data.travelersCount || 1,
        budget: result.data.budget || 0,
        overview: result.data.overview,
        dailyItinerary: result.data.dailyItinerary,
        status: 'preview',
        createdAt: new Date().toISOString(),
        // 保留原始结果中的所有字段
        ...result.data
      };
      
      console.log('旅行计划生成成功，返回数据格式已对齐前端');
      
      return successResponse(res, '生成旅行计划成功', formattedResult);
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