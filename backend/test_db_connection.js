require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 直接测试Supabase连接
async function testSupabaseConnection() {
  console.log('开始直接测试Supabase连接...');
  
  try {
    // 使用配置的URL和密钥
    const supabaseUrl = 'https://uymnnucipjjmruxcvuis.supabase.co'; // 固定URL
    const supabaseKey = process.env.SUPABASE_KEY;
    
    console.log('使用的配置:');
    console.log('- URL:', supabaseUrl);
    console.log('- 是否有密钥:', !!supabaseKey);
    
    if (!supabaseKey) {
      console.error('错误: 未找到SUPABASE_KEY环境变量');
      return;
    }
    
    // 创建客户端
    console.log('正在创建Supabase客户端...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 测试简单查询 - 尝试获取用户表
    console.log('正在执行简单查询测试...');
    try {
      // 尝试列出表，这是一个只读操作，不会修改数据
      const { data: schemaData, error: schemaError } = await supabase.rpc('pg_catalog.pg_tables', {
        schemaname: 'public'
      });
      
      if (schemaError) {
        console.log('列出表失败:', schemaError.message);
        // 尝试一个更简单的查询
        console.log('尝试更简单的查询...');
        const { data: simpleData, error: simpleError } = await supabase.from('auth.users').select('id').limit(1);
        
        if (simpleError) {
          console.log('简单查询也失败:', simpleError.message);
          console.log('错误代码:', simpleError.code);
          
          // 尝试直接测试认证
          console.log('尝试测试认证功能...');
          try {
            const authResponse = await supabase.auth.getSession();
            console.log('认证测试响应:', authResponse);
          } catch (authError) {
            console.log('认证测试失败:', authError.message);
          }
        } else {
          console.log('简单查询成功! 返回数据:', simpleData);
        }
      } else {
        console.log('成功获取到表列表! 找到', schemaData.length, '个表');
        console.log('表名列表:', schemaData.map(table => table.tablename).join(', '));
      }
      
    } catch (queryError) {
      console.error('查询执行过程中出错:', queryError.message);
    }
    
    // 测试网络连接性
    console.log('测试网络连接性...');
    try {
      const response = await fetch(supabaseUrl + '/rest/v1/', {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      console.log('HTTP状态码:', response.status);
      console.log('HTTP状态文本:', response.statusText);
    } catch (fetchError) {
      console.error('网络连接测试失败:', fetchError.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testSupabaseConnection();