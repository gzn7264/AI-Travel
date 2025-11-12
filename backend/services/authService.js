const { supabase, supabaseService, isSimulated: configIsSimulated } = require('../config/supabase');
const { 
  generateToken, 
  verifyToken, 
  parseSupabaseToken,
  extractUserFromSupabaseAuth 
} = require('../utils/jwtUtils');
const bcrypt = require('bcryptjs');

// 模拟模式下的内存存储
let mockUsers = [];
let nextUserId = 1;

// 模拟模式标记 - 使用配置中的模拟模式设置
const isSimulated = configIsSimulated;
console.log('AuthService 模式:', isSimulated ? '模拟模式' : '实际Supabase模式');

// 选择合适的客户端：根据操作类型选择标准客户端或服务角色客户端
const getSupabaseClient = (requiresAdmin = false) => {
  // 对于需要绕过RLS的操作，使用服务角色客户端
  if (!isSimulated && requiresAdmin && supabaseService) {
    return supabaseService;
  }
  // 其他情况使用标准客户端
  return supabase;
};

console.log(`Supabase服务模式: ${isSimulated ? '模拟模式' : '实际连接模式'}`);
if (!isSimulated && supabaseService) {
  console.log('服务角色客户端已启用，可用于绕过RLS的管理操作');
}

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
        }, true);
        
        console.log('模拟模式: 用户注册成功', user.id);
        return {
          success: true,
          data: {
            user: {
              user_id: user.id,
              email: user.email,
              nickname
            },
            token
          }
        };
      }
      
      // 非模拟模式 - 使用Supabase内置auth表
      console.log('开始使用Supabase auth注册用户:', email);
      
      // 使用Supabase内置的auth.signUp方法
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 将用户元数据存储在Supabase auth表中
          data: {
            nickname,
            created_at: new Date().toISOString(),
            role: 'user' // 添加用户角色
          },
          // 设置自动确认邮箱（开发环境）
          emailRedirectTo: 'http://localhost:3000/api/auth/callback'
        }
      });
      
      if (error) {
        console.error('Supabase注册错误:', error);
        // 根据错误类型返回更友好的错误信息
        if (error.code === 'auth/email-already-exists' || error.message.includes('User already registered')) {
          throw new Error('该邮箱已被注册');
        }
        throw new Error('注册失败: ' + error.message);
      }
      
      if (!data.user) {
        throw new Error('注册成功但未返回用户信息');
      }
      
      console.log('Supabase注册成功，用户ID:', data.user.id);
      
      // 尝试使用服务角色客户端自动确认邮箱
      if (supabaseService) {
        try {
          console.log('尝试自动确认邮箱:', data.user.id);
          // 使用服务角色客户端更新用户信息，确认邮箱
          const { error: confirmError } = await supabaseService.auth.admin.updateUserById(data.user.id, {
            email_confirmed_at: new Date().toISOString()
          });
          if (confirmError) {
            console.log('自动确认邮箱失败，但继续处理:', confirmError.message);
          } else {
            console.log('邮箱自动确认成功:', data.user.id);
          }
        } catch (e) {
          console.log('邮箱确认过程出错:', e.message);
        }
      }
      
      // 使用工具函数提取用户信息
      const user = extractUserFromSupabaseAuth({ data });
      
      if (!user) {
        throw new Error('无法提取用户信息');
      }
      
      // 生成与Supabase兼容的JWT令牌
      const token = generateToken({
        user_id: user.user_id,
        email: user.email,
        nickname: user.nickname,
        // 包含Supabase返回的用户元数据
        user_metadata: user.user_metadata
      }, true);
      
      return {
        success: true,
        data: {
          user: {
            user_id: user.user_id,
            email: user.email,
            nickname: user.nickname,
            created_at: user.created_at
          },
          token,
          // 返回Supabase的访问令牌和刷新令牌（如果需要）
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token
        }
      };
    } catch (error) {
      console.error('用户注册失败:', error);
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
        const user = mockUsers.find(u => u.email === email);
        if (!user) {
          throw new Error('邮箱或密码错误');
        }
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error('邮箱或密码错误');
        }
        
        // 生成与Supabase兼容的JWT令牌
        const token = generateToken({
          user_id: user.id,
          email: user.email,
          nickname: user.nickname
        }, true);
        
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
      
      // 非模拟模式 - 使用Supabase内置auth表
      console.log('开始使用Supabase auth登录用户:', email);
      
      // 直接使用标准客户端登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase登录错误:', error);
        // 根据错误类型返回更友好的错误信息
        if (error.code === 'auth/user-not-found' || 
            error.code === 'auth/wrong-password' || 
            error.message.includes('Invalid login credentials')) {
          throw new Error('邮箱或密码错误');
        }
        throw new Error('登录失败: ' + error.message);
      }
      
      if (!data.user) {
        throw new Error('登录成功但未返回用户信息');
      }
      
      console.log('Supabase登录成功，用户ID:', data.user.id);
      
      // 使用工具函数提取用户信息
      const user = extractUserFromSupabaseAuth({ data });
      
      if (!user) {
        throw new Error('无法提取用户信息');
      }
      
      // 生成与Supabase兼容的JWT令牌
      const token = generateToken({
        user_id: user.user_id,
        email: user.email,
        nickname: user.nickname || '',
        // 包含Supabase返回的用户元数据
        user_metadata: user.user_metadata,
        // 包含用户角色信息
        role: user.role || 'user'
      }, true);
      
      return {
        success: true,
        data: {
          user: {
            user_id: user.user_id,
            email: user.email,
            nickname: user.nickname || '',
            created_at: user.created_at,
            role: user.role || 'user'
          },
          token,
          // 返回Supabase的访问令牌和刷新令牌
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      };
    } catch (error) {
      console.error('用户登录失败:', error);
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