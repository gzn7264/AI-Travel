<template>
  <div class="my-plans-container">
    <header class="page-header">
      <div class="header-content">
        <h1>我的旅行计划</h1>
        <el-button 
          icon="el-icon-home" 
          type="primary" 
          size="small" 
          class="back-home-btn"
          @click="navigateToHome"
          title="返回首页"
        />
      </div>
    </header>
    
    <main class="page-main">
      <div class="plans-filter">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索旅行计划..."
          prefix-icon="el-icon-search"
          clearable
          class="search-input"
        />
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          class="sort-select"
        >
          <el-option label="创建时间（最新）" value="createdAt_desc" />
          <el-option label="创建时间（最早）" value="createdAt_asc" />
          <el-option label="目的地（A-Z）" value="destination_asc" />
          <el-option label="预算（从低到高）" value="budget_asc" />
          <el-option label="预算（从高到低）" value="budget_desc" />
        </el-select>
      </div>
      
      <div class="plans-list">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="filteredPlans.length > 0" class="plans-grid">
          <el-card
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="plan-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <h3>{{ plan.name }}</h3>
                <el-dropdown>
                  <el-button size="small" type="text" icon="el-icon-more" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="editPlan(plan)">编辑计划</el-dropdown-item>
                      <el-dropdown-item @click="sharePlan(plan)">分享计划</el-dropdown-item>
                      <el-dropdown-item divided @click="deletePlanConfirm(plan)">删除计划</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            
            <div class="plan-card-body">
              <div class="plan-info">
                <div class="info-item">
                  <i class="el-icon-place"></i>
                  <span class="label">目的地：</span>
                  <span class="value">{{ plan.destination }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-date"></i>
                  <span class="label">日期：</span>
                  <span class="value">{{ formatDateRange(plan.startDate, plan.endDate) }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-user"></i>
                  <span class="label">人数：</span>
                  <span class="value">{{ plan.travelersCount }}人</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-money"></i>
                  <span class="label">预算：</span>
                  <span class="value price">¥{{ plan.budget }}</span>
                </div>
              </div>
              
              <div class="plan-preview">
                <h4>行程概览</h4>
                <div class="nodes-preview">
                  <div v-for="node in plan.nodes.slice(0, 3)" :key="node.id" class="node-preview">
                    <span class="node-type" :class="getNodeTypeClass(node.node_type)">{{ node.node_type }}</span>
                    <span class="node-name">{{ node.location }}</span>
                  </div>
                  <div v-if="plan.nodes.length > 3" class="more-nodes">
                    +{{ plan.nodes.length - 3 }}个景点
                  </div>
                </div>
              </div>
              
              <div class="plan-footer">
                <span class="create-time">创建时间：{{ formatDate(plan.createdAt) }}</span>
                <el-button type="primary" size="small" @click="viewPlanDetails(plan)">查看详情</el-button>
              </div>
            </div>
          </el-card>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无旅行计划" />
          <el-button type="primary" class="create-plan-btn" @click="navigateToHome">创建新计划</el-button>
        </div>
      </div>
      
      <div v-if="filteredPlans.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredPlans.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </main>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
      :before-close="handleCloseDeleteDialog"
    >
      <span>确定要删除计划「{{ deletePlan?.name }}」吗？此操作不可撤销。</span>
      <template #footer>
        <el-button @click="handleCloseDeleteDialog">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const searchKeyword = ref('');
const sortBy = ref('createdAt_desc');
const currentPage = ref(1);
const pageSize = ref(5);
const deleteDialogVisible = ref(false);
const deletePlan = ref(null);
const plans = ref([]);

// 计算过滤和排序后的计划列表
const filteredPlans = computed(() => {
  let result = [...plans.value];
  
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim();
    result = result.filter(plan => 
      plan.name.toLowerCase().includes(keyword) ||
      plan.destination.toLowerCase().includes(keyword) ||
      plan.preferences.toLowerCase().includes(keyword)
    );
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'createdAt_asc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'createdAt_desc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'destination_asc':
        return a.destination.localeCompare(b.destination);
      case 'budget_asc':
        return a.budget - b.budget;
      case 'budget_desc':
        return b.budget - a.budget;
      default:
        return 0;
    }
  });
  
  return result;
});

// 获取分页后的计划
const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredPlans.value.slice(start, end);
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

// 格式化日期范围
const formatDateRange = (startDateStr, endDateStr) => {
  const startDate = formatDate(startDateStr);
  const endDate = formatDate(endDateStr);
  return `${startDate} - ${endDate}`;
};

// 获取节点类型对应的CSS类
const getNodeTypeClass = (type) => {
  const classMap = {
    '餐饮': 'node-food',
    '景点': 'node-attraction',
    '住宿': 'node-hotel',
    '交通': 'node-transport'
  };
  return classMap[type] || 'node-default';
};

// 查看计划详情
const viewPlanDetails = (plan) => {
  // 由于系统中没有实现计划详情页面，暂时跳转到首页并携带计划ID参数
  router.push({
    path: '/',
    query: { planId: plan.id }
  });
};

// 编辑计划
const editPlan = (plan) => {
  router.push(`/edit-plan/${plan.id}`);
};

// 分享计划
const sharePlan = (plan) => {
  ElMessage.info('分享功能开发中...');
};

// 显示删除确认对话框
const deletePlanConfirm = (plan) => {
  deletePlan.value = plan;
  deleteDialogVisible.value = true;
};

// 关闭删除对话框
const handleCloseDeleteDialog = () => {
  deleteDialogVisible.value = false;
  deletePlan.value = null;
};

// 确认删除
const confirmDelete = () => {
  // 模拟删除请求
  loading.value = true;
  setTimeout(() => {
    plans.value = plans.value.filter(p => p.id !== deletePlan.value.id);
    deleteDialogVisible.value = false;
    deletePlan.value = null;
    ElMessage.success('计划删除成功');
    loading.value = false;
  }, 800);
};

// 跳转到首页创建新计划
const navigateToHome = () => {
  router.push('/');
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 处理页码变化
const handleCurrentChange = (current) => {
  currentPage.value = current;
};

// 加载用户旅行计划
const loadUserPlans = () => {
  loading.value = true;
  
  // 模拟API调用
  setTimeout(() => {
    // Mock数据
    plans.value = [
      {
        id: 'plan_1',
        name: '北京三日游',
        destination: '北京',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        budget: 5000,
        travelersCount: 2,
        preferences: '希望参观故宫、长城等著名景点，预算5000元，2人同行',
        createdAt: '2024-01-01T10:00:00Z',
        nodes: [
          {
            id: 'node_1',
            node_type: '景点',
            location: '故宫博物院'
          },
          {
            id: 'node_2',
            node_type: '餐饮',
            location: '王府井大街'
          },
          {
            id: 'node_3',
            node_type: '景点',
            location: '天安门广场'
          },
          {
            id: 'node_4',
            node_type: '住宿',
            location: '北京饭店'
          }
        ]
      },
      {
        id: 'plan_2',
        name: '杭州西湖之旅',
        destination: '杭州',
        startDate: '2024-02-10',
        endDate: '2024-02-12',
        budget: 3000,
        travelersCount: 1,
        preferences: '一人游西湖，希望体验当地美食，预算3000元',
        createdAt: '2024-01-15T14:30:00Z',
        nodes: [
          {
            id: 'node_5',
            node_type: '景点',
            location: '西湖'
          },
          {
            id: 'node_6',
            node_type: '餐饮',
            location: '知味观'
          },
          {
            id: 'node_7',
            node_type: '住宿',
            location: '杭州凯悦酒店'
          }
        ]
      },
      {
        id: 'plan_3',
        name: '上海都市风情',
        destination: '上海',
        startDate: '2024-03-05',
        endDate: '2024-03-08',
        budget: 8000,
        travelersCount: 3,
        preferences: '家庭游上海，想去迪士尼，预算8000元，3人',
        createdAt: '2024-01-20T09:15:00Z',
        nodes: [
          {
            id: 'node_8',
            node_type: '景点',
            location: '上海迪士尼乐园'
          },
          {
            id: 'node_9',
            node_type: '景点',
            location: '外滩'
          },
          {
            id: 'node_10',
            node_type: '餐饮',
            location: '南京路步行街'
          },
          {
            id: 'node_11',
            node_type: '景点',
            location: '东方明珠'
          },
          {
            id: 'node_12',
            node_type: '住宿',
            location: '上海浦东香格里拉大酒店'
          }
        ]
      }
    ];
    
    loading.value = false;
  }, 1500);
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
    loadUserPlans();
  }
});
</script>

<style scoped>
.my-plans-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 0;
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

.back-home-btn {
  background-color: #1989fa;
  border-color: #1989fa;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}

.page-header h1 {
  margin: 0;
  font-size: 2.2rem;
}

.page-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.plans-filter {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.sort-select {
  width: 200px;
}

.loading-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.plan-card {
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 500;
}

.plan-card-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.info-item i {
  margin-right: 8px;
  color: #667eea;
}

.info-item .label {
  margin-right: 5px;
  font-weight: 500;
}

.info-item .value.price {
  color: #ff6700;
  font-weight: 500;
}

.plan-preview h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1rem;
  border-left: 3px solid #667eea;
  padding-left: 8px;
}

.nodes-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.node-type {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.node-attraction {
  background-color: #e6f7ff;
  color: #1890ff;
}

.node-food {
  background-color: #fff7e6;
  color: #fa8c16;
}

.node-hotel {
  background-color: #f6ffed;
  color: #52c41a;
}

.node-transport {
  background-color: #f9f0ff;
  color: #722ed1;
}

.more-nodes {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.plan-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.create-time {
  font-size: 12px;
  color: #999;
}

.empty-state {
  background: white;
  padding: 60px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.create-plan-btn {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 30px;
  text-align: center;
}

@media (max-width: 768px) {
  .plans-filter {
    flex-direction: column;
  }
  
  .sort-select {
    width: 100%;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .plan-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>