const jwt = require('jsonwebtoken');
require('dotenv').config();

// 获取JWT密钥和过期时间配置
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // Supabase的JWT密钥

/**
 * 生成JWT令牌
 * @param {Object} payload - 要编码的数据
 * @param {boolean} includeSupabaseClaims - 是否包含Supabase兼容的声明
 * @returns {string} - JWT令牌
 */
const generateToken = (payload, includeSupabaseClaims = false) => {
  const tokenPayload = { ...payload };
  
  // 如果需要生成与Supabase兼容的令牌，添加必要的声明
  if (includeSupabaseClaims) {
    // 添加Supabase标准声明
    tokenPayload.role = tokenPayload.role || 'authenticated';
    tokenPayload.iat = Math.floor(Date.now() / 1000);
    
    // 如果提供了Supabase用户ID，添加到声明中
    if (payload.supabase_user_id) {
      tokenPayload.sub = payload.supabase_user_id;
    }
  }
  
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

/**
 * 验证JWT令牌
 * @param {string} token - 要验证的令牌
 * @param {boolean} isSupabaseToken - 是否是Supabase生成的令牌
 * @returns {Object|null} - 解码后的payload，验证失败返回null
 */
const verifyToken = (token, isSupabaseToken = false) => {
  try {
    // 选择正确的密钥进行验证
    const secret = isSupabaseToken && SUPABASE_JWT_SECRET ? SUPABASE_JWT_SECRET : JWT_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Token验证失败:', error.message);
    return null;
  }
};

/**
 * 解析Supabase JWT令牌（不需要验证签名，仅解析内容）
 * @param {string} token - Supabase生成的JWT令牌
 * @returns {Object|null} - 解码后的payload
 */
const parseSupabaseToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('解析Supabase令牌失败:', error.message);
    return null;
  }
};

/**
 * 从请求头中提取令牌
 * @param {Object} req - Express请求对象
 * @returns {string|null} - 提取的令牌，失败返回null
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

/**
 * 从Supabase认证响应中提取用户信息
 * @param {Object} supabaseAuthResponse - Supabase认证响应对象
 * @returns {Object} - 格式化的用户信息
 */
const extractUserFromSupabaseAuth = (supabaseAuthResponse) => {
  if (!supabaseAuthResponse || !supabaseAuthResponse.data || !supabaseAuthResponse.data.user) {
    return null;
  }
  
  const { user, session } = supabaseAuthResponse.data;
  
  return {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'authenticated',
    created_at: user.created_at,
    updated_at: user.updated_at,
    access_token: session?.access_token,
    refresh_token: session?.refresh_token,
    expires_at: session?.expires_at,
    user_metadata: user.user_metadata || {}
  };
};

module.exports = { 
  generateToken, 
  verifyToken, 
  parseSupabaseToken,
  extractTokenFromHeader,
  extractUserFromSupabaseAuth
};