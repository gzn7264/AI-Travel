<template>
  <div class="app-container">
    <!-- 路由视图占位符，会根据当前路由渲染对应的组件 -->
    <router-view />
  </div>
</template>

<script setup>
// 根组件，主要用于路由视图的渲染
// 具体页面内容由各个路由组件负责
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 应用容器 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 通用过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* 通用按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f5f7fa;
}

/* 通用卡片样式 */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

/* 响应式容器 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 页面间距 */
.section {
  margin-bottom: 40px;
}

/* 标题样式 */
.section-title {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
  font-weight: 500;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

/* 错误提示样式 */
.error-message {
  color: #f56c6c;
  font-size: 13px;
  margin-top: 5px;
}

/* 加载中样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .section-title {
    font-size: 1.5rem;
  }
  
  .container {
    padding: 0 15px;
  }
}
</style>
