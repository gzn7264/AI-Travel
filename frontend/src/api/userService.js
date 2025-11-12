// 模拟API延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 用户服务
export default {
  // 用户登录
  async login(credentials) {
    try {
      // 模拟API调用延迟
      await delay(800);
      
      // 模拟登录逻辑
      if (!credentials.username || !credentials.password) {
        throw new Error('用户名和密码不能为空');
      }
      
      // 模拟登录成功返回的数据
      const userInfo = {
        id: 'user_001',
        name: credentials.username || '游客' + Math.floor(Math.random() * 1000),
        email: credentials.email || 'user@example.com',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        createdAt: new Date().toISOString()
      };
      
      const token = 'mock_token_' + Date.now();
      
      return {
        success: true,
        data: {
          user: userInfo,
          token: token
        },
        message: '登录成功'
      };
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        error: error.message || '登录失败，请稍后重试'
      };
    }
  },
  
  // 用户注册
  async register(userData) {
    try {
      // 模拟API调用延迟
      await delay(1000);
      
      // 模拟表单验证
      if (!userData.username || userData.username.length < 3) {
        throw new Error('用户名至少需要3个字符');
      }
      
      if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        throw new Error('请输入有效的邮箱地址');
      }
      
      if (!userData.password || userData.password.length < 6) {
        throw new Error('密码至少需要6个字符');
      }
      
      if (userData.password !== userData.confirmPassword) {
        throw new Error('两次输入的密码不一致');
      }
      
      return {
        success: true,
        message: '注册成功，请登录'
      };
    } catch (error) {
      console.error('注册失败:', error);
      return {
        success: false,
        error: error.message || '注册失败，请稍后重试'
      };
    }
  },
  
  // 获取用户信息
  async getUserInfo() {
    try {
      // 模拟API调用延迟
      await delay(600);
      
      // 从本地存储获取用户信息
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) {
        throw new Error('未登录或登录已过期');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      return {
        success: true,
        data: userInfo
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: error.message || '获取用户信息失败'
      };
    }
  },
  
  // 更新用户信息
  async updateUserInfo(updatedInfo) {
    try {
      // 模拟API调用延迟
      await delay(800);
      
      // 模拟数据验证
      if (updatedInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedInfo.email)) {
        throw new Error('请输入有效的邮箱地址');
      }
      
      // 从本地存储获取现有用户信息
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) {
        throw new Error('未登录或登录已过期');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      const newUserInfo = { ...userInfo, ...updatedInfo };
      
      // 更新本地存储
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
      
      return {
        success: true,
        data: newUserInfo,
        message: '个人信息更新成功'
      };
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return {
        success: false,
        error: error.message || '更新失败，请稍后重试'
      };
    }
  },
  
  // 修改密码
  async changePassword(passwordData) {
    try {
      // 模拟API调用延迟
      await delay(1000);
      
      // 模拟数据验证
      if (!passwordData.currentPassword) {
        throw new Error('请输入当前密码');
      }
      
      if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
        throw new Error('新密码至少需要6个字符');
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('两次输入的新密码不一致');
      }
      
      return {
        success: true,
        message: '密码修改成功，请重新登录'
      };
    } catch (error) {
      console.error('修改密码失败:', error);
      return {
        success: false,
        error: error.message || '修改失败，请检查当前密码是否正确'
      };
    }
  },
  
  // 上传头像
  async uploadAvatar(formData) {
    try {
      // 模拟API调用延迟
      await delay(1500);
      
      // 模拟上传成功，返回模拟的头像URL
      const mockAvatarUrl = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png?imageMogr2/format/webp/quality/80';
      
      // 更新本地存储中的用户头像
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        userInfo.avatar = mockAvatarUrl;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }
      
      return {
        success: true,
        data: {
          avatarUrl: mockAvatarUrl
        },
        message: '头像上传成功'
      };
    } catch (error) {
      console.error('上传头像失败:', error);
      return {
        success: false,
        error: '上传失败，请稍后重试'
      };
    }
  },
  
  // 绑定手机号
  async bindPhone(phoneData) {
    try {
      // 模拟API调用延迟
      await delay(800);
      
      // 模拟手机号验证
      if (!phoneData.phone || !/^1[3-9]\d{9}$/.test(phoneData.phone)) {
        throw new Error('请输入有效的手机号');
      }
      
      if (!phoneData.code || phoneData.code.length !== 6) {
        throw new Error('请输入6位验证码');
      }
      
      // 更新本地存储中的用户手机号
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        userInfo.phone = phoneData.phone;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }
      
      return {
        success: true,
        message: '手机号绑定成功'
      };
    } catch (error) {
      console.error('绑定手机号失败:', error);
      return {
        success: false,
        error: error.message || '绑定失败，请稍后重试'
      };
    }
  },
  
  // 获取验证码
  async getVerificationCode(phone) {
    try {
      // 模拟API调用延迟
      await delay(500);
      
      // 模拟手机号验证
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        throw new Error('请输入有效的手机号');
      }
      
      // 模拟生成验证码（实际应用中应该由后端生成）
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log(`验证码: ${mockCode} (仅用于开发环境测试)`);
      
      return {
        success: true,
        message: '验证码已发送（在控制台查看验证码）'
      };
    } catch (error) {
      console.error('获取验证码失败:', error);
      return {
        success: false,
        error: error.message || '获取验证码失败'
      };
    }
  },
  
  // 获取用户旅行统计
  async getUserTravelStats() {
    try {
      // 模拟API调用延迟
      await delay(600);
      
      // 模拟旅行统计数据
      const mockStats = {
        totalTrips: 12,
        totalDays: 45,
        visitedCities: ['北京', '上海', '广州', '深圳', '杭州', '成都'],
        favoriteDestinations: ['北京', '上海', '成都'],
        totalExpense: 68500,
        tripsByYear: {
          '2023': 8,
          '2024': 4
        },
        tripTypes: {
          '休闲度假': 6,
          '文化体验': 3,
          '美食之旅': 2,
          '户外探险': 1
        }
      };
      
      return {
        success: true,
        data: mockStats
      };
    } catch (error) {
      console.error('获取旅行统计失败:', error);
      return {
        success: false,
        error: '获取统计数据失败，请稍后重试'
      };
    }
  },
  
  // 注销账号
  async deleteAccount() {
    try {
      // 模拟API调用延迟
      await delay(1200);
      
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('travelPlans');
      
      return {
        success: true,
        message: '账号注销成功'
      };
    } catch (error) {
      console.error('注销账号失败:', error);
      return {
        success: false,
        error: '注销失败，请稍后重试'
      };
    }
  }
};