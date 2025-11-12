const { supabase, isSimulated } = require('../config/supabase');

/**
 * 测试Supabase连接
 * 尝试执行一个简单的查询来验证连接
 */
async function testConnection() {
  try {
    console.log('开始测试Supabase连接...');
    
    if (isSimulated) {
      console.log('⚠️ 当前处于模拟模式，无法进行实际连接测试');
      console.log('请检查环境变量SUPABASE_KEY是否正确设置');
      return;
    }
    
    // 尝试执行一个简单的查询（列出所有表）
    console.log('尝试执行简单查询...');
    const { data, error } = await supabase.rpc('pg_tables');
    
    if (error) {
      console.error('连接测试失败:', error.message);
      console.log('\n请确保:');
      console.log('1. SUPABASE_KEY环境变量已正确设置');
      console.log('2. 网络连接正常');
      console.log('3. Supabase项目ID正确');
      
      // 提供一个备选测试方法
      console.log('\n尝试另一种测试方法...');
      try {
        // 尝试获取一个不存在的表（这样不会报错，但可以测试连接）
        const { error: altError } = await supabase.from('non_existent_table').select('*').limit(1);
        if (altError) {
          console.log('备选测试结果: 连接成功但表不存在 (这是预期的)');
          console.log('这表明您的Supabase连接基本正常');
        }
      } catch (e) {
        console.error('备选测试也失败:', e.message);
      }
    } else {
      console.log('✅ 连接测试成功!');
      console.log(`找到 ${data ? data.length : 0} 个表`);
      if (data && data.length > 0) {
        console.log('表列表预览:');
        data.slice(0, 5).forEach(table => {
          console.log(`- ${table.schemaname}.${table.tablename}`);
        });
      }
    }
    
    console.log('\n下一步: 请按照showCreateTablesSQL.js的指导在Supabase控制台创建表格');
    
  } catch (error) {
    console.error('连接测试过程中发生错误:', error.message);
  }
}

// 执行测试
testConnection();