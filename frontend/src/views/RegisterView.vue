<template>
  <div class="register-container">
    <div class="register-form-wrapper">
      <h2>注册 AI旅行规划师</h2>
      <el-form
        :model="registerForm"
        :rules="rules"
        ref="registerFormRef"
        label-width="100px"
        class="register-form"
      >
        <el-form-item label="邮箱/手机号" prop="account">
          <el-input
            v-model="registerForm.account"
            placeholder="请输入邮箱或手机号"
            prefix-icon="el-icon-user"
          />
        </el-form-item>
        <el-form-item label="用户名" prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="请设置2-20个字符的用户名"
            prefix-icon="el-icon-user-solid"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请设置密码（不少于6位）"
            prefix-icon="el-icon-lock"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="el-icon-lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="registerForm.agreeTerms">
            我已阅读并同意 <el-link type="primary">用户协议</el-link> 和 <el-link type="primary">隐私政策</el-link>
          </el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="loading" class="register-button">
            注册
          </el-button>
          <el-button @click="navigateToLogin">已有账号？去登录</el-button>
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
const registerFormRef = ref(null);
const loading = ref(false);

const registerForm = reactive({
  account: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
});

const rules = {
  account: [
    { required: true, message: '请输入邮箱或手机号', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        // 简单的邮箱或手机号验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
          callback(new Error('请输入有效的邮箱或手机号'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  nickname: [
    { required: true, message: '请设置用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度必须在2-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  
  try {
    await registerFormRef.value.validate();
    
    if (!registerForm.agreeTerms) {
      ElMessage.warning('请阅读并同意用户协议和隐私政策');
      return;
    }
    
    loading.value = true;
    
    // 调用真实的后端注册API
      const response = await userService.register({
        email: registerForm.account, // 后端期望email字段
        password: registerForm.password,
        nickname: registerForm.nickname // 添加昵称字段
      });
    
    loading.value = false;
    
    if (response.success) {
      ElMessage.success('注册成功！正在跳转到登录页面...');
      // 延迟跳转到登录页面
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      ElMessage.error(response.error || '注册失败，请稍后重试');
    }
  } catch (error) {
    loading.value = false;
    console.error('注册过程发生错误:', error);
    ElMessage.error('注册过程发生错误，请稍后重试');
  }
};

const navigateToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-form-wrapper {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.register-form-wrapper h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.register-form {
  width: 100%;
}

.register-form-item {
  margin-bottom: 20px;
}

.register-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style>