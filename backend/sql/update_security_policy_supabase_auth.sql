-- 为Supabase auth调整数据库安全策略
-- 本文件提供了与Supabase内置auth系统集成的安全策略

-- 1. 确保表启用了Row Level Security (RLS)
BEGIN;

-- 为users表启用RLS（如果尚未启用）
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- 为travel_plans表启用RLS（如果尚未启用）
ALTER TABLE IF EXISTS travel_plans ENABLE ROW LEVEL SECURITY;

-- 为travel_nodes表启用RLS（如果尚未启用）
ALTER TABLE IF EXISTS travel_nodes ENABLE ROW LEVEL SECURITY;

-- 2. 创建或替换用户表策略
-- 允许用户只访问和修改自己的数据
CREATE OR REPLACE POLICY "Users can access their own data" ON users
  USING (auth.uid() = id) -- 确保用户只能访问自己的记录
  WITH CHECK (auth.uid() = id); -- 确保用户只能修改自己的记录

-- 3. 创建或替换travel_plans表策略
-- 允许用户只访问和修改自己的旅行计划
CREATE OR REPLACE POLICY "Users can access their own travel plans" ON travel_plans
  USING (auth.uid() = user_id) -- 确保用户只能访问自己创建的旅行计划
  WITH CHECK (auth.uid() = user_id); -- 确保用户只能修改自己创建的旅行计划

-- 4. 创建或替换travel_nodes表策略
-- 允许用户只访问和修改自己旅行计划中的节点
CREATE OR REPLACE POLICY "Users can access their own travel nodes" ON travel_nodes
  USING (EXISTS (
    SELECT 1 FROM travel_plans 
    WHERE travel_plans.id = travel_nodes.plan_id 
    AND travel_plans.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM travel_plans 
    WHERE travel_plans.id = travel_nodes.plan_id 
    AND travel_plans.user_id = auth.uid()
  ));

-- 5. 创建管理员策略，允许服务角色访问所有数据
-- 这对于后端API调用非常重要
CREATE OR REPLACE POLICY "Service role can access all data" ON users
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE POLICY "Service role can access all travel plans" ON travel_plans
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE POLICY "Service role can access all travel nodes" ON travel_nodes
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. 创建公共读取策略（如果需要）
-- 允许任何用户读取公开的旅行计划（如果有is_public字段）
-- 取消注释下面的策略如果您的应用需要此功能
-- CREATE OR REPLACE POLICY "Public can read published travel plans" ON travel_plans
--   FOR SELECT
--   USING (is_public = true);

COMMIT;

-- 7. 显示当前RLS策略状态
SELECT
  table_name,
  row_level_security,
  policies
FROM (
  SELECT
    table_name,
    row_level_security,
    array_agg(policy_name) as policies
  FROM information_schema.tables
  LEFT JOIN information_schema.policies ON tables.table_name = policies.table_name
  WHERE table_schema = 'public'
  GROUP BY table_name, row_level_security
) as policy_summary
ORDER BY table_name;

-- 8. 确保auth用户和应用数据库用户正确关联
-- 创建函数用于在users表中自动创建或更新用户记录
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  -- 检查用户是否已存在
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- 创建新用户记录
    INSERT INTO public.users (id, email, nickname, created_at)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'nickname', ''), 
      NOW()
    );
  ELSE
    -- 更新现有用户记录
    UPDATE public.users
    SET 
      email = NEW.email,
      nickname = COALESCE(NEW.raw_user_meta_data->>'nickname', nickname),
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 创建触发器，当新用户在auth.users表中注册时自动执行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. 为服务角色创建辅助函数，用于在API调用中模拟用户上下文
CREATE OR REPLACE FUNCTION public.set_current_user(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT set_config('request.jwt.claim.sub', user_id::text, true);
$$;

-- 10. 创建函数用于验证用户角色权限
CREATE OR REPLACE FUNCTION public.has_role(user_role text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('request.jwt.claim.role', true) = user_role
     OR current_setting('request.jwt.claim.role', true) = 'admin';
$$;

-- 注意事项：
-- 1. 本文件应在Supabase控制台的SQL Editor中执行
-- 2. 执行前确保已经创建了必要的表（users, travel_plans, travel_nodes）
-- 3. 执行后所有表将启用RLS，用户只能访问自己的数据
-- 4. 服务角色可以访问所有数据，确保在API调用中使用正确的密钥
-- 5. 新注册的用户将自动在users表中创建对应记录