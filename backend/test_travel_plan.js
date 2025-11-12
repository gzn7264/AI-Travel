// 后端旅行计划生成测试脚本
const { generatePlan } = require('./services/travelPlanService');

// 测试文本 - 原始用户输入
const testPrompt = '我想去日本，5 天，预算 1 万元，喜欢美食和动漫，带孩子';

// 执行测试
async function testGeneratePlan() {
  console.log('开始测试旅行计划生成功能...');
  console.log('测试文本:', testPrompt);
  
  try {
    // 调用generatePlan方法
    const result = await generatePlan({ prompt: testPrompt });
    
    console.log('\n测试成功！');
    console.log('生成的旅行计划:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n测试失败！');
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testGeneratePlan();