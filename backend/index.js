const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/authRoutes');
const travelPlanRoutes = require('./routes/travelPlanRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

// 导入数据库初始化
const { initializeDatabase, testConnection } = require('./utils/dbInitializer');
// 导入supabase模拟模式配置
const { isSimulated: isSupabaseSimulated } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/plans', travelPlanRoutes);
app.use('/api/expenses', expenseRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: 'AI旅行规划师后端API服务正在运行',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      plans: '/api/plans/*'
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * 启动服务器
 */
async function startServer() {
  // 合并所有可能的模拟模式标志
  let dbSimulatedMode = isSupabaseSimulated;
  
  try {
    // 初始化数据库（在模拟模式下跳过实际初始化）
    if (!isSupabaseSimulated) {
      // 测试数据库连接
      console.log('正在测试数据库连接...');
      const connectionResult = await testConnection();
      
      if (!connectionResult.success) {
        console.warn('数据库连接失败，将以模拟模式运行:', connectionResult.error);
        dbSimulatedMode = true;
      }
      
      // 初始化数据库表结构
      console.log('正在初始化数据库表结构...');
      const initResult = await initializeDatabase();
      
      if (!initResult.success) {
        console.warn('数据库初始化失败，将以模拟模式运行:', initResult.error);
        dbSimulatedMode = true;
      }
    } else {
      console.warn('由于Supabase配置无效，系统将直接以模拟模式运行');
      dbSimulatedMode = true;
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`API文档地址: http://localhost:${PORT}/api`);
      if (dbSimulatedMode) {
        console.log('⚠️  注意: 系统以模拟模式运行，所有数据将在内存中临时存储');
      }
    });
  } catch (error) {
    console.error('服务器启动过程中出错:', error);
    console.warn('将尝试以模拟模式启动服务器...');
    
    // 无论如何都启动服务器，但以模拟模式运行
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`API文档地址: http://localhost:${PORT}/api`);
      console.log('⚠️  注意: 系统以模拟模式运行，所有数据将在内存中临时存储');
    });
  }
  
  return app; // 返回app实例，方便测试
  }

// 启动服务器
startServer();

module.exports = app;