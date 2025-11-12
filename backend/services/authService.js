const { supabase, supabaseService, isSimulated } = require('../config/supabase');
const { generateToken } = require('../utils/jwtUtils');
const bcrypt = require('bcryptjs');

// 模拟模式下的内存存储
let mockUsers = [];
let nextUserId = 1;

/**
 * 用户认证服务
 */
class AuthService {
  /**
   * 用户注册
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @param {string} username - 用户名
   */
  async register(email, password, nickname) {
    try {
      // 模拟模式处理
      if (isSimulated) {
        // 检查邮箱是否已存在
        const existingUser = mockUsers.find(user => user.email === email);
        if (existingUser) {
          throw new Error('该邮箱已被注册');
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 创建用户
        const user = {
          id: `user_${nextUserId++}`,
          email,
          password: hashedPassword,
          nickname,
          created_at: new Date().toISOString(),
          user_metadata: {
            nickname
          }
        };
        
        mockUsers.push(user);
        
        // 生成JWT令牌
        const token = generateToken({
          user_id: user.id,
          email: user.email,
          nickname
        });
        
        console.log('模拟模式: 用户注册成功', user.id);
        return {
          success: true,
          data: {
            user: {
              user_id: user.id,
              email: user.email,
              nickname
            }
          }
        };
      }
      
      // 非模拟模式 - 使用Supabase
      // 检查邮箱是否已存在
      const { data: existingUser, error: checkError } = await supabase
        .from('auth.users')
        .select('email')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        throw new Error('该邮箱已被注册');
      }
      
      // 创建用户
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname,
            created_at: new Date().toISOString()
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // 生成JWT令牌
      const token = generateToken({
        user_id: data.user.id,
        email: data.user.email,
        nickname
      });
      
      return {
        success: true,
        data: {
          user: {
            user_id: data.user.id,
            email: data.user.email,
            nickname
          }
        }
      };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 用户登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   */
  async login(email, password) {
    try {
      // 模拟模式处理
      if (isSimulated) {
        // 查找用户
        const user = mockUsers.find(user => user.email === email);
        
        if (!user) {
          throw new Error('邮箱或密码错误');
        }
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error('邮箱或密码错误');
        }
        
        // 生成JWT令牌
        const token = generateToken({
          user_id: user.id,
          email: user.email,
          username: user.username
        });
        
        console.log('模拟模式: 用户登录成功', user.id);
        return {
          success: true,
          data: {
            user: {
              user_id: user.id,
              email: user.email,
              nickname: user.nickname
            },
            token
          }
        };
      }
      
      // 非模拟模式 - 使用Supabase
      // 使用Supabase认证登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new Error('邮箱或密码错误');
      }
      
      // 获取用户详细信息
      const { data: userDetails, error: detailsError } = await supabase
        .from('auth.users')
        .select('id, email, user_metadata')
        .eq('id', data.user.id)
        .single();
      
      if (detailsError) {
        throw detailsError;
      }
      
      // 生成JWT令牌
      const token = generateToken({
        user_id: data.user.id,
        email: data.user.email,
        username: userDetails.user_metadata?.username || '用户'
      });
      
      return {
        success: true,
        data: {
          user: {
            user_id: data.user.id,
            email: data.user.email,
            nickname: userDetails.user_metadata?.nickname || '用户'
          },
          token
        }
      };
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   */
  async getUserInfo(userId) {
    try {
      // 模拟模式处理
      if (isSimulated) {
        const user = mockUsers.find(user => user.id === userId || user.id.toString() === userId.toString());
        
        if (!user) {
          console.log('用户不存在:', userId, '现有用户:', mockUsers.map(u => u.id));
          throw new Error('用户不存在');
        }
        
        console.log('模拟模式: 获取用户信息', userId);
        return {
          success: true,
          data: {
            user: {
              user_id: user.id,
              email: user.email,
              nickname: user.nickname,
              created_at: user.created_at
            }
          }
        };
      }
      
      // 非模拟模式 - 使用Supabase
      const { data, error } = await supabase
        .from('auth.users')
        .select('id, email, user_metadata, created_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        data: {
          user: {
            user_id: data.id,
            email: data.email,
            nickname: data.user_metadata?.nickname || '用户',
            created_at: data.created_at
          }
        }
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {object} updates - 更新数据
   */
  async updateUserInfo(userId, updates) {
    try {
      // 模拟模式处理
      if (isSimulated) {
        const userIndex = mockUsers.findIndex(user => user.id === userId || user.id.toString() === userId.toString());
        
        if (userIndex === -1) {
          console.log('用户不存在:', userId, '现有用户:', mockUsers.map(u => u.id));
          throw new Error('用户不存在');
        }
        
        // 更新用户信息
        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          ...updates,
          nickname: updates.nickname || mockUsers[userIndex].nickname,
          avatar_url: updates.avatar_url || mockUsers[userIndex].avatar_url,
          user_metadata: {
            ...mockUsers[userIndex].user_metadata,
            ...updates
          }
        };
        
        console.log('模拟模式: 更新用户信息', userId);
        return {
          success: true,
          data: {
            user: {
              user_id: mockUsers[userIndex].id,
              email: mockUsers[userIndex].email,
              nickname: mockUsers[userIndex].nickname
            }
          }
        };
      }
      
      // 非模拟模式 - 使用Supabase
      // 更新用户元数据
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        data: {
          user: {
            user_id: data.user.id,
            email: data.user.email,
            nickname: data.user.user_metadata?.nickname || '用户'
          }
        }
      };
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 修改密码
   * @param {string} userId - 用户ID
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // 模拟模式处理
      if (isSimulated) {
        const userIndex = mockUsers.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
          throw new Error('用户不存在');
        }
        
        // 验证旧密码
        const isPasswordValid = await bcrypt.compare(oldPassword, mockUsers[userIndex].password);
        if (!isPasswordValid) {
          throw new Error('旧密码错误');
        }
        
        // 更新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        mockUsers[userIndex].password = hashedPassword;
        
        console.log('模拟模式: 密码修改成功', userId);
        return { success: true, message: '密码修改成功' };
      }
      
      // 非模拟模式 - 使用Supabase
      // 先验证旧密码（需要登录信息）
      // 这里简化处理，实际应该先验证旧密码
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, message: '密码修改成功' };
    } catch (error) {
      console.error('修改密码失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      // 模拟模式处理
      if (isSimulated) {
        console.log('模拟模式: 用户登出成功');
        // 在模拟模式下，登出只是返回成功，不做实际操作
        return { success: true, message: '登出成功' };
      }
      
      // 非模拟模式 - 使用Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      return { success: true, message: '登出成功' };
    } catch (error) {
      console.error('登出失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 注销账号
   * @param {string} userId - 用户ID
   */
  async deleteAccount(userId) {
    try {
      // 模拟模式处理
      if (isSimulated) {
        const userIndex = mockUsers.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
          throw new Error('用户不存在');
        }
        
        // 从内存中删除用户
        mockUsers.splice(userIndex, 1);
        
        console.log('模拟模式: 账号注销成功', userId);
        return { success: true, message: '账号注销成功' };
      }
      
      // 非模拟模式 - 使用Supabase
      // 使用服务端客户端删除用户
      const { data, error } = await supabaseService.auth.admin.deleteUser(userId);
      
      if (error) {
        throw error;
      }
      
      return { success: true, message: '账号注销成功' };
    } catch (error) {
      console.error('注销账号失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AuthService();