-- 为旅行计划应用添加安全策略
-- 此脚本启用Row Level Security (RLS)并添加必要的访问控制策略

-- 1. 为users表启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 为users表创建策略：用户只能查看和更新自己的数据
CREATE POLICY "Users can only access their own data" ON users
  USING (id = auth.uid());

-- 允许认证用户创建自己的用户记录
CREATE POLICY "Authenticated users can create their profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 2. 为travel_plans表启用RLS
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- 为travel_plans表创建策略：用户只能查看和操作自己的旅行计划
CREATE POLICY "Users can only access their own travel plans" ON travel_plans
  USING (user_id = auth.uid());

-- 允许认证用户创建自己的旅行计划
CREATE POLICY "Authenticated users can create travel plans" ON travel_plans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. 为travel_nodes表启用RLS
ALTER TABLE travel_nodes ENABLE ROW LEVEL SECURITY;

-- 为travel_nodes表创建策略：用户只能访问属于自己旅行计划的节点
CREATE POLICY "Users can only access their own travel nodes" ON travel_nodes
  USING (plan_id IN (
    SELECT id FROM travel_plans WHERE user_id = auth.uid()
  ));

-- 允许认证用户创建旅行节点，但只能关联到自己的旅行计划
CREATE POLICY "Authenticated users can create travel nodes" ON travel_nodes
  FOR INSERT TO authenticated
  WITH CHECK (plan_id IN (
    SELECT id FROM travel_plans WHERE user_id = auth.uid()
  ));

-- 4. 创建必要的角色权限（如果需要）
-- 允许authenticated角色访问这些表
GRANT SELECT, INSERT, UPDATE, DELETE ON travel_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON travel_nodes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

-- 5. 为服务角色添加必要的权限（用于后端服务）
-- 允许service_role绕过RLS（用于需要全权限的后端操作）
ALTER TABLE users DISABLE ROW LEVEL SECURITY FOR SERVICE_ROLE;
ALTER TABLE travel_plans DISABLE ROW LEVEL SECURITY FOR SERVICE_ROLE;
ALTER TABLE travel_nodes DISABLE ROW LEVEL SECURITY FOR SERVICE_ROLE;

-- 6. 可选：添加只读访问策略（如果需要）
-- 例如：允许匿名用户查看公共数据（如果有）
-- 这里不添加，因为旅行计划数据通常是私有的

SELECT '安全策略已成功应用' AS status;