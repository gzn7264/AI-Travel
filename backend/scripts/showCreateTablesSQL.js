const fs = require('fs');
const path = require('path');

/**
 * 显示创建表的SQL语句并提供执行指导
 * 由于Supabase JavaScript客户端不直接支持执行DDL语句，需要在Supabase控制台手动执行
 */
function showSQLAndInstructions() {
  try {
    console.log('========== 旅行计划应用 - 数据库初始化指导 ==========\n');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'create_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    console.log('以下是需要在Supabase控制台执行的SQL语句:\n');
    console.log('=====================================================');
    console.log(sqlContent);
    console.log('=====================================================\n');
    
    console.log('执行步骤:');
    console.log('1. 登录到Supabase控制台 (https://app.supabase.com)');
    console.log('2. 选择您的项目 (https://uymnnucipjjmruxcvuis.supabase.co)');
    console.log('3. 导航到左侧菜单的 "SQL Editor"');
    console.log('4. 复制上面的所有SQL语句并粘贴到SQL编辑器中');
    console.log('5. 点击 "RUN" 按钮执行SQL语句');
    console.log('6. 等待执行完成，检查是否有错误\n');
    
    console.log('注意事项:');
    console.log('- 如果users表已存在，请先注释掉users表的创建语句');
    console.log('- 确保先创建users表，然后再创建travel_plans表（因为有外键约束）');
    console.log('- 触发器函数需要PostgreSQL权限，确保您的Supabase角色有足够权限\n');
    
    console.log('SQL文件位置:', sqlFilePath);
    console.log('\n========== 数据库初始化指导完成 ==========');
    
  } catch (error) {
    console.error('读取SQL文件失败:', error);
  }
}

// 执行显示
showSQLAndInstructions();