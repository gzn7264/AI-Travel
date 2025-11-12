const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 生成随机邮箱用于测试
const randomEmail = `test${Date.now()}@example.com`;
const password = 'Test@12345';

console.log(`=== 开始登录问题调试测试 ===`);
console.log(`测试邮箱: ${randomEmail}`);

// 测试函数
async function runTests() {
  try {
    // 1. 注册新用户
    console.log('\n1. 注册新用户...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: randomEmail,
      password: password,
      nickname: '测试用户123'  // 使用nickname字段，符合2-20字符要求
    });
    console.log('注册响应:', JSON.stringify(registerResponse.data, null, 2));
    
    if (!registerResponse.data.success) {
      console.error('注册失败:', registerResponse.data.error);
      return;
    }
    
    // 2. 直接调用登录API进行测试
    console.log('\n2. 直接调用登录API测试...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: randomEmail,
      password: password
    });
    console.log('登录API响应:', JSON.stringify(loginResponse.data, null, 2));
    
    // 3. 测试错误密码登录
    console.log('\n3. 测试错误密码登录...');
    try {
      const wrongPassResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: randomEmail,
        password: 'WrongPassword123'
      });
      console.log('错误密码登录响应:', JSON.stringify(wrongPassResponse.data, null, 2));
    } catch (error) {
      console.log('预期的错误密码登录失败:', error.response?.data || error.message);
    }
    
    console.log('\n=== 调试信息 ===');
    console.log('请在浏览器中使用以下凭据尝试登录:');
    console.log(`邮箱: ${randomEmail}`);
    console.log(`密码: ${password}`);
    console.log('请打开浏览器开发者工具的控制台，查看前端登录过程中的详细日志');
    
    // 保存测试凭据到文件，方便用户复制
    const testCredentials = {
      email: randomEmail,
      password: password,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'last_test_credentials.json'),
      JSON.stringify(testCredentials, null, 2)
    );
    
    console.log('\n测试凭据已保存到 last_test_credentials.json 文件中');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 执行测试
runTests();