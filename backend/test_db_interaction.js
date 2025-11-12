const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('开始测试Supabase数据库交互...');
console.log(`Supabase URL: ${supabaseUrl}`);

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseInteraction() {
  try {
    console.log('\n1. 测试基本连接...');
    
    // 测试1: 基本的网络连接性
    console.log('测试网络连接性...');
    const { error: networkError } = await supabase.rpc('now');
    if (networkError) {
      console.log(`RPC调用失败，但这可能是正常的(没有now函数): ${networkError.message}`);
    } else {
      console.log('RPC调用成功');
    }
    
    // 测试2: 尝试查询auth.users表（即使不存在也可以验证连接）
    console.log('\n测试2: 查询auth.users表...');
    const { data: usersData, error: usersError } = await supabase.from('auth.users').select('*').limit(1);
    
    if (usersError) {
      console.log(`查询auth.users失败(可能表不存在): ${usersError.message}`);
      console.log(`错误代码: ${usersError.code}`);
    } else {
      console.log(`查询auth.users成功，返回行数: ${usersData ? usersData.length : 0}`);
    }
    
    // 测试3: 尝试创建一个简单的表（使用REST API方式）
    console.log('\n测试3: 尝试通过REST API创建表...');
    try {
      // Supabase会在首次插入时自动创建表
      const testData = {
        name: '测试计划',
        destination: '北京',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      console.log('尝试插入测试数据...');
      const { data: insertData, error: insertError } = await supabase.from('travel_plans').insert([testData]);
      
      if (insertError) {
        console.log(`插入失败: ${insertError.message}`);
        console.log(`错误代码: ${insertError.code}`);
        
        // 检查是否是权限问题
        if (insertError.code === '403') {
          console.log('可能是权限不足，请检查Supabase密钥权限');
        } else if (insertError.code === 'PGRST205') {
          console.log('表或函数不存在');
        }
      } else {
        console.log('插入成功! 返回数据:', insertData);
        
        // 如果插入成功，尝试查询
        console.log('\n尝试查询刚插入的数据...');
        const { data: selectData, error: selectError } = await supabase.from('travel_plans').select('*');
        if (selectError) {
          console.log(`查询失败: ${selectError.message}`);
        } else {
          console.log(`查询成功，返回行数: ${selectData ? selectData.length : 0}`);
          if (selectData && selectData.length > 0) {
            console.log('查询结果示例:', JSON.stringify(selectData[0], null, 2));
          }
        }
      }
    } catch (apiError) {
      console.log(`API操作异常: ${apiError.message}`);
    }
    
    // 测试4: 检查Supabase认证状态
    console.log('\n测试4: 检查Supabase认证状态...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log(`获取会话失败: ${sessionError.message}`);
    } else {
      console.log(`认证状态: ${sessionData.session ? '已认证' : '未认证'}`);
      if (sessionData.session) {
        console.log(`用户ID: ${sessionData.session.user.id}`);
      }
    }
    
    console.log('\n数据库交互测试完成!');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 执行测试
testDatabaseInteraction();