/**
 * 统一的API响应格式
 * @param {Object} res - Express响应对象
 * @param {boolean} success - 请求是否成功
 * @param {string} message - 响应消息
 * @param {Object|null} data - 响应数据
 * @param {string|null} error - 错误信息
 * @param {number} statusCode - HTTP状态码
 */
const sendResponse = (res, success, message, data = null, error = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    error
  });
};

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 成功消息
 * @param {Object|null} data - 响应数据
 * @param {number} statusCode - HTTP状态码
 */
const successResponse = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, true, message, data, null, statusCode);
};

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {string} error - 错误详情
 * @param {number} statusCode - HTTP状态码
 */
const errorResponse = (res, message, error, statusCode = 400) => {
  return sendResponse(res, false, message, null, error, statusCode);
};

/**
 * 400错误 - 请求参数错误
 */
const badRequestResponse = (res, error) => {
  return errorResponse(res, '请求参数错误', error, 400);
};

/**
 * 401错误 - 未授权
 */
const unauthorizedResponse = (res, error = '未授权访问') => {
  return errorResponse(res, '未授权', error, 401);
};

/**
 * 403错误 - 禁止访问
 */
const forbiddenResponse = (res, error = '没有权限执行此操作') => {
  return errorResponse(res, '禁止访问', error, 403);
};

/**
 * 404错误 - 资源不存在
 */
const notFoundResponse = (res, error = '请求的资源不存在') => {
  return errorResponse(res, '资源不存在', error, 404);
};

/**
 * 500错误 - 服务器内部错误
 */
const serverErrorResponse = (res, error = '服务器内部错误') => {
  console.error('服务器错误:', error);
  return errorResponse(res, '服务器错误', error, 500);
};

module.exports = {
  sendResponse,
  successResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse
};