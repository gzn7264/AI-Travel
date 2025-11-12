<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2>登录 AI旅行规划师</h2>
      <el-form
        :model="loginForm"
        :rules="rules"
        ref="loginFormRef"
        label-width="80px"
        class="login-form"
      >
        <el-form-item label="邮箱/手机号" prop="account">
          <el-input
            v-model="loginForm.account"
            placeholder="请输入邮箱或手机号"
            prefix-icon="el-icon-user"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          <el-link type="primary" :underline="false" class="forgot-password">忘记密码？</el-link>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" class="login-button">
            登录
          </el-button>
          <el-button @click="navigateToRegister">注册账号</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import userService from '../api/userService';

const router = useRouter();
const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  account: '',
  password: '',
  rememberMe: false
});

const rules = {
  account: [
    { required: true, message: '请输入邮箱或手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  try {
    await loginFormRef.value.validate();
    loading.value = true;
    
    console.log('登录请求参数:', {
      email: loginForm.account,
      password: '******' // 不打印密码
    });
    
    // 调用真实的后端登录API
    const response = await userService.login({
      email: loginForm.account, // 后端期望email字段
      password: loginForm.password
    });
    
    console.log('登录响应:', response);
    loading.value = false;
    
    if (response.success) {
      // 登录成功
      ElMessage.success('登录成功');
      
      // 保存token和用户信息到localStorage
      if (response.data) {
        localStorage.setItem('token', response.data.token || '');
        localStorage.setItem('userInfo', JSON.stringify(response.data.user || {}));
        
        // 保存Supabase令牌（如果有）
        if (response.data.supabase_tokens) {
          localStorage.setItem('supabaseTokens', JSON.stringify(response.data.supabase_tokens));
        }
      }
      
      // 跳转到首页或重定向页
      const redirect = router.currentRoute.value.query.redirect || '/';
      console.log('登录成功，准备跳转到:', redirect);
      router.push(redirect);
    } else {
      // 登录失败
      console.error('登录失败原因:', response.error || response.message || '未知错误');
      ElMessage.error(response.error || response.message || '登录失败，请检查您的邮箱和密码');
    }
  } catch (error) {
    loading.value = false;
    console.error('登录过程发生错误:', error);
    console.error('错误详情:', error.response?.data || error);
    ElMessage.error('登录过程发生错误，请稍后重试');
  }
};

const navigateToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.login-form-wrapper h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.login-form {
  width: 100%;
}

.login-form-item {
  margin-bottom: 20px;
}

.forgot-password {
  float: right;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style>