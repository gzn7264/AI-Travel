const { verifyToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const { unauthorizedResponse } = require('../utils/errorHandler');

/**
 * 认证中间件
 * 验证请求头中的JWT令牌
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return unauthorizedResponse(res, '缺少认证令牌');
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return unauthorizedResponse(res, '无效的认证令牌');
    }
    
    // 将用户信息添加到请求对象中
    req.user = decoded;
    next();
  } catch (error) {
    return unauthorizedResponse(res, '认证失败');
  }
};

module.exports = authMiddleware;