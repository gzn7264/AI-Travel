// 后端旅行计划生成测试脚本
const { generatePlan } = require('./services/travelPlanService');

// 测试文本 - 用户指定输入
const testPrompt = '去西安3天，预算5000元，喜欢历史文化景点';

// 执行测试
async function testGeneratePlan() {
  console.log('开始测试旅行计划生成功能...');
  console.log('测试文本:', testPrompt);
  
  try {
    // 记录开始时间
    const startTime = Date.now();
    
    // 调用generatePlan方法
    const result = await generatePlan({ prompt: testPrompt });
    
    // 计算耗时（毫秒）
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n测试成功！');
    console.log(`调用大语言模型API耗时: ${duration} 毫秒`);
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