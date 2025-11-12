const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');

/**
 * 数据库初始化脚本
 * 用于创建必要的数据库表结构
 */
async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'create_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    console.log('已读取SQL文件，准备执行...');
    
    // 将SQL拆分为单独的语句（按分号分割，但避免在字符串和注释中的分号）
    const sqlStatements = splitSqlStatements(sqlContent);
    
    // 逐个执行SQL语句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i].trim();
      if (statement) {
        console.log(`执行SQL语句 ${i + 1}/${sqlStatements.length}: ${statement.substring(0, 50)}...`);
        
        // 使用Supabase直接执行SQL
        const { error } = await supabase.rpc('execute_sql', { sql: statement });
        
        if (error) {
          console.error(`执行SQL语句失败: ${error.message}`);
          // 继续执行下一个语句，而不是立即失败
        } else {
          console.log(`SQL语句 ${i + 1} 执行成功`);
        }
      }
    }
    
    // 如果Supabase RPC不可用，提供备选方案
    console.log('\n数据库初始化完成！');
    console.log('注意: 脚本使用了Supabase的execute_sql RPC函数。如果该函数不可用，请手动在Supabase控制台执行sql/create_tables.sql文件中的SQL语句。');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    console.log('\n请尝试手动在Supabase控制台执行sql/create_tables.sql文件中的SQL语句。');
    console.log('SQL文件路径:', path.join(__dirname, '..', 'sql', 'create_tables.sql'));
  }
}

/**
 * 将SQL内容拆分为单独的语句
 * 避免在字符串和注释中的分号导致错误分割
 */
function splitSqlStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBlockComment = false;
  let inLineComment = false;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';
    
    // 检查行注释
    if (char === '-' && nextChar === '-' && !inSingleQuote && !inDoubleQuote && !inBlockComment) {
      inLineComment = true;
      currentStatement += char + nextChar;
      i++;
      continue;
    }
    
    // 检查块注释开始
    if (char === '/' && nextChar === '*' && !inSingleQuote && !inDoubleQuote && !inLineComment) {
      inBlockComment = true;
      currentStatement += char + nextChar;
      i++;
      continue;
    }
    
    // 检查块注释结束
    if (char === '*' && nextChar === '/' && inBlockComment) {
      inBlockComment = false;
      currentStatement += char + nextChar;
      i++;
      continue;
    }
    
    // 检查行尾（结束行注释）
    if ((char === '\n' || char === '\r') && inLineComment) {
      inLineComment = false;
    }
    
    // 检查单引号
    if (char === "'" && !inDoubleQuote && !inBlockComment && !inLineComment) {
      inSingleQuote = !inSingleQuote;
    }
    
    // 检查双引号
    if (char === '"' && !inSingleQuote && !inBlockComment && !inLineComment) {
      inDoubleQuote = !inDoubleQuote;
    }
    
    // 检查分号（语句结束标记）
    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBlockComment && !inLineComment) {
      currentStatement += char;
      statements.push(currentStatement);
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }
  
  // 确保最后一个语句也被添加（如果有）
  if (currentStatement.trim()) {
    statements.push(currentStatement);
  }
  
  return statements;
}

// 执行初始化
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };