const axios = require('axios');
const { randomBytes } = require('crypto');

// 测试配置
const BASE_URL = 'http://localhost:3000/api/auth'; // 后端API运行在3000端口
const TEST_EMAIL = `test-${randomBytes(8).toString('hex')}@example.com`;
const TEST_PASSWORD = 'Test@123456';
const TEST_NICKNAME = 'TestUser';

console.log('开始测试认证功能...');
console.log(`测试邮箱: ${TEST_EMAIL}`);

// 测试注册功能
async function testRegister() {
  console.log('\n=== 测试注册功能 ===');
  try {
    const response = await axios.post(`${BASE_URL}/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      nickname: TEST_NICKNAME
    });
    
    console.log('✅ 注册成功:', response.status);
    console.log('返回数据:', {
      user: {
        user_id: response.data.data?.user?.user_id,
        email: response.data.data?.user?.email,
        nickname: response.data.data?.user?.nickname
      },
      hasToken: !!response.data.data?.token,
      hasAccessToken: !!response.data.data?.access_token,
      status: response.data.status
    });
    
    return {
      success: true,
      user: response.data.data?.user,
      token: response.data.data?.token
    };
  } catch (error) {
    console.error('❌ 注册失败详细信息:', { 
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// 测试登录功能
async function testLogin() {
  console.log('\n=== 测试登录功能 ===');
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('✅ 登录成功:', response.status);
    console.log('返回数据:', {
      user: {
        user_id: response.data.data?.user?.user_id,
        email: response.data.data?.user?.email,
        nickname: response.data.data?.user?.nickname
      },
      hasToken: !!response.data.data?.token,
      hasAccessToken: !!response.data.data?.access_token,
      status: response.data.status
    });
    
    return {
      success: true,
      user: response.data.data?.user,
      token: response.data.data?.token,
      accessToken: response.data.data?.access_token
    };
  } catch (error) {
    console.error('❌ 登录失败详细信息:', { 
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// 测试获取当前用户信息
async function testGetCurrentUser(token) {
  console.log('\n=== 测试获取当前用户信息 ===');
  try {
    const response = await axios.get(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取用户信息成功:', response.status);
    console.log('用户信息:', {
      user_id: response.data.data?.user?.user_id,
      email: response.data.data?.user?.email,
      nickname: response.data.data?.user?.nickname
    });
    
    return { success: true, user: response.data.data?.user };
  } catch (error) {
    console.error('❌ 获取用户信息失败详细信息:', { 
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// 主测试函数
async function runTests() {
  console.log('🔄 开始执行认证功能测试套件...');
  
  try {
    // 1. 测试注册
    const registerResult = await testRegister();
    if (!registerResult.success) {
      console.log('❌ 测试套件失败：注册功能未通过');
      return;
    }
    
    // 2. 测试登录
    const loginResult = await testLogin();
    if (!loginResult.success) {
      console.log('❌ 测试套件失败：登录功能未通过');
      return;
    }
    
    // 3. 测试获取当前用户信息
    const userInfoResult = await testGetCurrentUser(loginResult.token);
    if (!userInfoResult.success) {
      console.log('❌ 测试套件失败：获取用户信息功能未通过');
      return;
    }
    
    // 验证用户信息一致性
    if (userInfoResult.user.email !== TEST_EMAIL) {
      console.error('❌ 用户邮箱不一致');
      return;
    }
    
    console.log('\n🎉 所有认证功能测试通过！');
  } catch (error) {
    console.error('\n❌ 测试套件执行过程中发生异常:', error);
  }
}

// 运行测试
runTests().then(() => {
  console.log('\n🔚 测试完成');
});