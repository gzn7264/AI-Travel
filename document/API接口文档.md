# Web版AI旅行规划师 (AI Travel Planner) API接口文档

## 1. 接口概述

本文档详细描述Web版AI旅行规划师的所有API接口，包括认证、旅行计划管理、费用记录等功能接口的定义、参数规范和响应格式。所有API接口均采用RESTful设计风格，以JSON格式进行数据交换。

### 1.1 基础URL

```
https://api.aitravelplanner.com/v1
```

注：实际部署时请替换为真实的API服务器地址。

### 1.2 请求头

#### 通用请求头
- `Content-Type: application/json`
- `Accept: application/json`

#### 认证请求头
- `Authorization: Bearer {token}` - 用于需要身份认证的接口，token为JWT格式。

### 1.3 响应格式

所有API响应均采用标准JSON格式，包含以下字段：

```json
{
  "success": true,         // 请求是否成功
  "message": "成功信息",  // 响应消息
  "data": { ... },         // 响应数据（成功时返回）
  "error": null            // 错误信息（失败时返回）
}
```

## 2. 认证接口

### 2.1 用户注册

#### 请求
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "email": "user@example.com",     // 邮箱（必填）
    "password": "password123",      // 密码（必填，至少8位）
    "confirmPassword": "password123" // 确认密码（必填，需与密码一致）
  }
  ```

#### 响应
- **成功 (201 Created)**:
  ```json
  {
    "success": true,
    "message": "注册成功",
    "data": {
      "id": "user_123",
      "email": "user@example.com",
      "created_at": "2023-05-10T10:30:00Z"
    },
    "error": null
  }
  ```

- **失败 (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "注册失败",
    "data": null,
    "error": "邮箱已被注册" // 或其他错误信息
  }
  ```

### 2.2 用户登录

#### 请求
- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "email": "user@example.com",  // 邮箱（必填）
    "password": "password123"     // 密码（必填）
  }
  ```

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "user": {
        "id": "user_123",
        "email": "user@example.com"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // JWT token
    },
    "error": null
  }
  ```

- **失败 (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "登录失败",
    "data": null,
    "error": "邮箱或密码错误" // 或其他错误信息
  }
  ```

### 2.3 获取当前用户信息

#### 请求
- **URL**: `/api/auth/me`
- **方法**: `GET`
- **认证**: 需要JWT token

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "获取用户信息成功",
    "data": {
      "id": "user_123",
      "email": "user@example.com",
      "created_at": "2023-05-10T10:30:00Z",
      "last_login": "2023-05-15T14:20:00Z"
    },
    "error": null
  }
  ```

- **失败 (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "未授权",
    "data": null,
    "error": "无效的token" // 或其他错误信息
  }
  ```

## 3. 旅行计划接口

### 3.1 AI生成旅行计划

#### 请求
- **URL**: `/api/plans/generate`
- **方法**: `POST`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "text": "我想去日本东京，6月10日到15日，预算1万元，2人同行，喜欢美食和动漫，带孩子" // 旅行需求文本（必填）
  }
  ```

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "生成旅行计划成功",
    "data": {
      "planId": "temp_plan_123", // 临时计划ID，保存时会生成正式ID
      "name": "日本东京5日游",
      "destination": "日本东京",
      "startDate": "2023-06-10",
      "endDate": "2023-06-15",
      "budget": 10000,
      "travelersCount": 2,
      "preferences": "喜欢美食和动漫，带孩子", // 默认值为"无"
      "nodes": [
        {
          "nodeId": "node_1",
          "type": "景点", // 类型：餐饮、景点、住宿、交通
          "date": "2023-06-10",
          "time": "10:00",
          "location": "浅草寺",
          "description": "东京最古老的寺庙",
          "estimatedDuration": "2小时", // 预计花费时间
          "budget": 0,    // 预算费用
          "expense": 0    // 实际费用（初始为0）
        },
        // 更多节点...
      ]
    },
    "error": null
  }
  ```

- **失败 (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "生成旅行计划失败",
    "data": null,
    "error": "参数无效" // 或其他错误信息
  }
  ```

### 3.2 保存旅行计划

#### 请求
- **URL**: `/api/plans`
- **方法**: `POST`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "planData": {
      "name": "日本东京5日游",     // 计划名称（必填）
      "destination": "日本东京",
      "startDate": "2023-06-10",
      "endDate": "2023-06-15",
      "budget": 10000,
      "travelersCount": 2,
      "preferences": "喜欢美食和动漫，带孩子",
      "nodes": [
        // 旅行节点数据，格式同生成接口返回
      ]
    }
  }
  ```

#### 响应
- **成功 (201 Created)**:
  ```json
  {
    "success": true,
    "message": "保存旅行计划成功",
    "data": {
      "planId": "plan_abc123", // 正式计划ID
      "createdAt": "2023-05-18T16:45:00Z"
    },
    "error": null
  }
  ```

- **失败 (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "保存旅行计划失败",
    "data": null,
    "error": "计划数据无效" // 或其他错误信息
  }
  ```

### 3.3 获取旅行计划列表

#### 请求
- **URL**: `/api/plans`
- **方法**: `GET`
- **认证**: 需要JWT token
- **查询参数**:
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认10）

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "获取旅行计划列表成功",
    "data": {
      "plans": [
        {
          "planId": "plan_abc123",
          "name": "日本东京5日游",
          "destination": "日本东京",
          "startDate": "2023-06-10",
          "endDate": "2023-06-15",
          "createdAt": "2023-05-18T16:45:00Z",
          "updatedAt": "2023-05-18T16:45:00Z"
        },
        // 更多计划...
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 25,
        "totalPages": 3
      }
    },
    "error": null
  }
  ```

- **失败 (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "未授权",
    "data": null,
    "error": "无效的token" // 或其他错误信息
  }
  ```

### 3.4 获取旅行计划详情

#### 请求
- **URL**: `/api/plans/{planId}`
- **方法**: `GET`
- **认证**: 需要JWT token
- **路径参数**:
  - `planId`: 旅行计划ID（必填）

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "获取旅行计划详情成功",
    "data": {
      "planId": "plan_abc123",
      "name": "日本东京5日游",
      "destination": "日本东京",
      "startDate": "2023-06-10",
      "endDate": "2023-06-15",
      "budget": 10000,
      "travelersCount": 2,
      "preferences": "喜欢美食和动漫，带孩子",
      "createdAt": "2023-05-18T16:45:00Z",
      "updatedAt": "2023-05-18T16:45:00Z",
      "nodes": [
        {
          "nodeId": "node_1",
          "type": "景点",
          "date": "2023-06-10",
          "time": "10:00",
          "location": "浅草寺",
          "description": "东京最古老的寺庙",
          "estimatedDuration": "2小时", // 预计花费时间
          "budget": 0,
          "expense": 500
        },
        // 更多节点...
      ]
    },
    "error": null
  }
  ```

- **失败 (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "获取旅行计划详情失败",
    "data": null,
    "error": "旅行计划不存在" // 或其他错误信息
  }
  ```

### 3.5 更新旅行计划

#### 请求
- **URL**: `/api/plans/{planId}`
- **方法**: `PUT`
- **认证**: 需要JWT token
- **路径参数**:
  - `planId`: 旅行计划ID（必填）
- **请求体**:
  ```json
  {
    "planData": {
      "name": "日本东京5日游（更新版）", // 可更新的字段
      "nodes": [
        // 更新后的节点数据
      ]
    }
  }
  ```

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "更新旅行计划成功",
    "data": {
      "planId": "plan_abc123",
      "updatedAt": "2023-05-20T09:30:00Z"
    },
    "error": null
  }
  ```

- **失败 (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "更新旅行计划失败",
    "data": null,
    "error": "计划数据无效" // 或其他错误信息
  }
  ```

### 3.6 删除旅行计划

#### 请求
- **URL**: `/api/plans/{planId}`
- **方法**: `DELETE`
- **认证**: 需要JWT token
- **路径参数**:
  - `planId`: 旅行计划ID（必填）

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "删除旅行计划成功",
    "data": null,
    "error": null
  }
  ```

- **失败 (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "删除旅行计划失败",
    "data": null,
    "error": "旅行计划不存在" // 或其他错误信息
  }
  ```

## 4. 费用记录接口

### 4.1 更新旅行节点费用

#### 请求
- **URL**: `/api/nodes/{nodeId}/expense`
- **方法**: `PUT`
- **认证**: 需要JWT token
- **路径参数**:
  - `nodeId`: 旅行节点ID（必填）
- **请求体**:
  ```json
  {
    "expense": 1200,            // 实际费用（必填，单位：人民币）
    "description": "午餐费用"   // 费用描述（可选）
  }
  ```

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "更新费用记录成功",
    "data": {
      "nodeId": "node_1",
      "expense": 1200,
      "updatedAt": "2023-06-10T14:30:00Z"
    },
    "error": null
  }
  ```

- **失败 (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "更新费用记录失败",
    "data": null,
    "error": "旅行节点不存在" // 或其他错误信息
  }
  ```

### 4.2 语音识别费用提取

#### 请求
- **URL**: `/api/expense/extract`
- **方法**: `POST`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "text": "午餐花了200元人民币" // 语音识别后的文本（必填）
  }
  ```

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "提取费用成功",
    "data": {
      "amount": 200,        // 提取出的费用金额
      "currency": "CNY",   // 货币类型
      "description": "午餐" // 费用描述（从文本中提取）
    },
    "error": null
  }
  ```

- **失败 (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "提取费用失败",
    "data": null,
    "error": "无法从文本中提取费用信息" // 或其他错误信息
  }
  ```

## 5. 语音识别代理接口

### 5.1 语音识别代理

> 注：此接口作为前端与科大讯飞语音识别API之间的代理，也可选择前端直接调用科大讯飞API（参考iat-js-demo）。

#### 请求
- **URL**: `/api/speech/recognize`
- **方法**: `POST`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "audioData": "base64编码的音频数据", // 音频数据（必填）
    "audioFormat": "wav",              // 音频格式（必填）
    "sampleRate": 16000                // 采样率（必填）
  }
  ```

#### 响应
- **成功 (200 OK)**:
  ```json
  {
    "success": true,
    "message": "语音识别成功",
    "data": {
      "text": "我想去日本东京，5天，预算1万元，喜欢美食和动漫，带孩子",
      "confidence": 0.95
    },
    "error": null
  }
  ```

- **失败 (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "语音识别失败",
    "data": null,
    "error": "音频数据无效" // 或其他错误信息
  }
  ```

## 6. 错误码说明

| 错误码 | 描述 | HTTP状态码 |
|-------|------|------------|
| 40001 | 参数错误 | 400 Bad Request |
| 40002 | 资源不存在 | 404 Not Found |
| 40101 | 未授权访问 | 401 Unauthorized |
| 40102 | 无效的Token | 401 Unauthorized |
| 40103 | Token已过期 | 401 Unauthorized |
| 40301 | 没有权限执行此操作 | 403 Forbidden |
| 50001 | 服务器内部错误 | 500 Internal Server Error |
| 50002 | 第三方服务调用失败 | 502 Bad Gateway |
| 50003 | 数据库操作失败 | 500 Internal Server Error |

## 7. 安全注意事项

1. 所有需要认证的接口必须在请求头中携带有效的JWT token。
2. 用户只能访问和修改自己的旅行计划数据。
3. 敏感信息（如API密钥）通过环境变量管理，不在代码中硬编码。
4. 所有API调用应使用HTTPS协议进行加密传输。
5. 前端不应直接访问数据库，所有数据操作必须通过后端API进行。