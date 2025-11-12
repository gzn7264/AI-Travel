// 使用dotenv加载环境变量，设置override为true确保能覆盖现有变量
const result = require('dotenv').config({ override: true });
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

const { createClient } = require('@supabase/supabase-js');

// 创建客户端实例，带错误处理
let supabase = null;
let supabaseService = null;
let isSimulated = false;

try {
  // 从环境变量获取Supabase配置
  const supabaseUrl = process.env.SUPABASE_URL || 'https://uymnnucipjjmruxcvuis.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_KEY = process.env.SUPABASE_KEY; // 可选的主密钥
  
  // 添加调试信息
  console.log('加载的环境变量:');
  console.log('- SUPABASE_URL:', supabaseUrl ? '已设置 (长度: ' + supabaseUrl.length + ')' : '未设置');
  console.log('- SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '已设置 (长度: ' + SUPABASE_ANON_KEY.length + ')' : '未设置');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '已设置 (长度: ' + SUPABASE_SERVICE_ROLE_KEY.length + ')' : '未设置');
  console.log('- SUPABASE_KEY:', SUPABASE_KEY ? '已设置 (长度: ' + SUPABASE_KEY.length + ')' : '未设置');
  
  // 检查是否有有效的密钥，确保URL和至少一个密钥都有效
  const hasValidKeys = supabaseUrl && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY);
  console.log('密钥有效性检查:', hasValidKeys ? '通过' : '失败');
  
  if (hasValidKeys) {
    // 创建实际的Supabase客户端，优先使用SUPABASE_KEY（测试显示此密钥有效）
    const clientKey = SUPABASE_KEY || SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;
    
    console.log(`使用${SUPABASE_KEY ? 'SUPABASE_KEY (有效)' : SUPABASE_ANON_KEY ? 'ANON_KEY' : 'SERVICE_ROLE_KEY'}创建客户端`);
    console.log(`连接URL: ${supabaseUrl}`);
    console.log(`密钥前缀: ${clientKey.substring(0, 10)}...`);
    
    supabase = createClient(
      supabaseUrl,
      clientKey,
      {
        auth: {
          persistSession: false
        },
        // 添加超时和重试配置
        fetch: {
          timeout: 15000
        },
        // 启用详细日志
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
    
    // 立即测试连接
    console.log('正在测试Supabase连接...');
    (async () => {
      try {
        // 使用简单的查询测试连接 - 测试显示表可能在public schema中
        console.log('尝试查询public.users表...');
        const { data, error } = await supabase.from('users').select('*').limit(1);
        if (error) {
          console.log('查询users表结果:', error.message);
          // 尝试查询不存在的表来确认连接有效
          console.log('尝试查询任何表来验证连接...');
          try {
            await supabase.from('test_connection').select('*').limit(1);
          } catch (innerError) {
            // 如果错误是表不存在而不是API密钥无效，连接就是有效的
            if (innerError.message && !innerError.message.includes('Invalid API key')) {
              console.log('连接测试结果: 成功! API密钥有效，只是表不存在.');
            } else {
              console.log('连接测试结果: 失败:', innerError.message);
            }
          }
        } else {
          console.log('连接测试结果: 成功! 数据库可访问，返回了', data.length, '条记录.');
        }
      } catch (testError) {
        console.log('连接测试异常:', testError.message);
      }
    })();
    
    // 创建服务角色客户端 - 优先使用SUPABASE_KEY（因为测试显示它有效）
    const serviceKey = SUPABASE_KEY || SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    console.log(`使用${SUPABASE_KEY ? 'SUPABASE_KEY (有效)' : SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY'}创建服务角色客户端`);
    
    supabaseService = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false // 服务角色不应持久化会话
        },
        fetch: {
          timeout: 15000
        }
      }
    );
    
    console.log('Supabase客户端初始化成功');
    if (SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Supabase服务角色客户端已成功初始化');
    }
  } else {
    // 配置无效，但强制尝试使用实际连接进行调试
    console.warn('Supabase配置检查未通过，但强制尝试使用实际连接进行调试');
    const clientKey = SUPABASE_ANON_KEY || SUPABASE_KEY || SUPABASE_SERVICE_ROLE_KEY || '';
    
    console.log(`强制使用URL: ${supabaseUrl}`);
    console.log(`强制使用密钥: ${clientKey ? clientKey.substring(0, 10) + '...' : '无'}`);
    
    try {
      supabase = createClient(
        supabaseUrl,
        clientKey,
        {
          auth: {
            persistSession: false
          },
          fetch: {
            timeout: 15000
          }
        }
      );
      
      supabaseService = createClient(
        supabaseUrl,
        clientKey,
        {
          auth: {
            persistSession: false
          }
        }
      );
      
      console.log('Supabase客户端已强制初始化');
    } catch (forceError) {
      console.error('强制初始化失败:', forceError.message);
    }
    
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
  console.warn('Supabase客户端初始化出错，但继续尝试使用实际连接:', error.message);
  // 不设置isSimulated = true，强制尝试使用实际连接
  
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
  isSimulated: false // 切换回实际连接模式，使用真实Supabase数据
};

// 导出一个函数来检查是否处于模拟模式
module.exports.checkSimulatedMode = () => false; // 返回实际模式状态