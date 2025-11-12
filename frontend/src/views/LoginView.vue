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
    
    // 模拟登录请求
    setTimeout(() => {
      loading.value = false;
      // 模拟成功登录
      ElMessage.success('登录成功');
      // 保存token到localStorage（实际项目中应该使用更安全的存储方式）
      localStorage.setItem('token', 'mock_token_' + Date.now());
      localStorage.setItem('userInfo', JSON.stringify({
        id: '1',
        account: loginForm.account,
        name: '旅行者'
      }));
      // 跳转到首页
      router.push('/');
    }, 1000);
  } catch (error) {
    console.log('登录验证失败:', error);
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