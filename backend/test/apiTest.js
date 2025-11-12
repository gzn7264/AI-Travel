const axios = require('axios');
const assert = require('assert');
const fs = require('fs');

// 基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试数据
const testUser = {
  email: `test_user_${Date.now()}@example.com`,
  password: 'Test@123456',
  nickname: '测试用户',
  avatar_url: 'https://example.com/avatar.jpg'
};

let testUserId = null;
let authToken = null;
let testPlanId = null;
let testNodeId = null;

// 测试结果记录
const testResults = {
  tests: [],
  passed: 0,
  failed: 0
};

/**
 * 记录测试结果
 */
function logTestResult(name, passed, error = null) {
  testResults.tests.push({
    name,
    passed,
    error: passed ? null : error
  });
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.error(`❌ ${name}: ${error.message || error}`);
  }
}

/**
 * 运行单个测试
 */
async function runTest(name, testFn) {
  try {
    await testFn();
    logTestResult(name, true);
  } catch (error) {
    logTestResult(name, false, error);
  }
}

/**
 * 生成测试报告
 */
function generateReport() {
  console.log('\n=== 测试报告 ===');
  console.log(`总测试数: ${testResults.tests.length}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  
  // 保存测试报告到文件
  const reportPath = './test_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n详细报告已保存到: ${reportPath}`);
  
  return testResults.failed === 0;
}

/**
 * 用户认证相关测试
 */
async function runAuthTests() {
  console.log('\n=== 用户认证接口测试 ===');
  
  // 注册测试
  await runTest('用户注册测试', async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.ok(response.data.data.user);
    testUserId = response.data.data.user.user_id;
  });
  
  // 登录测试
  await runTest('用户登录测试', async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.ok(response.data.data.token);
    assert.ok(response.data.data.user);
    authToken = response.data.data.token;
  });
  
  // 获取用户信息测试
  await runTest('获取用户信息测试', async () => {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.strictEqual(response.data.data.user.user_id, testUserId);
  });
  
  // 更新用户信息测试
  await runTest('更新用户信息测试', async () => {
    const response = await axios.put(`${API_BASE_URL}/auth/me`, {
      nickname: '更新后的昵称',
      avatar_url: 'https://example.com/new_avatar.jpg'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.strictEqual(response.data.data.user.nickname, '更新后的昵称');
  });
  
  // 修改密码测试
  await runTest('修改密码测试', async () => {
    const response = await axios.put(`${API_BASE_URL}/auth/password`, {
      old_password: testUser.password,
      new_password: 'NewPass@123456'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    
    // 用新密码重新登录验证
    await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: 'NewPass@123456'
    });
  });
}

/**
 * 旅行计划相关测试
 */
async function runTravelPlanTests() {
  console.log('\n=== 旅行计划接口测试 ===');
  
  // 生成旅行计划测试
  await runTest('生成旅行计划测试', async () => {
    const response = await axios.post(`${API_BASE_URL}/plans/generate`, {
      destination: '北京',
      start_date: '2024-06-01',
      end_date: '2024-06-05',
      preferences: ['美食', '文化', '购物']
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.ok(response.data.data.plan);
    assert.ok(Array.isArray(response.data.data.plan.nodes));
    assert.ok(response.data.data.plan.nodes.length > 0);
    testNodeId = response.data.data.plan.nodes[0].node_id;
  });
  
  // 保存旅行计划测试
  await runTest('保存旅行计划测试', async () => {
    const response = await axios.post(`${API_BASE_URL}/plans`, {
      plan_name: '北京五日游',
      destination: '北京',
      start_date: '2024-06-01',
      end_date: '2024-06-05',
      preferences: ['美食', '文化', '购物'],
      budget: 5000,
      currency: 'CNY',
      nodes: [{
        day: 1,
        time: '10:00',
        activity: '参观故宫',
        location: '北京市东城区景山前街4号',
        description: '参观明清两代的皇家宫殿'
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.ok(response.data.data.plan_id);
    testPlanId = response.data.data.plan_id;
  });
  
  // 获取旅行计划列表测试
  await runTest('获取旅行计划列表测试', async () => {
    const response = await axios.get(`${API_BASE_URL}/plans`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.ok(Array.isArray(response.data.data.plans));
    assert.ok(response.data.data.plans.length > 0);
  });
  
  // 获取旅行计划详情测试
  await runTest('获取旅行计划详情测试', async () => {
    const response = await axios.get(`${API_BASE_URL}/plans/${testPlanId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.strictEqual(response.data.data.plan.plan_id, testPlanId);
  });
  
  // 更新旅行计划测试
  await runTest('更新旅行计划测试', async () => {
    const response = await axios.put(`${API_BASE_URL}/plans/${testPlanId}`, {
      plan_name: '北京五日游（更新版）',
      budget: 6000
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.strictEqual(response.data.data.plan.plan_name, '北京五日游（更新版）');
  });
  
  // 获取旅行计划统计测试
  await runTest('获取旅行计划统计测试', async () => {
    const response = await axios.get(`${API_BASE_URL}/plans/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.ok(response.data.data.stats);
  });
}

/**
 * 费用管理相关测试
 */
async function runExpenseTests() {
  console.log('\n=== 费用管理接口测试 ===');
  
  // 先确保testNodeId有效，如果无效则使用一个已有的节点
  if (!testNodeId && testPlanId) {
    const planResponse = await axios.get(`${API_BASE_URL}/plans/${testPlanId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (planResponse.data.data.plan.nodes && planResponse.data.data.plan.nodes.length > 0) {
      testNodeId = planResponse.data.data.plan.nodes[0].node_id;
    }
  }
  
  // 更新节点费用测试
  if (testNodeId) {
    await runTest('更新节点费用测试', async () => {
      const response = await axios.put(`${API_BASE_URL}/expenses/nodes/${testNodeId}`, {
        expense: 100.50,
        notes: '门票费用'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.success, true);
    });
  }
  
  // 批量更新费用测试
  if (testPlanId) {
    await runTest('批量更新费用测试', async () => {
      const response = await axios.put(`${API_BASE_URL}/expenses/plans/${testPlanId}/batch`, [
        {
          node_id: testNodeId,
          expense: 120.00,
          notes: '更新后的门票费用'
        }
      ], {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.success, true);
    });
  }
  
  // 从语音识别中提取费用测试
  await runTest('从语音识别中提取费用测试', async () => {
    const response = await axios.post(`${API_BASE_URL}/expenses/extract/audio`, {
      audioText: '今天去了故宫门票120元，午餐花了88元，交通费用40元'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.ok(Array.isArray(response.data.data.expenses));
  });
  
  // 获取计划费用统计测试
  if (testPlanId) {
    await runTest('获取计划费用统计测试', async () => {
      const response = await axios.get(`${API_BASE_URL}/expenses/plans/${testPlanId}/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.data.stats);
    });
  }
}

/**
 * 清理测试数据
 */
async function cleanup() {
  console.log('\n=== 清理测试数据 ===');
  
  try {
    // 删除测试旅行计划
    if (testPlanId && authToken) {
      await axios.delete(`${API_BASE_URL}/plans/${testPlanId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ 测试旅行计划已删除');
    }
    
    // 注销测试用户账号
    if (authToken) {
      await axios.delete(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ 测试用户已注销');
    }
  } catch (error) {
    console.error('❌ 清理测试数据时出错:', error.message);
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('=== 开始API接口测试 ===');
  
  try {
    // 运行各个模块的测试
    await runAuthTests();
    await runTravelPlanTests();
    await runExpenseTests();
    
    // 生成测试报告
    const allPassed = generateReport();
    
    if (allPassed) {
      console.log('\n🎉 所有测试通过!');
    } else {
      console.log('\n❌ 部分测试失败，请检查并修复问题。');
    }
    
  } catch (error) {
    console.error('\n❌ 测试过程中出现未捕获的错误:', error);
  } finally {
    // 清理测试数据
    await cleanup();
    
    console.log('\n=== 测试完成 ===');
  }
}

// 执行测试
if (require.main === module) {
  main();
}

module.exports = { main, runAuthTests, runTravelPlanTests, runExpenseTests };