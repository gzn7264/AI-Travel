import axiosInstance from './axiosInstance';

// 用户服务
export default {
  // 用户登录
  async login(credentials) {
    try {
      console.log('发送登录请求到后端:', '/auth/login', '请求参数:', credentials);
      
      // 发送登录请求到后端API
      const response = await axiosInstance.post('/auth/login', credentials);
      
      console.log('收到登录响应:', response);
      
      // 保存token和用户信息到本地存储
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token || '');
        localStorage.setItem('userInfo', JSON.stringify(response.data.user || {}));
        // 可选：存储Supabase令牌（如果需要）
        if (response.data.supabase_tokens) {
          localStorage.setItem('supabaseTokens', JSON.stringify(response.data.supabase_tokens));
        }
      }
      
      return response;
    } catch (error) {
      console.error('登录请求异常:', error);
      console.error('异常详情:', { 
        status: error.response?.status, 
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message || '登录失败，请稍后重试',
        status: error.response?.status
      };
    }
  },
  
  // 用户注册
  async register(userData) {
    try {
      console.log('发送注册请求到后端:', '/auth/register', '请求参数:', userData);
      
      // 发送注册请求到后端API
      const response = await axiosInstance.post('/auth/register', userData);
      
      console.log('收到注册响应:', response);
      return response;
    } catch (error) {
      console.error('注册请求异常:', error);
      console.error('异常详情:', { 
        status: error.response?.status, 
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message || '注册失败，请稍后重试',
        status: error.response?.status
      };
    }
  },
  
  // 获取用户信息
  async getUserInfo() {
    try {
      // 发送请求到后端API获取用户信息
      const response = await axiosInstance.get('/auth/user');
      
      // 更新本地存储的用户信息
      if (response.success && response.data) {
        localStorage.setItem('userInfo', JSON.stringify(response.data.user || response.data));
      }
      
      return response;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '获取用户信息失败'
      };
    }
  },
  
  // 更新用户信息
  async updateUserInfo(updatedInfo) {
    try {
      // 发送更新请求到后端API
      const response = await axiosInstance.put('/auth/user', updatedInfo);
      
      // 更新本地存储的用户信息
      if (response.success && response.data) {
        localStorage.setItem('userInfo', JSON.stringify(response.data.user || response.data));
      }
      
      return response;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '更新失败，请稍后重试'
      };
    }
  },
  
  // 修改密码
  async changePassword(passwordData) {
    try {
      // 发送修改密码请求到后端API
      const response = await axiosInstance.post('/auth/change-password', passwordData);
      
      // 如果修改成功，清除本地存储并跳转到登录页
      if (response.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
      }
      
      return response;
    } catch (error) {
      console.error('修改密码失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '修改失败，请检查当前密码是否正确'
      };
    }
  },
  
  // 头像上传、绑定手机号和验证码功能已移除
  
  // 获取用户旅行统计
  async getUserTravelStats() {
    try {
      // 发送请求到后端API获取旅行统计
      const response = await axiosInstance.get('/auth/stats');
      return response;
    } catch (error) {
      console.error('获取旅行统计失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || '获取统计数据失败，请稍后重试'
      };
    }
  },
  
  // 注销账号
  async deleteAccount() {
    try {
      // 发送注销请求到后端API
      const response = await axiosInstance.delete('/auth/account');
      
      // 如果注销成功，清除本地存储
      if (response.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('travelPlans');
      }
      
      return response;
    } catch (error) {
      console.error('注销账号失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || '注销失败，请稍后重试'
      };
    }
  }
};