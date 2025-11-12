const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('开始测试connection_test表数据检索...');
console.log(`Supabase URL: ${supabaseUrl}`);

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnectionTable() {
  try {
    console.log('\n1. 测试连接到connection_test表...');
    
    // 查询connection_test表中的所有数据
    console.log('正在查询connection_test表中的数据...');
    const { data, error, status, statusText } = await supabase
      .from('connection_test')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('查询失败!');
      console.error(`错误信息: ${error.message}`);
      console.error(`错误代码: ${error.code}`);
      console.error(`HTTP状态码: ${status}`);
      console.error(`状态描述: ${statusText}`);
      
      // 分析常见错误类型
      if (error.code === 'PGRST205') {
        console.log('\n可能的原因:');
        console.log('1. connection_test表可能不存在');
        console.log('2. 表名拼写错误');
        console.log('3. 权限不足，无法访问该表');
      } else if (error.code === '403') {
        console.log('\n可能的原因:');
        console.log('1. Supabase密钥权限不足');
        console.log('2. API密钥已过期');
        console.log('3. 网络策略限制了访问');
      }
      
      return;
    }
    
    console.log('\n查询成功!');
    console.log(`找到 ${data.length} 条记录:`);
    console.log('----------------------------------------');
    
    // 格式化输出每条记录
    data.forEach((record, index) => {
      console.log(`\n记录 ${index + 1}:`);
      console.log(`- ID: ${record.id}`);
      console.log(`- 测试名称: ${record.test_name}`);
      console.log(`- 测试值: ${record.test_value}`);
      console.log(`- 创建时间: ${record.created_at}`);
      console.log(`- 更新时间: ${record.updated_at}`);
      console.log(`- 是否激活: ${record.is_active ? '是' : '否'}`);
    });
    
    console.log('----------------------------------------');
    console.log('\n2. 测试条件查询...');
    
    // 测试按条件筛选
    const { data: activeData } = await supabase
      .from('connection_test')
      .select('*')
      .eq('is_active', true);
    
    console.log(`\n激活状态的记录数: ${activeData.length}`);
    
    // 测试模糊查询
    const { data: searchData } = await supabase
      .from('connection_test')
      .select('*')
      .ilike('test_name', '%测试%');
    
    console.log(`名称包含"测试"的记录数: ${searchData.length}`);
    
    console.log('\n3. 测试性能指标...');
    
    // 测试查询性能
    console.time('查询性能测试');
    await supabase.from('connection_test').select('*');
    console.timeEnd('查询性能测试');
    
    console.log('\n✅ 连接测试表数据检索测试完成!');
    
  } catch (error) {
    console.error('\n测试过程中发生异常:', error.message);
    console.error('异常堆栈:', error.stack);
  }
}

// 执行测试
testConnectionTable();