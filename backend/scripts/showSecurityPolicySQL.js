const fs = require('fs');
const path = require('path');

/**
 * 显示安全策略SQL语句并提供执行指导
 * 用于启用Row Level Security并添加访问控制策略
 */
function showSecurityPolicyAndInstructions() {
  try {
    console.log('========== 旅行计划应用 - 安全策略实施指导 ==========\n');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'enable_security.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    console.log('以下是需要在Supabase控制台执行的安全策略SQL语句:\n');
    console.log('=====================================================');
    console.log(sqlContent);
    console.log('=====================================================\n');
    
    console.log('为什么需要启用安全策略:');
    console.log('1. 目前表格显示为"unrestricted"表示没有启用Row Level Security (RLS)');
    console.log('2. 这意味着任何拥有API密钥的人都可以访问、修改或删除所有用户的数据');
    console.log('3. 启用RLS后，用户将只能访问和修改自己的旅行计划数据\n');
    
    console.log('执行步骤:');
    console.log('1. 登录到Supabase控制台 (https://app.supabase.com)');
    console.log('2. 选择您的项目 (https://uymnnucipjjmruxcvuis.supabase.co)');
    console.log('3. 导航到左侧菜单的 "SQL Editor"');
    console.log('4. 复制上面的所有SQL语句并粘贴到SQL编辑器中');
    console.log('5. 点击 "RUN" 按钮执行SQL语句');
    console.log('6. 等待执行完成，检查是否有错误\n');
    
    console.log('验证步骤:');
    console.log('1. 执行完成后，返回 "Table editor" 页面');
    console.log('2. 检查各表的安全状态，应该从"unrestricted"变为"RLS enabled"');
    console.log('3. 您可以点击各表的"RLS"标签查看已创建的策略\n');
    
    console.log('注意事项:');
    console.log('- 确保在添加安全策略前已经创建了所有必要的表');
    console.log('- 安全策略会限制数据访问，请确保您的应用已正确处理认证');
    console.log('- 如果需要调试，可以暂时禁用RLS（但生产环境必须启用）');
    console.log('- service_role不受RLS限制，用于后端服务的全权限操作\n');
    
    console.log('SQL文件位置:', sqlFilePath);
    console.log('\n========== 安全策略实施指导完成 ==========');
    
  } catch (error) {
    console.error('读取SQL文件失败:', error);
  }
}

// 执行显示
showSecurityPolicyAndInstructions();