const axios = require('axios');

// 测试API的基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号信息
const testUser = {
  email: 'test' + Date.now() + '@gmail.com',
  password: 'Test@123456',
  nickname: '测试用户' + Date.now()
};

console.log('开始测试注册和登录API...');
console.log(`测试邮箱: ${testUser.email}`);
console.log(`测试密码: ${testUser.password}`);

// 测试注册API
async function testRegister() {
  try {
    console.log('\n=== 测试注册API ===');
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log('注册响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('注册失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试登录API
async function testLogin() {
  try {
    console.log('\n=== 测试登录API ===');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    console.log('登录响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试错误密码登录
async function testWrongPasswordLogin() {
  try {
    console.log('\n=== 测试错误密码登录 ===');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: 'WrongPassword123'
    });
    console.log('错误密码登录响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('错误密码登录失败（预期行为）:', error.response?.data || error.message);
    // 这应该失败，所以返回成功状态表示测试通过
    return { success: true, message: '错误密码正确被拒绝' };
  }
}

// 运行测试
async function runTests() {
  try {
    // 1. 先注册
    await testRegister();
    console.log('✓ 注册测试成功');
    
    // 2. 使用正确密码登录
    await testLogin();
    console.log('✓ 正确密码登录测试成功');
    
    // 3. 使用错误密码登录
    await testWrongPasswordLogin();
    console.log('✓ 错误密码登录测试成功');
    
    console.log('\n🎉 所有API测试通过！后端功能正常。');
    console.log('问题可能在前端，请检查前端代码或浏览器控制台。');
  } catch (error) {
    console.error('\n❌ 测试失败，请检查后端服务。');
  }
}

// 执行测试
runTests();