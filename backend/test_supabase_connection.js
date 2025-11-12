// 简单的Supabase连接测试脚本
require('dotenv').config({ override: true });

const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://uymnnucipjjmruxcvuis.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('=== Supabase连接测试 ===');
console.log('URL:', supabaseUrl);
console.log('ANON_KEY前缀:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 50) + '...' : '未设置');
console.log('SERVICE_ROLE_KEY前缀:', SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.substring(0, 50) + '...' : '未设置');
console.log('SUPABASE_KEY前缀:', SUPABASE_KEY ? SUPABASE_KEY.substring(0, 50) + '...' : '未设置');

// 测试不同的密钥组合
async function testConnection(url, key, keyType) {
  console.log(`\n=== 测试 ${keyType} ===`);
  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: false
      },
      fetch: {
        timeout: 10000
      }
    });
    
    console.log('客户端创建成功');
    
    // 尝试一个简单的查询
    console.log('尝试简单查询...');
    const { data, error } = await client.from('auth.users').select('id').limit(1);
    
    if (error) {
      console.log(`查询结果: 失败 - ${error.message}`);
      console.log('错误详情:', error);
      return false;
    } else {
      console.log(`查询结果: 成功 - 返回了 ${data.length} 条记录`);
      return true;
    }
  } catch (error) {
    console.log(`连接异常: ${error.message}`);
    return false;
  }
}

// 测试所有可用的密钥
async function runTests() {
  let success = false;
  
  if (SUPABASE_ANON_KEY) {
    success = await testConnection(supabaseUrl, SUPABASE_ANON_KEY, 'ANON_KEY');
    if (success) return;
  }
  
  if (SUPABASE_KEY && SUPABASE_KEY !== SUPABASE_ANON_KEY) {
    success = await testConnection(supabaseUrl, SUPABASE_KEY, 'SUPABASE_KEY');
    if (success) return;
  }
  
  if (SUPABASE_SERVICE_ROLE_KEY) {
    success = await testConnection(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY, 'SERVICE_ROLE_KEY');
    if (success) return;
  }
  
  console.log('\n=== 所有连接测试都失败 ===');
  console.log('请检查以下几点:');
  console.log('1. 确认URL正确: https://uymnnucipjjmruxcvuis.supabase.co');
  console.log('2. 确认密钥有效且未过期');
  console.log('3. 确认密钥与项目URL匹配');
  console.log('4. 检查网络连接是否正常');
}

runTests().catch(err => {
  console.error('测试过程中发生异常:', err);
});