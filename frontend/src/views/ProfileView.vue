<template>
  <div class="profile-container">
    <div class="profile-header-section">
      <div class="header-content">
        <h1>个人中心</h1>
        <el-button type="primary" @click="goToHome" class="back-home-btn">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
      </div>
    </div>
    
    <div class="profile-content-wrapper">
      <div class="profile-card">
        <div class="profile-header">
          <div class="user-info-section">
            <div class="avatar-container">
              <el-avatar :size="100" :src="userInfo.avatar || defaultAvatar" class="user-avatar" />
            </div>
            <div class="user-basic-info">
              <h2>{{ userInfo.name || '用户' }}</h2>
              <p class="user-email">{{ userInfo.email || '未设置邮箱' }}</p>
            </div>
          </div>
          
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ userStats.totalPlans }}</span>
              <span class="stat-label">旅行计划</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.totalDestinations }}</span>
              <span class="stat-label">去过的地方</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userStats.favoriteTravelType || '未设置' }}</span>
              <span class="stat-label">旅行偏好</span>
            </div>
          </div>
        </div>
        
        <div class="profile-content">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="basic">
              <el-form
                v-model="formData"
                label-position="top"
                class="profile-form form-layout"
                :rules="rules"
                ref="formRef"
              >
                <el-form-item label="用户名" prop="name">
                  <el-input v-model="formData.name" placeholder="请输入用户名" />
                </el-form-item>
                
                <el-form-item label="性别" prop="gender">
                  <el-radio-group v-model="formData.gender">
                    <el-radio label="男">男</el-radio>
                    <el-radio label="女">女</el-radio>
                    <el-radio label="保密">保密</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="生日" prop="birthday">
                  <el-date-picker
                    v-model="formData.birthday"
                    type="date"
                    placeholder="选择日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
                
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="formData.phone" placeholder="请输入手机号" />
                </el-form-item>
                
                <el-form-item label="个人简介">
                  <el-input
                    v-model="formData.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="介绍一下自己吧..."
                  />
                </el-form-item>
                
                <el-form-item label="旅行偏好">
                  <el-select
                    v-model="formData.travelPreferences"
                    placeholder="选择您的旅行偏好"
                    multiple
                    collapse-tags
                  >
                    <el-option label="自然风光" value="自然风光" />
                    <el-option label="人文历史" value="人文历史" />
                    <el-option label="美食探索" value="美食探索" />
                    <el-option label="城市观光" value="城市观光" />
                    <el-option label="主题乐园" value="主题乐园" />
                    <el-option label="购物血拼" value="购物血拼" />
                    <el-option label="休闲度假" value="休闲度假" />
                    <el-option label="探险活动" value="探险活动" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="紧急联系人">
                  <el-input v-model="formData.emergencyContact" placeholder="请输入紧急联系人" />
                </el-form-item>
                
                <el-form-item label="紧急联系人电话">
                  <el-input v-model="formData.emergencyPhone" placeholder="请输入紧急联系人电话" />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="submitForm">保存更改</el-button>
                  <el-button @click="resetForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="安全设置" name="security">
              <div class="security-settings">
                <div class="setting-card">
                  <div class="setting-header">
                    <h3>修改密码</h3>
                    <p class="setting-description">建议定期更换密码以保证账户安全</p>
                  </div>
                  <div class="setting-action">
                    <el-button type="primary" @click="showChangePasswordDialog">修改密码</el-button>
                  </div>
                </div>
                
                <div class="setting-card">
                  <div class="setting-header">
                    <h3>手机号</h3>
                    <p class="setting-description">当前手机号: {{ formData.phone || '未设置' }}</p>
                  </div>
                </div>
                
                <div class="setting-card">
                  <div class="setting-header">
                    <h3>账号注销</h3>
                    <p class="setting-description text-danger">注销后将无法恢复您的账户数据</p>
                  </div>
                  <div class="setting-action">
                    <el-button type="danger" @click="showDeleteAccountDialog">注销账号</el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="旅行统计" name="stats">
              <div class="travel-stats">
                <div class="section-title">
                  <h3>旅行概览</h3>
                </div>
                <div class="stats-summary">
                  <div class="stat-card">
                    <div class="stat-icon">
                      <i class="el-icon-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{ userStats.totalPlans }}</div>
                      <div class="stat-title">总旅行次数</div>
                    </div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-icon">
                      <i class="el-icon-place"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{ userStats.totalDestinations }}</div>
                      <div class="stat-title">去过的城市</div>
                    </div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-icon">
                      <i class="el-icon-time"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{ userStats.totalDays }}</div>
                      <div class="stat-title">总旅行天数</div>
                    </div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-icon">
                      <i class="el-icon-money"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">¥{{ userStats.totalSpent }}</div>
                      <div class="stat-title">总旅行花费</div>
                    </div>
                  </div>
                </div>
                
                <div class="stats-detail">
                  <div class="detail-section">
                    <h3>旅行偏好分析</h3>
                    <div class="preferences-chart">
                      <div 
                        v-for="(pref, index) in userStats.preferencesDistribution" 
                        :key="index"
                        class="preference-item"
                      >
                        <div class="preference-label">{{ pref.name }}</div>
                        <el-progress 
                          :percentage="pref.percentage" 
                          :color="getProgressColor(pref.percentage)"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div class="detail-section">
                    <h3>最近旅行</h3>
                    <div class="recent-trips">
                      <div 
                        v-for="(trip, index) in userStats.recentTrips" 
                        :key="index"
                        class="trip-item"
                      >
                        <div class="trip-destination">{{ trip.destination }}</div>
                        <div class="trip-date">{{ trip.date }}</div>
                      </div>
                      <div v-if="userStats.recentTrips.length === 0" class="no-data">
                        暂无旅行记录
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="changePasswordDialogVisible"
      title="修改密码"
      width="40%"
    >
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-position="top"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input type="password" v-model="passwordForm.currentPassword" placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" v-model="passwordForm.newPassword" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input type="password" v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>
    
    <!-- 绑定手机号功能已移除 -->
    
    <!-- 账号注销确认对话框 -->
    <el-dialog
      v-model="deleteAccountDialogVisible"
      title="确认注销账号"
      width="40%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="delete-account-warning">
        <el-alert
          title="账号注销须知"
          type="warning"
          description="注销账号后，您的所有旅行计划、个人信息等数据将被永久删除，且无法恢复。请谨慎操作！"
          show-icon
          class="mb-4"
        />
        <el-form-item>
          <el-checkbox v-model="confirmDeleteAccount" class="danger-checkbox">
            我已了解注销后果，确认注销账号
          </el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="deleteAccountPassword"
            type="password"
            placeholder="请输入当前密码以确认注销"
          />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="deleteAccountDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          :disabled="!confirmDeleteAccount || !deleteAccountPassword"
          @click="confirmAccountDelete"
        >
          确认注销
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { House } from '@element-plus/icons-vue';

const router = useRouter();
const formRef = ref(null);
const passwordFormRef = ref(null);
const phoneFormRef = ref(null);
// 移除了头像上传相关的ref
const activeTab = ref('basic');

const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png';

// 用户基本信息
const userInfo = ref({
  id: '',
  name: '',
  email: '',
  avatar: '',
  createdAt: ''
});

// 表单数据
let formData = reactive({
  name: '',
  gender: '保密',
  birthday: '',
  phone: '',
  bio: '',
  travelPreferences: [],
  emergencyContact: '',
  emergencyPhone: ''
});

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 手机表单
// 移除了手机号表单数据

// 账号注销相关
const deleteAccountDialogVisible = ref(false);
const confirmDeleteAccount = ref(false);
const deleteAccountPassword = ref('');

// 对话框控制
const changePasswordDialogVisible = ref(false);
// 移除了绑定手机号相关的状态

// 表单验证规则
const rules = reactive({
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
});

const passwordRules = reactive({
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
});

// 移除了手机号和验证码相关的验证规则

// 用户统计数据
const userStats = ref({
  totalPlans: 3,
  totalDestinations: 5,
  totalDays: 12,
  totalSpent: 18000,
  favoriteTravelType: '人文历史',
  preferencesDistribution: [
    { name: '人文历史', percentage: 40 },
    { name: '自然风光', percentage: 30 },
    { name: '美食探索', percentage: 20 },
    { name: '城市观光', percentage: 10 }
  ],
  recentTrips: [
    { destination: '北京', date: '2024-01-15 至 2024-01-17' },
    { destination: '杭州', date: '2023-12-01 至 2023-12-03' },
    { destination: '上海', date: '2023-10-05 至 2023-10-08' }
  ]
});

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage >= 40) return '#67c23a';
  if (percentage >= 20) return '#409eff';
  return '#e6a23c';
};

// 移除了头像上传相关的方法

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      // 模拟提交请求
      setTimeout(() => {
        ElMessage.success('个人信息更新成功');
        // 更新localStorage中的用户信息
        const updatedUser = {
          ...userInfo.value,
          name: formData.name
        };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      }, 1000);
    }
  });
};

// 重置表单
const resetForm = () => {
  formRef.value.resetFields();
};

// 显示修改密码对话框
const showChangePasswordDialog = () => {
  changePasswordFormRef.value?.resetFields();
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  changePasswordDialogVisible.value = true;
};

// 修改密码
const changePassword = () => {
  passwordFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        changePasswordDialogVisible.value = false;
        ElMessage.success('密码修改成功，请重新登录');
        // 清除本地存储并跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        router.push('/login');
      }, 1000);
    }
  });
};

// 移除了绑定手机号相关的方法

// 显示账号注销对话框
const showDeleteAccountDialog = () => {
  confirmDeleteAccount.value = false;
  deleteAccountPassword.value = '';
  deleteAccountDialogVisible.value = true;
};

// 确认注销账号
const confirmAccountDelete = () => {
  if (!deleteAccountPassword.value) {
    ElMessage.warning('请输入当前密码');
    return;
  }
  
  // 模拟API调用
  setTimeout(() => {
    deleteAccountDialogVisible.value = false;
    ElMessage.success('账号已注销');
    // 清除本地存储并跳转到登录页
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    router.push('/login');
  }, 1500);
};

// 跳转到隐私设置
const navigateToPrivacy = () => {
  ElMessage.info('隐私设置功能开发中...');
};

const goToHome = () => {
  router.push('/');
};

// 加载用户信息
const loadUserInfo = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (userInfoStr) {
    try {
      const user = JSON.parse(userInfoStr);
      userInfo.value = user;
      // 填充表单数据
      formData.name = user.name || '';
      formData.email = user.email || '';
      formData.phone = user.phone || '';
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
};

// 检查用户是否登录
const checkLoginStatus = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return false;
  }
  return true;
};

// 组件挂载
onMounted(() => {
  if (checkLoginStatus()) {
    loadUserInfo();
  }
});
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header-section {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h1 {
  margin: 0;
}

.back-home-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

.profile-header-section h1 {
  font-size: 32px;
  color: #303133;
  margin: 0;
}

.profile-content-wrapper {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.profile-card {
  border-radius: 12px;
  overflow: hidden;
}

.profile-header {
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-info-section {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 30px;
}

.avatar-container {
  position: relative;
}

.user-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  transition: transform 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.user-basic-info h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
}

.user-email {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.tabs-container {
  padding: 30px;
}

.profile-form.form-layout {
  max-width: 600px;
  margin: 0 auto;
}

.form-item {
  margin-bottom: 24px;
}

.security-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.setting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.setting-header h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #303133;
}

.setting-description {
  margin: 0 0 15px 0;
  color: #909399;
  font-size: 14px;
}

.setting-action {
  display: flex;
  justify-content: flex-end;
}

.travel-stats {
  padding: 20px 0;
}

.section-title {
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.section-title h3 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.stats-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  flex: 1;
  min-width: 200px;
  padding: 25px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-card h4 {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.stat-card .stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.chart-container {
  margin-top: 30px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.text-danger {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 15px;
  }
  
  .profile-header {
    padding: 20px;
  }
  
  .user-info-section {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .user-stats {
    gap: 15px;
  }
  
  .stat-item {
    min-width: 100px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .tabs-container {
    padding: 20px 15px;
  }
}
</style>