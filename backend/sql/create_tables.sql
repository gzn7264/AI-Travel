-- 创建旅行计划表
CREATE TABLE IF NOT EXISTS travel_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travelers_count INTEGER NOT NULL DEFAULT 1,
  budget DECIMAL(10, 2) NOT NULL,
  preferences TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 添加外键约束（假设users表存在）
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建旅行节点表
CREATE TABLE IF NOT EXISTS travel_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL,
  node_type VARCHAR(50) NOT NULL, -- 景点、餐饮、住宿、交通等
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL, -- 格式：HH:MM
  location VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(10, 2) NOT NULL DEFAULT 0,
  actual_cost DECIMAL(10, 2) DEFAULT 0, -- 实际花费
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 添加外键约束
  CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
);

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_active ON travel_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_travel_nodes_plan_id ON travel_nodes(plan_id);
CREATE INDEX IF NOT EXISTS idx_travel_nodes_date ON travel_nodes(date);
CREATE INDEX IF NOT EXISTS idx_travel_nodes_sequence ON travel_nodes(sequence_order);

-- 为自动更新时间戳创建触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为travel_plans表添加触发器
CREATE TRIGGER update_travel_plans_timestamp
BEFORE UPDATE ON travel_plans
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 为travel_nodes表添加触发器
CREATE TRIGGER update_travel_nodes_timestamp
BEFORE UPDATE ON travel_nodes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 为users表添加触发器
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();