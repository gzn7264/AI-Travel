<template>
  <div class="home-container">
    <header class="home-header">
      <div class="header-content">
        <h1>AI旅行规划师</h1>
        <div class="user-info">
          <el-dropdown>
            <span class="user-name">{{ currentUser?.name || '游客' }}</span>
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
            <el-button type="primary" @click="saveTravelPlan">保存计划</el-button>
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
const generateTravelPlan = (requirement) => {
  if (!requirement.trim()) {
    ElMessage.warning('请输入旅行需求');
    return;
  }
  
  loading.value = true;
  showPlanSection.value = true;
  
  // 模拟API调用
  setTimeout(() => {
    // Mock数据
    travelPlan.value = {
      id: 'mock_plan_' + Date.now(),
      name: '北京三日游',
      destination: '北京',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      budget: 5000,
      travelersCount: 2,
      preferences: requirement,
      nodes: [
        // 第一天
        {
          id: 'node_1',
          node_type: '景点',
          date: '2024-01-15',
          time: '09:00',
          location: '故宫博物院',
          description: '参观世界上最大的古代宫殿建筑群',
          estimated_duration: '4小时',
          budget: 80,
          sequence_order: 1
        },
        {
          id: 'node_2',
          node_type: '餐饮',
          date: '2024-01-15',
          time: '13:30',
          location: '王府井大街',
          description: '品尝北京特色小吃',
          estimated_duration: '1.5小时',
          budget: 150,
          sequence_order: 2
        },
        {
          id: 'node_3',
          node_type: '景点',
          date: '2024-01-15',
          time: '15:30',
          location: '天安门广场',
          description: '游览世界上最大的城市广场',
          estimated_duration: '1小时',
          budget: 0,
          sequence_order: 3
        },
        {
          id: 'node_4',
          node_type: '住宿',
          date: '2024-01-15',
          time: '19:00',
          location: '北京饭店',
          description: '四星级酒店，位于市中心',
          estimated_duration: '整晚',
          budget: 800,
          sequence_order: 4
        },
        // 第二天
        {
          id: 'node_5',
          node_type: '景点',
          date: '2024-01-16',
          time: '09:00',
          location: '长城',
          description: '不到长城非好汉',
          estimated_duration: '5小时',
          budget: 120,
          sequence_order: 1
        },
        {
          id: 'node_6',
          node_type: '餐饮',
          date: '2024-01-16',
          time: '14:30',
          location: '农家乐',
          description: '品尝农家菜',
          estimated_duration: '1小时',
          budget: 100,
          sequence_order: 2
        },
        // 第三天
        {
          id: 'node_7',
          node_type: '景点',
          date: '2024-01-17',
          time: '10:00',
          location: '颐和园',
          description: '皇家园林博物馆',
          estimated_duration: '3小时',
          budget: 60,
          sequence_order: 1
        }
      ]
    };
    
    loading.value = false;
    ElMessage.success('旅行计划生成成功！');
  }, 2000);
};

// 保存旅行计划
const saveTravelPlan = () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录后再保存计划');
    router.push('/login');
    return;
  }
  
  // 模拟保存请求
  setTimeout(() => {
    ElMessage.success('旅行计划保存成功！');
    router.push('/my-plans');
  }, 1000);
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