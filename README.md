# MuseHub

MuseHub 是一个面向毕业设计展示的泛娱乐平台，聚合影视、图书、音乐、社交互动、管理后台、个性化推荐和 AI 助手。项目采用前后端分离架构，前端负责多模块交互与播放体验，后端负责 BFF API、SQLite 持久化、外部内容源聚合和推荐算法。

## 功能概览

- 影视模块：热门、趋势、高分、正在上映、搜索、详情、标记、评分、评论。
- 图书模块：分类、搜索、详情、标记、评分、评论、书单。
- 音乐模块：歌单、排行榜、搜索、歌词、播放、喜欢、历史、自建歌单、站内评论。
- 用户与社交：注册登录、个人资料、头像、关注、动态流、年度报告。
- 推荐系统：UserCF、ItemCF、内容推荐、混合推荐、跨模块推荐和推荐效果统计。
- 管理后台：用户管理、内容审核、公告管理、推荐引擎参数与数据面板。
- AI 助手：基于用户画像生成影视、图书、音乐建议，支持流式对话和历史会话。

## 技术栈

- 前端：React 18、Vite、TypeScript、React Router、Zustand、Tailwind CSS、Framer Motion、ECharts。
- 后端：Node.js、Express、TypeScript、better-sqlite3、JWT、Multer、OpenAI 兼容 API。
- 外部内容源：TMDB、Open Library、NeteaseCloudMusicApi、DeepSeek/OpenAI 兼容模型。
- 数据库：SQLite，启动时自动创建 `server/data/musehub.db`。

## 目录结构

```text
MuseHub/
  client/                # React 前端
  server/                # Express BFF API
    src/database/        # SQLite schema 初始化
    src/routes/          # REST API 路由
    src/services/        # 上游 API、推荐、AI、持久化服务
    .env.example         # 后端环境变量示例
```

## 环境准备

1. 安装 Node.js 20 或更高版本。
2. 前端使用 pnpm，后端使用 npm：

```powershell
cd client
pnpm install

cd ../server
npm install
```

3. 复制后端环境变量：

```powershell
cd server
copy .env.example .env
```

至少建议配置：

- `JWT_SECRET`：登录令牌密钥，生产环境必须配置。
- `TMDB_API_KEY`：影视数据源密钥。
- `NETEASE_API_BASE_URL`：音乐 API 地址，默认后端启动时尝试在 `localhost:3002` 拉起。
- `AI_API_KEY`：AI 助手密钥；未配置时 AI 会返回明确提示，不影响其它模块。

## 启动方式

分别启动后端和前端：

```powershell
cd server
npm run dev
```

```powershell
cd client
pnpm dev
```

访问 `http://localhost:5173`。后端健康检查为 `http://localhost:3001/api/health`。

开发环境默认会创建管理员账号：

- 用户名：`admin`
- 密码：`admin123`

生产或正式演示前请在 `.env` 中修改 `DEFAULT_ADMIN_PASSWORD`，或设置 `CREATE_DEFAULT_ADMIN=false` 后手动创建管理员。
