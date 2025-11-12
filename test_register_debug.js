const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 生成随机邮箱和用户名用于测试
const randomEmail = `test_register_${Date.now()}@example.com`;
const randomNickname = `测试用户${Date.now().toString().slice(-4)}`;
const password = 'Test@12345';

console.log(`=== 开始注册功能调试测试 ===`);
console.log(`测试邮箱: ${randomEmail}`);
console.log(`测试用户名: ${randomNickname}`);

// 测试函数
async function runRegisterTest() {
  try {
    // 1. 发送注册请求
    console.log('\n1. 发送注册请求...');
    console.log('注册参数:', { email: randomEmail, nickname: randomNickname, password: '******' });
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: randomEmail,
      nickname: randomNickname,
      password: password
    });
    
    console.log('\n2. 注册响应:', JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.data.success) {
      console.log('\n✅ 注册成功！');
      
      // 3. 尝试使用注册的账号登录
      console.log('\n3. 尝试使用注册的账号登录...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: randomEmail,
        password: password
      });
      
      console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
      
      if (loginResponse.data.success) {
        console.log('\n✅ 登录成功！');
        console.log('\n=== 测试总结 ===');
        console.log('注册和登录功能均正常工作');
        console.log(`\n请在浏览器中使用以下凭据测试:`);
        console.log(`邮箱: ${randomEmail}`);
        console.log(`用户名: ${randomNickname}`);
        console.log(`密码: ${password}`);
      } else {
        console.error('\n❌ 登录失败:', loginResponse.data.error || '未知错误');
      }
    } else {
      console.error('\n❌ 注册失败:', registerResponse.data.error || registerResponse.data.message || '未知错误');
      console.log('\n请检查以下内容:');
      console.log('1. 后端服务是否正常运行');
      console.log('2. 数据库连接是否正常');
      console.log('3. 注册参数是否符合要求（用户名2-20字符，密码至少6位）');
    }
    
    // 保存测试凭据到文件
    const testCredentials = {
      email: randomEmail,
      nickname: randomNickname,
      password: password,
      timestamp: new Date().toISOString(),
      success: registerResponse.data.success
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'last_register_test.json'),
      JSON.stringify(testCredentials, null, 2)
    );
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 执行测试
runRegisterTest();