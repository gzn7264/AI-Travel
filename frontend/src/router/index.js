import { createRouter, createWebHistory } from 'vue-router';

// 导入页面组件
const LoginView = () => import('../views/LoginView.vue');
const RegisterView = () => import('../views/RegisterView.vue');
const HomeView = () => import('../views/HomeView.vue');
const MyPlansView = () => import('../views/MyPlansView.vue');
const ProfileView = () => import('../views/ProfileView.vue');

// 路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'AI旅行规划师 - 首页',
      requiresAuth: false
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: 'AI旅行规划师 - 登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      title: 'AI旅行规划师 - 注册',
      requiresAuth: false
    }
  },
  {
    path: '/my-plans',
    name: 'my-plans',
    component: MyPlansView,
    meta: {
      title: 'AI旅行规划师 - 我的旅行计划',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      title: 'AI旅行规划师 - 个人中心',
      requiresAuth: true
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/'
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫 - 处理页面标题和登录验证
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || 'AI旅行规划师';
  
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      // 如果没有登录，跳转到登录页
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      });
    } else {
      // 检查用户信息是否存在
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) {
        // 如果用户信息不存在，清除token并跳转到登录页
        localStorage.removeItem('token');
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        });
      } else {
        // 登录状态有效，继续访问
        next();
      }
    }
  } else {
    // 不需要登录的页面，直接访问
    next();
  }
});

// 路由后置守卫 - 可以在这里添加页面访问统计等逻辑
router.afterEach((to, from) => {
  // 页面切换后的逻辑
  console.log(`从 ${from.path} 跳转到 ${to.path}`);
});

export default router;