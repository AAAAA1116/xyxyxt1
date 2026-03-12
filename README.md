# 校园二手交易平台 MVP

邮箱 Magic Link 登录、发布闲置、站内消息、自动回复的校园二手交易网站。

## 技术栈

- **Next.js 14**（App Router）+ TypeScript
- **Tailwind CSS**
- **Supabase**：Auth（Email Magic Link）、Postgres、Storage
- **部署**：Vercel + Supabase

## 功能清单

| 功能         | 说明 |
|--------------|------|
| 登录注册     | 邮箱 Magic Link 一键登录，无需学号/微信 |
| 发布商品     | 标题、描述、价格、1 张图片 |
| 首页         | 商品卡片流，按时间排序 |
| 搜索         | 按标题、描述 ilike 搜索 |
| 商品详情     | 图片、价格、卖家、描述、消息区 |
| 站内消息     | 买卖双方对话，支持自动回复（"还卖吗"等） |
| 图片上传     | Supabase Storage，≤5MB，jpg/png/webp |

## 本地运行

### 1. 克隆并安装

```bash
cd xyxyxt1
npm install
```

### 2. Supabase 配置

1. 创建 [Supabase](https://supabase.com) 项目
2. 在 SQL Editor 中依次执行：
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_storage.sql`
3. 创建 Storage bucket（若 SQL 未自动创建）：
   - 进入 Storage → New bucket → 名称 `listing-images`
   - 设为 Public
   - 限制 5MB，允许 jpg/png/webp

### 3. 邮箱 Magic Link 登录

1. 进入 **Authentication → Providers → Email**
2. 确认 **Enable Email provider** 已开启（默认开启）
3. 在 **Authentication → URL Configuration** 中添加 Redirect URLs：
   - 本地：`http://localhost:3000/auth/callback`
   - 生产：`https://你的域名/auth/callback`

### 4. 环境变量

复制 `.env.example` 为 `.env.local`，**务必把占位值换成你在 Supabase 控制台里的真实 URL 和 anon key**（不能保留 `placeholder` / `your-anon-key`）：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://你的域名   # 生产必填；本地可不填，默认 localhost:3000
```

- `SUPABASE_SERVICE_ROLE_KEY`：用于自动回复（服务端以卖家身份插入消息），在 Supabase 项目设置 → API 中获取
- `NEXT_PUBLIC_SITE_URL`：生产环境 Magic Link 回调域名，本地开发可不配置

### 5. 启动

```bash
npm run dev
```

> 若 `npm run build` 报错缺少 Supabase 配置，可先复制 `.env.build` 为 `.env.local` 使构建通过；实际运行需填入真实 Supabase 配置。`.env.local` 已在 `.gitignore`，不会提交。

访问 http://localhost:3000

### 6. 验证登录

1. 访问 http://localhost:3000/auth
2. 输入邮箱，点击「发送登录链接」
3. 收到邮件后点击链接，应跳转回首页且已登录

### 排查 /auth 登录问题（Failed to fetch 等）

- **修改 .env.local 后必须重启 `npm run dev`**，否则前端读不到新变量。
- 清缓存：删除项目根目录下的 `.next` 文件夹后重新执行 `npm run dev`。
- 建议用**无痕/隐私窗口**打开 http://localhost:3000/auth，排除浏览器插件拦截请求。
- 页面上会显示「当前 Supabase 地址」，可确认 .env.local 是否生效；可点击「检测 Supabase 连接」做连通性自检。
- **国内网络**：若出现“无法连接 Supabase”，多为访问 supabase.co 受限，可尝试开启 **VPN 或系统代理** 后再试。

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在项目 Settings → Environment Variables 中添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`（生产域名，如 https://xxx.vercel.app）
4. 部署

## 目录结构

```
src/
├── app/
│   ├── page.tsx           # 首页
│   ├── auth/page.tsx      # 邮箱 Magic Link 登录
│   ├── auth/callback/     # Magic Link 回调
│   ├── new/page.tsx       # 发布
│   ├── listing/[id]/      # 详情 + 消息
│   ├── search/            # 搜索
│   ├── me/                # 我的发布
│   └── api/
│       ├── upload/        # 图片上传
│       ├── listings/      # 创建商品
│       └── messages/      # 发消息 + 自动回复
├── components/
└── lib/
    └── supabase/
supabase/migrations/       # SQL 迁移
```

## 自动回复规则

当买家发送的消息匹配以下关键词时，系统自动插入一条回复：
- `还卖吗`、`还在吗`、`在吗`、`还有吗`、`能要吗`、`还卖不`

自动回复内容：`还卖哦，{价格}元，校内自取~`

## 注意事项

- 不做后台管理、推荐算法、微信登录
- UI 简洁实用，优先移动端
- 所有写操作在服务端完成，防止滥用
