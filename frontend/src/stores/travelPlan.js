import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';

export const useTravelPlanStore = defineStore('travelPlan', {
  // 状态
  state: () => ({
    // 当前旅行计划
    currentPlan: null,
    // 用户的所有旅行计划列表
    planList: [],
    // 加载状态
    loading: false,
    // 当前编辑的计划
    editingPlan: null,
    // 搜索条件
    searchFilters: {
      destination: '',
      startDate: '',
      endDate: '',
      status: ''
    }
  }),
  
  // Getters
  getters: {
    // 获取当前计划
    getCurrentPlan: (state) => state.currentPlan,
    // 获取计划列表
    getPlanList: (state) => state.planList,
    // 获取加载状态
    getLoadingStatus: (state) => state.loading,
    // 获取编辑中的计划
    getEditingPlan: (state) => state.editingPlan,
    // 获取搜索条件
    getSearchFilters: (state) => state.searchFilters,
    // 获取筛选后的计划列表
    getFilteredPlans: (state) => {
      let filteredPlans = [...state.planList];
      
      // 按目的地筛选
      if (state.searchFilters.destination) {
        filteredPlans = filteredPlans.filter(plan => 
          plan.destination.toLowerCase().includes(state.searchFilters.destination.toLowerCase())
        );
      }
      
      // 按开始日期筛选
      if (state.searchFilters.startDate) {
        const startDate = new Date(state.searchFilters.startDate);
        filteredPlans = filteredPlans.filter(plan => new Date(plan.startDate) >= startDate);
      }
      
      // 按结束日期筛选
      if (state.searchFilters.endDate) {
        const endDate = new Date(state.searchFilters.endDate);
        filteredPlans = filteredPlans.filter(plan => new Date(plan.endDate) <= endDate);
      }
      
      // 按状态筛选
      if (state.searchFilters.status) {
        filteredPlans = filteredPlans.filter(plan => plan.status === state.searchFilters.status);
      }
      
      // 按创建时间倒序排序
      filteredPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return filteredPlans;
    }
  },
  
  // Actions
  actions: {
    // 初始化计划列表（从本地存储）
    async initPlanList() {
      try {
        const storedPlans = localStorage.getItem('travelPlans');
        if (storedPlans) {
          this.planList = JSON.parse(storedPlans);
        } else {
          // 如果本地没有数据，使用模拟数据初始化
          this.planList = this.getMockTravelPlans();
          // 保存到本地存储
          localStorage.setItem('travelPlans', JSON.stringify(this.planList));
        }
      } catch (error) {
        console.error('初始化计划列表失败:', error);
        // 发生错误时使用模拟数据
        this.planList = this.getMockTravelPlans();
      }
    },
    
    // 获取模拟旅行计划数据
    getMockTravelPlans() {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      return [
        {
          id: 'plan_001',
          title: '北京三日游',
          destination: '北京',
          startDate: nextWeek.toISOString().split('T')[0],
          endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          days: 3,
          people: 2,
          budget: 5000,
          status: 'planned',
          overview: '故宫、长城、天安门、颐和园等经典景点游览',
          dailyItinerary: [
            {
              day: 1,
              activities: [
                { time: '09:00-12:00', title: '故宫博物院', description: '参观紫禁城，了解中国历史' },
                { time: '12:00-13:30', title: '午餐', description: '品尝北京烤鸭' },
                { time: '14:00-17:00', title: '天安门广场', description: '参观纪念碑和天安门城楼' },
                { time: '18:00-20:00', title: '晚餐', description: '王府井小吃街' }
              ]
            },
            {
              day: 2,
              activities: [
                { time: '08:00-15:00', title: '八达岭长城', description: '登长城，感受雄伟壮观' },
                { time: '16:00-18:00', title: '明十三陵', description: '参观明朝皇帝陵墓' }
              ]
            },
            {
              day: 3,
              activities: [
                { time: '09:00-12:00', title: '颐和园', description: '游览皇家园林' },
                { time: '13:00-16:00', title: '圆明园', description: '参观历史遗址' },
                { time: '16:30-18:30', title: '后海酒吧街', description: '休闲放松，体验北京夜生活' }
              ]
            }
          ],
          createdAt: today.toISOString(),
          updatedAt: today.toISOString()
        },
        {
          id: 'plan_002',
          title: '上海周末游',
          destination: '上海',
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: new Date(tomorrow.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          days: 2,
          people: 3,
          budget: 3000,
          status: 'planned',
          overview: '上海迪士尼乐园一日游，第二天市区观光',
          dailyItinerary: [
            {
              day: 1,
              activities: [
                { time: '08:00-21:00', title: '上海迪士尼乐园', description: '全天游览迪士尼乐园' }
              ]
            },
            {
              day: 2,
              activities: [
                { time: '10:00-12:00', title: '外滩', description: '观赏黄浦江两岸风光' },
                { time: '12:00-14:00', title: '午餐', description: '南京路步行街品尝美食' },
                { time: '14:00-17:00', title: '上海博物馆', description: '参观中国古代艺术' }
              ]
            }
          ],
          createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'plan_003',
          title: '杭州西湖一日游',
          destination: '杭州',
          startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          days: 1,
          people: 2,
          budget: 1500,
          status: 'planned',
          overview: '西湖十景，断桥残雪，雷峰塔等景点游览',
          dailyItinerary: [
            {
              day: 1,
              activities: [
                { time: '09:00-11:00', title: '断桥残雪', description: '西湖著名景点' },
                { time: '11:00-13:00', title: '白堤漫步', description: '观赏西湖风光' },
                { time: '13:00-14:30', title: '午餐', description: '楼外楼品尝杭帮菜' },
                { time: '15:00-17:00', title: '雷峰塔', description: '登高远眺西湖全景' },
                { time: '17:00-19:00', title: '西湖夜游', description: '欣赏西湖夜景' }
              ]
            }
          ],
          createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    },
    
    // 生成新的旅行计划
    async generateTravelPlan(travelRequest) {
      this.loading = true;
      try {
        // 模拟API调用
        return new Promise((resolve) => {
          setTimeout(() => {
            // 模拟生成的旅行计划
            const newPlan = this.generateMockPlan(travelRequest);
            
            // 更新状态
            this.currentPlan = newPlan;
            this.planList.unshift(newPlan);
            
            // 保存到本地存储
            localStorage.setItem('travelPlans', JSON.stringify(this.planList));
            
            ElMessage.success('旅行计划生成成功');
            resolve(newPlan);
          }, 2000);
        });
      } catch (error) {
        console.error('生成旅行计划失败:', error);
        ElMessage.error('生成计划失败，请稍后重试');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 生成模拟的旅行计划
    generateMockPlan(request) {
      const today = new Date();
      const startDate = request.startDate || today.toISOString().split('T')[0];
      const days = request.days || 3;
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      
      const destinations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '西安'];
      const destination = request.destination || destinations[Math.floor(Math.random() * destinations.length)];
      
      // 生成每日行程
      const dailyItinerary = [];
      for (let i = 1; i <= days; i++) {
        const activities = this.generateDailyActivities(i, days);
        dailyItinerary.push({
          day: i,
          activities: activities
        });
      }
      
      return {
        id: 'plan_' + Date.now(),
        title: `${destination}${days}日游`,
        destination: destination,
        startDate: startDate,
        endDate: endDate.toISOString().split('T')[0],
        days: days,
        people: request.people || 2,
        budget: request.budget || days * 1500,
        status: 'planned',
        overview: `${destination}经典景点游览，共${days}天行程，适合${request.people || 2}人，预算约${request.budget || days * 1500}元`,
        dailyItinerary: dailyItinerary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },
    
    // 生成每日活动
    generateDailyActivities(day, totalDays) {
      const activitiesList = [
        { time: '09:00-11:00', title: '景点游览', description: '参观当地著名景点' },
        { time: '11:00-12:30', title: '自由活动', description: '休息和拍照' },
        { time: '12:30-14:00', title: '午餐', description: '品尝当地特色美食' },
        { time: '14:00-16:30', title: '文化体验', description: '了解当地文化和历史' },
        { time: '16:30-18:00', title: '购物', description: '购买当地特产' },
        { time: '18:30-20:00', title: '晚餐', description: '享用晚餐' }
      ];
      
      // 根据天数调整活动安排
      if (day === 1) {
        return [
          { time: '09:00-10:30', title: '抵达目的地', description: '入住酒店，稍作休息' },
          ...activitiesList.slice(2, 6)
        ];
      } else if (day === totalDays) {
        return [
          ...activitiesList.slice(0, 4),
          { time: '16:30-18:00', title: '返程准备', description: '整理行李，准备返程' }
        ];
      }
      
      // 中间天数的活动
      return activitiesList;
    },
    
    // 获取计划详情
    async getPlanDetail(planId) {
      try {
        const plan = this.planList.find(p => p.id === planId);
        if (plan) {
          this.currentPlan = plan;
          return plan;
        } else {
          ElMessage.warning('未找到该旅行计划');
          return null;
        }
      } catch (error) {
        console.error('获取计划详情失败:', error);
        ElMessage.error('获取详情失败，请稍后重试');
        return null;
      }
    },
    
    // 更新旅行计划
    async updateTravelPlan(planId, updatedData) {
      this.loading = true;
      try {
        const index = this.planList.findIndex(p => p.id === planId);
        if (index !== -1) {
          // 更新计划数据
          this.planList[index] = {
            ...this.planList[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
          };
          
          // 如果是当前计划，同时更新当前计划
          if (this.currentPlan && this.currentPlan.id === planId) {
            this.currentPlan = this.planList[index];
          }
          
          // 保存到本地存储
          localStorage.setItem('travelPlans', JSON.stringify(this.planList));
          
          ElMessage.success('旅行计划更新成功');
          return this.planList[index];
        } else {
          ElMessage.warning('未找到该旅行计划');
          return null;
        }
      } catch (error) {
        console.error('更新旅行计划失败:', error);
        ElMessage.error('更新失败，请稍后重试');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 删除旅行计划
    async deleteTravelPlan(planId) {
      this.loading = true;
      try {
        const index = this.planList.findIndex(p => p.id === planId);
        if (index !== -1) {
          // 删除计划
          this.planList.splice(index, 1);
          
          // 如果删除的是当前计划，清空当前计划
          if (this.currentPlan && this.currentPlan.id === planId) {
            this.currentPlan = null;
          }
          
          // 保存到本地存储
          localStorage.setItem('travelPlans', JSON.stringify(this.planList));
          
          ElMessage.success('旅行计划删除成功');
          return true;
        } else {
          ElMessage.warning('未找到该旅行计划');
          return false;
        }
      } catch (error) {
        console.error('删除旅行计划失败:', error);
        ElMessage.error('删除失败，请稍后重试');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 设置搜索条件
    setSearchFilters(filters) {
      this.searchFilters = { ...this.searchFilters, ...filters };
    },
    
    // 清除搜索条件
    clearSearchFilters() {
      this.searchFilters = {
        destination: '',
        startDate: '',
        endDate: '',
        status: ''
      };
    },
    
    // 保存旅行计划
    async saveCurrentPlan() {
      try {
        if (this.currentPlan) {
          // 检查是否已存在
          const existingIndex = this.planList.findIndex(p => p.id === this.currentPlan.id);
          
          if (existingIndex !== -1) {
            // 更新现有计划
            return this.updateTravelPlan(this.currentPlan.id, this.currentPlan);
          } else {
            // 添加新计划
            this.planList.unshift(this.currentPlan);
            localStorage.setItem('travelPlans', JSON.stringify(this.planList));
            ElMessage.success('旅行计划保存成功');
            return this.currentPlan;
          }
        } else {
          ElMessage.warning('没有可保存的旅行计划');
          return null;
        }
      } catch (error) {
        console.error('保存旅行计划失败:', error);
        ElMessage.error('保存失败，请稍后重试');
        throw error;
      }
    },
    
    // 分享旅行计划
    async shareTravelPlan(planId) {
      try {
        // 模拟分享功能
        ElMessage.success('旅行计划分享链接已复制到剪贴板');
        // 实际应用中，这里应该调用分享API获取分享链接
        return `https://aitravel.example.com/share/${planId}`;
      } catch (error) {
        console.error('分享旅行计划失败:', error);
        ElMessage.error('分享失败，请稍后重试');
        throw error;
      }
    },
    
    // 设置计划状态
    async setPlanStatus(planId, status) {
      try {
        return this.updateTravelPlan(planId, { status });
      } catch (error) {
        console.error('更新计划状态失败:', error);
        ElMessage.error('更新状态失败，请稍后重试');
        throw error;
      }
    }
  }
});