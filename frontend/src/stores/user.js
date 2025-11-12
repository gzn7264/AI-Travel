import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

export const useUserStore = defineStore('user', {
  // 状态
  state: () => ({
    // 用户信息
    userInfo: null,
    // 登录状态
    isLoggedIn: false,
    // 加载状态
    loading: false
  }),
  
  // Getters
  getters: {
    // 获取用户基本信息
    getUserInfo: (state) => state.userInfo,
    // 获取用户名
    getUserName: (state) => state.userInfo?.name || '游客',
    // 获取用户邮箱
    getUserEmail: (state) => state.userInfo?.email || '',
    // 检查是否已登录
    getLoginStatus: (state) => state.isLoggedIn,
    // 检查用户加载状态
    getLoadingStatus: (state) => state.loading
  },
  
  // Actions
  actions: {
    // 初始化用户状态
    async initUserState() {
      try {
        // 从本地存储获取用户信息和token
        const token = localStorage.getItem('token');
        const userInfoStr = localStorage.getItem('userInfo');
        
        if (token && userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            this.userInfo = userInfo;
            this.isLoggedIn = true;
          } catch (e) {
            console.error('解析用户信息失败:', e);
            this.clearUserState();
          }
        }
      } catch (error) {
        console.error('初始化用户状态失败:', error);
        this.clearUserState();
      }
    },
    
    // 用户登录
    async login(credentials) {
      const router = useRouter();
      this.loading = true;
      
      try {
        // 模拟API调用
        // 在实际应用中，这里应该调用真实的登录API
        return new Promise((resolve) => {
          setTimeout(() => {
            // 模拟登录成功返回的数据
            const mockUserInfo = {
              id: 'user_001',
              name: credentials.username || '用户' + Math.floor(Math.random() * 1000),
              email: credentials.email || 'user@example.com',
              avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
              createdAt: new Date().toISOString()
            };
            
            const mockToken = 'mock_token_' + Date.now();
            
            // 保存到本地存储
            localStorage.setItem('token', mockToken);
            localStorage.setItem('userInfo', JSON.stringify(mockUserInfo));
            
            // 更新状态
            this.userInfo = mockUserInfo;
            this.isLoggedIn = true;
            
            ElMessage.success('登录成功');
            
            // 跳转到首页或重定向页
            const redirect = router.currentRoute.value.query.redirect || '/';
            router.push(redirect);
            
            resolve(mockUserInfo);
          }, 1000);
        });
      } catch (error) {
        console.error('登录失败:', error);
        ElMessage.error('登录失败，请检查您的用户名和密码');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 用户注册
    async register(userData) {
      const router = useRouter();
      this.loading = true;
      
      try {
        // 模拟API调用
        return new Promise((resolve) => {
          setTimeout(() => {
            ElMessage.success('注册成功，请登录');
            // 注册成功后跳转到登录页
            router.push('/login');
            resolve(true);
          }, 1000);
        });
      } catch (error) {
        console.error('注册失败:', error);
        ElMessage.error('注册失败，请稍后重试');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 更新用户信息
    async updateUserInfo(updatedInfo) {
      try {
        // 模拟API调用
        return new Promise((resolve) => {
          setTimeout(() => {
            // 更新本地状态
            this.userInfo = { ...this.userInfo, ...updatedInfo };
            
            // 更新本地存储
            localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
            
            ElMessage.success('个人信息更新成功');
            resolve(this.userInfo);
          }, 800);
        });
      } catch (error) {
        console.error('更新用户信息失败:', error);
        ElMessage.error('更新失败，请稍后重试');
        throw error;
      }
    },
    
    // 修改密码
    async changePassword(passwordData) {
      try {
        // 模拟API调用
        return new Promise((resolve) => {
          setTimeout(() => {
            // 密码修改成功后，需要重新登录
            this.logout();
            ElMessage.success('密码修改成功，请重新登录');
            resolve(true);
          }, 1000);
        });
      } catch (error) {
        console.error('修改密码失败:', error);
        ElMessage.error('修改失败，请检查当前密码是否正确');
        throw error;
      }
    },
    
    // 用户退出登录
    logout() {
      const router = useRouter();
      
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      
      // 重置状态
      this.userInfo = null;
      this.isLoggedIn = false;
      
      ElMessage.success('退出登录成功');
      
      // 跳转到登录页
      router.push('/login');
    },
    
    // 清除用户状态
    clearUserState() {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      
      // 重置状态
      this.userInfo = null;
      this.isLoggedIn = false;
    }
  }
});