-- ============================================
-- 校园二手交易平台 MVP - 初始 schema
-- ============================================

-- profiles（用户资料，与 auth.users 关联）
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- listings（商品）
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price int NOT NULL CHECK (price >= 0),
  image_url text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold')),
  created_at timestamptz DEFAULT now()
);

-- messages（站内消息）
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  from_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_auto boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
-- 搜索：ilike 支持（pg_trgm 需先创建）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_desc_trgm ON listings USING gin(description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_messages_listing_created ON messages(listing_id, created_at);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- profiles: 所有人可读，仅本人可更新
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- listings: 所有人可读 active；仅 seller 可 insert/update 自己的
CREATE POLICY "listings_read" ON listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "listings_insert" ON listings FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "listings_update" ON listings FOR UPDATE USING (seller_id = auth.uid());

-- messages: 仅对话双方可读；insert 仅允许自己作为 from_user
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  from_user = auth.uid() OR to_user = auth.uid()
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (from_user = auth.uid());

-- ============================================
-- 触发器：新用户自动创建 profile
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
