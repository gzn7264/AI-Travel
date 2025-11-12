const authService = require('../services/authService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/errorHandler');
const { body, validationResult } = require('express-validator');

/**
 * 用户认证控制器
 */
class AuthController {
  /**
   * 注册验证规则
   */
  getRegisterValidators() {
    return [
      body('email').isEmail().withMessage('邮箱格式不正确').normalizeEmail(),
      body('password').isLength({ min: 6 }).withMessage('密码长度至少6位'),
      body('nickname').isLength({ min: 2, max: 20 }).withMessage('用户名长度必须在2-20之间')
    ];
  }

  /**
   * 登录验证规则
   */
  getLoginValidators() {
    return [
      body('email').isEmail().withMessage('邮箱格式不正确').normalizeEmail(),
      body('password').notEmpty().withMessage('密码不能为空')
    ];
  }

  /**
   * 用户注册
   */
  async register(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const { email, password, nickname } = req.body;
      
      // 调用服务层注册
      const result = await authService.register(email, password, nickname);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '注册成功', result.data);
    } catch (error) {
      console.error('注册控制器错误:', error);
      return errorResponse(res, '注册失败', 500);
    }
  }

  /**
   * 用户登录
   */
  async login(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const { email, password } = req.body;
      
      // 调用服务层登录
      const result = await authService.login(email, password);
      
      if (!result.success) {
        return errorResponse(res, result.error, 401);
      }
      
      return successResponse(res, '登录成功', result.data);
    } catch (error) {
      console.error('登录控制器错误:', error);
      return errorResponse(res, '登录失败', 500);
    }
  }

  /**
   * 获取当前用户信息
   */
  async getUserInfo(req, res) {
    try {
      const userId = req.user.user_id;
      
      const result = await authService.getUserInfo(userId);
      
      if (!result.success) {
        return errorResponse(res, result.error, 404);
      }
      
      return successResponse(res, '获取用户信息成功', result.data);
    } catch (error) {
      console.error('获取用户信息控制器错误:', error);
      return errorResponse(res, '获取用户信息失败', 500);
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const userId = req.user.user_id;
      const { nickname, avatar_url } = req.body;
      
      const result = await authService.updateUserInfo(userId, { nickname, avatar_url });
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, '更新用户信息成功', result.data);
    } catch (error) {
      console.error('更新用户信息控制器错误:', error);
      return errorResponse(res, '更新用户信息失败', 500);
    }
  }

  /**
   * 修改密码
   */
  async changePassword(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
      }

      const userId = req.user.user_id;
      const { oldPassword, newPassword } = req.body;
      
      const result = await authService.changePassword(userId, oldPassword, newPassword);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, result.message);
    } catch (error) {
      console.error('修改密码控制器错误:', error);
      return errorResponse(res, '修改密码失败', 500);
    }
  }

  /**
   * 用户登出
   */
  async logout(req, res) {
    try {
      const result = await authService.logout();
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, result.message);
    } catch (error) {
      console.error('登出控制器错误:', error);
      return errorResponse(res, '登出失败', 500);
    }
  }

  /**
   * 注销账号
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.user_id;
      
      const result = await authService.deleteAccount(userId);
      
      if (!result.success) {
        return errorResponse(res, result.error, 400);
      }
      
      return successResponse(res, result.message);
    } catch (error) {
      console.error('注销账号控制器错误:', error);
      return errorResponse(res, '注销账号失败', 500);
    }
  }
}

module.exports = new AuthController();