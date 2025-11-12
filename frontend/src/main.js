import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'

// 导入RecorderManager
import './assets/recorder/RecorderManager.js'

const app = createApp(App)

// 创建Pinia实例
const pinia = createPinia()

// 使用插件
app.use(ElementPlus)
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')
