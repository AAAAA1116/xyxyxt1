# 校园二手交易平台 MVP - 实现方案概览

## 1. 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel (Next.js)                         │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   /         │   /auth     │   /new      │ /listing/[id]│ /search │
│   首页商品流  │  手机OTP登录 │  发布商品    │  详情+消息   │  搜索   │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────┤
│  Server Actions / Route Handlers (所有写操作服务端)              │
└────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (BaaS)                             │
│  Auth(Phone OTP) │ Postgres │ Storage(listing-images)           │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 目录结构

```
xyxyxt1/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # 首页
│   │   ├── auth/
│   │   │   └── page.tsx          # 手机 OTP 登录
│   │   ├── new/
│   │   │   └── page.tsx          # 发布
│   │   ├── listing/[id]/
│   │   │   └── page.tsx          # 详情 + 消息
│   │   ├── search/
│   │   │   └── page.tsx          # 搜索
│   │   ├── me/
│   │   │   └── page.tsx          # 我的发布
│   │   └── api/
│   │       ├── messages/route.ts # 发消息 + 自动回复
│   │       └── upload/route.ts   # 图片上传
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ListingCard.tsx
│   │   ├── MessageList.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   └── auth.ts               # 含 DEV_BYPASS_OTP 逻辑
│   └── types/
│       └── database.ts
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── .env.example
├── package.json
└── README.md
```

## 3. 关键流程（文字说明）

### 3.1 发消息 + 自动回复流程
```
用户点击「发送」 → POST /api/messages
  → 校验登录、listing 存在、自己是 buyer
  → 插入 messages (from_user=当前用户, to_user=卖家)
  → 正则检测 content 是否匹配：还(在|卖)吗|在吗|还有吗|能要吗|还卖不
  → 若匹配：再插入一条 is_auto=true，from=卖家 id，to=买家 id，content="还卖哦，{price}元，校内自取~"
  → 返回成功
```

### 3.2 发布商品流程
```
POST 表单 → Server Action createListing
  → 校验登录
  → 客户端先调用 /api/upload 上传图
  → 获取 image_url → 插入 listings (seller_id, title, description, price, image_url)
  → redirect 到 /listing/[id]
```

### 3.3 开发模式 OTP 绕过
```
DEV_BYPASS_OTP=true 且 NODE_ENV=development 时：
  - 提供测试手机号输入框
  - 任意 6 位验证码即可通过（不调用 Supabase signInWithOtp）
  - 仅用于本地跑通，README 明确禁止生产使用
```

## 4. RLS 策略一览
- **listings**: 所有人 SELECT (status=active)；INSERT/UPDATE 仅 seller_id=auth.uid()
- **messages**: SELECT 仅 from_user 或 to_user = auth.uid()；INSERT 仅 from_user = auth.uid()
- **profiles**: 所有人可读；UPDATE 仅本人

## 5. 索引
- listings: (created_at DESC), (title, description) 用于 ilike 或 tsvector
- messages: (listing_id, created_at)
