# 阿里云百炼大语言模型集成指南

本文档提供了在AI Travel项目中集成阿里云百炼大语言模型的详细步骤和配置说明。

## 1. 环境变量配置

在使用大语言模型功能前，需要配置阿里云百炼的API Key。请按照以下步骤操作：

### 1.1 创建环境变量文件

在`backend`目录下创建`.env`文件（如果不存在），并添加以下内容：

```
# 阿里云百炼API Key
DASHSCOPE_API_KEY=sk-3ed8868ade0c476e8aeca2f041ddf32b

# Supabase配置
SUPABASE_URL=你的Supabase URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

> **注意**：请不要将`.env`文件提交到版本控制系统中，它应该被添加到`.gitignore`文件中。

### 1.2 配置环境变量加载

确保在应用启动时加载环境变量。如果使用Express等框架，通常在应用入口文件（如`index.js`）的顶部添加：

```javascript
// 加载环境变量
require('dotenv').config();
```

如果尚未安装`dotenv`包，请运行：

```bash
npm install dotenv --save
```

## 2. 数据库初始化

### 2.1 执行数据库初始化脚本

我们提供了两种方式来初始化数据库：

#### 方式一：使用初始化脚本（推荐）

在`backend`目录下运行：

```bash
node scripts/initDatabase.js
```

#### 方式二：手动执行SQL

在Supabase控制台中，打开SQL编辑器，复制并执行`sql/create_tables.sql`文件中的内容。

### 2.2 数据库表结构说明

初始化脚本会创建以下表：

1. **users** - 存储用户信息
2. **travel_plans** - 存储旅行计划基本信息
3. **travel_nodes** - 存储旅行计划中的具体节点（景点、餐饮、住宿等）

## 3. 大语言模型服务使用

### 3.1 服务模块介绍

我们创建了`llmService.js`模块，封装了与阿里云百炼大语言模型的交互：

- **generateTravelPlan**: 生成旅行计划
- **transformToDatabaseFormat**: 将LLM返回的数据转换为数据库格式
- **transformToFrontendFormat**: 将数据库格式转换为前端所需格式

### 3.2 旅行计划生成流程

1. 前端发送旅行计划请求（目的地、日期、人数、预算等）
2. 后端通过`travelPlanService.generatePlan`方法调用LLM服务
3. LLM服务向阿里云百炼发送请求，获取生成的旅行计划
4. 后端转换数据格式并返回给前端或保存到数据库

### 3.3 容错机制

为了确保系统的稳定性，我们实现了以下容错机制：

- 如果LLM服务调用失败，系统会自动切换到模拟数据生成模式
- 所有数据转换都包含严格的验证，确保格式正确

## 4. 测试和验证

### 4.1 验证API Key配置

启动应用前，可以先验证API Key是否正确配置：

```javascript
// 在任意Node.js文件中运行
console.log('API Key配置状态:', process.env.DASHSCOPE_API_KEY ? '已配置' : '未配置');
```

### 4.2 测试旅行计划生成

可以通过调用API接口`/api/travel-plans/generate`来测试旅行计划生成功能。

## 5. 常见问题解答

### 5.1 API Key无效或过期

如果API Key无效或过期，系统会自动切换到模拟数据模式。请检查API Key是否正确，并更新`.env`文件。

### 5.2 数据库连接失败

确保Supabase的URL和匿名密钥正确配置在环境变量中。

### 5.3 LLM返回的数据格式异常

我们的代码包含了数据格式验证和错误处理，如果遇到异常格式，系统会尝试修复或使用默认值，确保系统稳定运行。

## 6. 性能优化建议

- 对于频繁使用的旅行计划，可以考虑添加缓存机制
- 在高并发场景下，可以调整LLM服务的超时设置和重试策略
- 考虑添加请求速率限制，避免过度调用LLM服务

---

如有任何问题或需要进一步的帮助，请参考项目文档或联系开发团队。