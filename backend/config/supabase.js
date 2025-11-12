require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 创建客户端实例，带错误处理
let supabase = null;
let supabaseService = null;
let isSimulated = false;

try {
  // 检查环境变量是否有效
  const supabaseUrl = 'https://uymnnucipjjmruxcvuis.supabase.co'; // 固定的URL
  const isValidUrl = true; // 已知URL有效
  
  // 更新为使用单一的SUPABASE_KEY环境变量
  const hasValidKeys = process.env.SUPABASE_KEY;
  
  if (isValidUrl && hasValidKeys) {
    // 创建实际的Supabase客户端
    supabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_KEY
    );
    
    supabaseService = createClient(
      supabaseUrl,
      process.env.SUPABASE_KEY // 暂时使用相同的key，生产环境应使用专用的service role key
    );
    
    console.log('Supabase客户端初始化成功');
  } else {
    // 配置无效，标记为模拟模式
    isSimulated = true;
    console.warn('Supabase配置无效，系统将以模拟模式运行');
    
    // 创建模拟客户端对象
    const createMockClient = () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                offset: () => ({
                  single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } })
                })
              })
            })
          })
        }),
        insert: () => ({
          select: () => Promise.resolve({ data: [], error: new Error('模拟模式') })
        }),
        update: () => ({
          select: () => Promise.resolve({ data: [], error: new Error('模拟模式') })
        }),
        delete: () => Promise.resolve({ error: new Error('模拟模式') }),
        match: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } })
        })
      }),
      rpc: () => Promise.resolve({ data: [], error: new Error('模拟模式') })
    });
    
    supabase = createMockClient();
    supabaseService = createMockClient();
  }
} catch (error) {
  // 捕获任何初始化错误
  isSimulated = true;
  console.warn('Supabase客户端初始化失败，系统将以模拟模式运行:', error.message);
  
  // 提供最小化的模拟客户端
  const mockClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              offset: () => ({
                single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } })
              })
            })
          })
        })
      }),
      insert: () => ({
        select: () => Promise.resolve({ data: [], error: new Error('模拟模式') })
      }),
      update: () => ({
        select: () => Promise.resolve({ data: [], error: new Error('模拟模式') })
      }),
      delete: () => Promise.resolve({ error: new Error('模拟模式') }),
      match: () => ({
        single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } })
      })
    }),
    rpc: () => Promise.resolve({ data: [], error: new Error('模拟模式') })
  };
  
  supabase = mockClient;
  supabaseService = mockClient;
}

module.exports = { 
  supabase, 
  supabaseService,
  isSimulated
};

// 导出一个函数来检查是否处于模拟模式
module.exports.checkSimulatedMode = () => isSimulated;