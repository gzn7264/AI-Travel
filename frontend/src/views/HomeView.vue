<template>
  <div class="home-container">
    <header class="home-header">
      <div class="header-content">
        <h1>AI旅行规划师</h1>
        <div class="user-info">
          <el-dropdown>
            <span class="user-name">{{ currentUser?.nickname || currentUser?.name || '游客' }}</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="navigateToProfile">个人中心</el-dropdown-item>
                <el-dropdown-item @click="navigateToMyPlans">我的旅行计划</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="home-main">
      <section class="requirement-section">
        <h2>告诉我们您的旅行需求</h2>
        <SpeechInput
          v-model="travelRequirement"
          @submit="generateTravelPlan"
        />
      </section>

      <section v-if="showPlanSection" class="plan-section">
        <h2>您的旅行计划</h2>
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="6" animated />
        </div>
        <div v-else-if="travelPlan" class="plan-content">
          <div class="plan-header">
      <h3>{{ travelPlan.name }}</h3>
      <div class="plan-meta">
        <span class="destination">{{ travelPlan.destination }}</span>
        <span class="date-range">{{ formatDate(travelPlan.startDate) }} - {{ formatDate(travelPlan.endDate) }}</span>
        <span class="travelers">{{ travelPlan.travelersCount }}人同行</span>
        <span class="budget">预算: ¥{{ travelPlan.budget }}</span>
        <el-button 
          type="primary" 
          size="small" 
          @click="saveTravelPlan"
          :loading="loading"
          class="save-btn-top"
        >
          保存计划
        </el-button>
      </div>
    </div>
          
          <div class="plan-days">
            <div v-for="(day, index) in planByDay" :key="index" class="day-section">
              <h4>第{{ index + 1 }}天 ({{ formatDate(day.date) }})</h4>
              <div class="day-nodes">
                <el-timeline>
                  <el-timeline-item
                    v-for="node in day.nodes"
                    :key="node.id"
                    :timestamp="node.time || '全天'"
                    :type="getNodeTypeColor(node.nodeType)"
                    :icon="getNodeTypeIcon(node.nodeType)"
                  >
                    <div class="node-content">
                      <h5>{{ node.location }}</h5>
                      <p class="node-description">{{ node.description }}</p>
                      <div class="node-info">
                        <span class="node-type">{{ node.nodeType }}</span>
                        <span class="node-duration" v-if="node.estimatedDuration">预计时长: {{ node.estimatedDuration }}</span>
                        <span class="node-budget">预算: ¥{{ node.budget }}</span>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </div>
          
          <div class="plan-actions">
        <el-button type="success" @click="shareTravelPlan">分享计划</el-button>
        <el-button @click="generateNewPlan">生成新计划</el-button>
      </div>
        </div>
        <div v-else class="empty-plan">
          <el-empty description="暂无旅行计划，输入您的需求并提交生成" />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import SpeechInput from '../components/speech-recognition/SpeechInput.vue';
import axiosInstance from '../api/axiosInstance.js';

const router = useRouter();
const travelRequirement = ref('');
const travelPlan = ref(null);
const loading = ref(false);
const showPlanSection = ref(false);
const currentUser = ref(null);

// 按天分组的旅行计划
const planByDay = computed(() => {
  if (!travelPlan.value || !travelPlan.value.nodes) return [];
  
  const daysMap = {};
  travelPlan.value.nodes.forEach(node => {
    if (!daysMap[node.date]) {
      daysMap[node.date] = {
        date: node.date,
        nodes: []
      };
    }
    daysMap[node.date].nodes.push(node);
  });
  
  // 按日期和顺序排序
  return Object.values(daysMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(day => ({
      ...day,
      nodes: day.nodes.sort((a, b) => a.sequence_order - b.sequence_order)
    }));
});

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 获取节点类型对应的颜色
const getNodeTypeColor = (type) => {
  const colorMap = {
    '餐饮': 'success',
    '景点': 'primary',
    '住宿': 'warning',
    '交通': 'info'
  };
  return colorMap[type] || 'primary';
};

// 获取节点类型对应的图标
const getNodeTypeIcon = (type) => {
  const iconMap = {
    '餐饮': 'el-icon-dish',
    '景点': 'el-icon-place',
    '住宿': 'el-icon-home',
    '交通': 'el-icon-car'
  };
  return iconMap[type] || 'el-icon-circle-check';
};

// 生成旅行计划
const generateTravelPlan = async (requirement) => {
  if (!requirement.trim()) {
    ElMessage.warning('请输入旅行需求');
    return;
  }
  
  loading.value = true;
  showPlanSection.value = true;
  
  // 直接使用用户输入的原始内容作为prompt
  const prompt = requirement;
  
  try {
    // 调用后端百炼大语言模型API，设置180秒超时
    const response = await axiosInstance.post('/plans/generate', {
      prompt: prompt
    }, {
      timeout: 180000 // 180秒超时
    });

    // 处理后端返回的数据，确保格式符合前端渲染要求
    const planData = response.data;
    
    // 规范化计划数据格式
    travelPlan.value = {
      id: planData.id || 'plan_' + Date.now(),
      name: planData.name || '智能生成旅行计划',
      destination: planData.destination || '未知目的地',
      startDate: planData.startDate || new Date().toISOString().split('T')[0],
      endDate: planData.endDate || new Date().toISOString().split('T')[0],
      budget: planData.budget || 0,
      travelersCount: planData.travelersCount || 1,
      preferences: requirement,
      nodes: planData.nodes || []
    };
    
    // 确保nodes中的每个节点都有正确的类型和属性
    if (travelPlan.value.nodes.length > 0) {
      travelPlan.value.nodes = travelPlan.value.nodes.map((node, index) => ({
        id: node.id || `node_${index}`,
        node_type: node.node_type || '景点',
        date: node.date || travelPlan.value.startDate,
        time: node.time || '全天',
        location: node.location || '未命名地点',
        description: node.description || '',
        estimated_duration: node.estimated_duration || '',
        budget: node.budget || 0,
        sequence_order: node.sequence_order || index
      }));
    }
    
    ElMessage.success('旅行计划生成成功！');
  } catch (error) {
    console.error('生成旅行计划失败:', error);
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试');
    } else if (error.response) {
      ElMessage.error(`生成失败: ${error.response.data.message || '服务器错误'}`);
    } else {
      ElMessage.error('网络错误，请检查您的网络连接');
    }
  } finally {
    loading.value = false;
  }
};

// 保存旅行计划
const saveTravelPlan = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录后再保存计划');
    router.push('/login');
    return;
  }
  
  if (!travelPlan.value) {
    ElMessage.warning('没有可保存的旅行计划');
    return;
  }
  
  loading.value = true;
  try {
    // 调用后端API保存到Supabase数据库
    const response = await axiosInstance.post('/plans', {
      ...travelPlan.value,
      userId: currentUser.value.id
    });
    
    loading.value = false;
    ElMessage.success('旅行计划保存成功！');
    navigateToMyPlans();
  } catch (error) {
    console.error('保存旅行计划失败:', error);
    loading.value = false;
    if (error.response) {
      ElMessage.error(`保存失败: ${error.response.data.message || '服务器错误'}`);
    } else {
      ElMessage.error('网络错误，请检查您的网络连接');
    }
  }
};

// 分享旅行计划
const shareTravelPlan = () => {
  ElMessage.info('分享功能开发中...');
};

// 生成新计划
const generateNewPlan = () => {
  travelPlan.value = null;
  showPlanSection.value = false;
  travelRequirement.value = '';
};

// 跳转到个人中心
const navigateToProfile = () => {
  router.push('/profile');
};

// 跳转到我的旅行计划
const navigateToMyPlans = () => {
  router.push('/my-plans');
};

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  currentUser.value = null;
  ElMessage.success('退出登录成功');
  router.push('/login');
};

// 检查用户登录状态
const checkLoginStatus = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  if (userInfoStr) {
    try {
      currentUser.value = JSON.parse(userInfoStr);
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
};

// 组件挂载时检查登录状态
onMounted(() => {
  checkLoginStatus();
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.home-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  cursor: pointer;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: background-color 0.3s;
}

.user-name:hover {
  background: rgba(255, 255, 255, 0.3);
}

.home-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.requirement-section,
.plan-section {
  background: white;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.requirement-section h2,
.plan-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.8rem;
}

.loading-container {
  padding: 20px 0;
}

.plan-content {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.plan-header {
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.plan-header h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.5rem;
}

.plan-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #666;
  font-size: 14px;
}

.plan-meta span {
  display: flex;
  align-items: center;
}

.destination {
  color: #667eea;
  font-weight: 500;
}

.day-section {
  margin-bottom: 40px;
}

.day-section h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3rem;
}

.day-nodes {
  margin-left: 20px;
}

.node-content {
  background: #fafafa;
  padding: 15px;
  border-radius: 6px;
}

.node-content h5 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.node-description {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.node-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 13px;
  color: #888;
}

.node-type {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 3px;
}

.plan-actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
  justify-content: center;
}

.empty-plan {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .plan-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .plan-actions {
    flex-direction: column;
  }
  
  .day-nodes {
    margin-left: 0;
  }
}
</style>