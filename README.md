# 🏠 YingmuQiu-nas — 个人云NAS

个人云存储系统，支持 Web 端 + 安卓端访问，部署到云服务器。

![Phase](https://img.shields.io/badge/Phase-2-blue) ![Build](https://img.shields.io/badge/Build-Success-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ 功能

### ✅ Phase 1 — 核心文件管理
- 文件浏览器（列表/网格视图，文件夹树，面包屑导航）
- 文件上传（拖拽上传 + 多文件 + 进度条）
- 文件下载（断点续传 Range 支持）
- 文件夹 CRUD（创建/重命名/移动）
- 回收站（软删除 + 恢复 + 永久删除）
- 文件搜索（关键词模糊搜索）
- JWT 用户认证（注册/登录/登出）

### ✅ Phase 2 — 媒体预览 + 缩略图
- 图片大图预览（Lightbox 效果，左右翻页，键盘导航）
- 视频播放器（自定义控制栏，进度条，音量）
- 音频播放器（Canvas 波形可视化）
- 缩略图（懒加载 + 图片 Thumbnailator + 视频 FFmpeg 截图）
- 媒体库（按类型 Tab 切换，无限滚动）
- 照片墙（按年月分组）

### ⏳ Phase 3 — 安卓端 App (React Native)
### ⏳ Phase 4 — 文件同步 + 分享链接
### ⏳ Phase 5 — 部署到云服务器

---

## 🛠 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **后端** | Java Spring Boot 3 | 3.3.5 |
| **数据库** | H2 (开发) / PostgreSQL (生产) | — |
| **ORM** | Spring Data JPA + Hibernate | 6.5.3 |
| **安全** | Spring Security + JWT (jjwt) | 0.12.x |
| **缩略图** | Thumbnailator + FFmpeg | 0.4.20 |
| **Web 前端** | React 18 + TypeScript + Ant Design 5 + Tailwind CSS | — |
| **构建** | Vite 5 | — |
| **安卓** | React Native (Expo) | 后续 |

---

## 📁 项目结构

```
nas/
├── backend/             # Spring Boot 后端
│   ├── pom.xml           # Maven 依赖
│   └── src/main/java/com/nas/
│       ├── config/       # SecurityConfig, CorsConfig, StorageConfig
│       ├── controller/   # AuthController, FileController, MediaController
│       ├── model/        # User, FileEntity, MediaMeta
│       ├── repository/   # JPA Repository 层
│       ├── service/      # AuthService, FileService, MediaService, ThumbnailService
│       ├── security/     # JwtTokenProvider, JwtAuthenticationFilter
│       ├── dto/          # ApiResponse, LoginRequest, FileResponse, MediaResponse
│       └── exception/    # GlobalExceptionHandler
├── web/                  # React 前端
│   └── src/
│       ├── api/          # Axios API 封装 (auth, files, media)
│       ├── components/   # FileTree, FileList, FileGrid, ImagePreview, VideoPlayer...
│       ├── pages/        # Login, Register, FileBrowser, MediaLibrary, PhotoWall
│       ├── stores/       # Zustand 状态管理 (auth, files)
│       └── utils/        # 格式化工具
├── mobile/               # React Native 安卓端 (待开发)
└── docker-compose.yml    # 部署编排
```

---

## 🚀 快速开始

### 环境要求
- JDK 17+
- Maven 3.9+
- Node.js 18+
- FFmpeg (用于视频缩略图，可选)

### 后端
```bash
cd nas/backend

# 开发环境 (H2 内存数据库)
mvn clean package -DskipTests
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=dev

# API 文档: http://localhost:8080/swagger-ui.html
# H2 控制台: http://localhost:8080/h2-console
```

### 前端
```bash
cd nas/web
npm install
npm run dev

# 打开: http://localhost:3000
```

### 配置
```bash
# 生产环境 JWT 密钥 (必须)
export JWT_SECRET="your-256-bit-base64-encoded-secret"

# FFmpeg 路径
export FFMPEG_PATH="/usr/bin/ffmpeg"
```

---

## 📡 API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 → JWT |
| GET | `/api/auth/me` | 当前用户 |

### 文件管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/files` | 文件列表 (分页/排序) |
| GET | `/api/files/tree` | 文件夹树 |
| POST | `/api/files/folder` | 创建文件夹 |
| PUT | `/api/files/{id}` | 重命名/移动 |
| DELETE | `/api/files` | 批量删除 (回收站) |
| GET | `/api/files/trash` | 回收站列表 |
| POST | `/api/files/trash/restore` | 恢复 |
| POST | `/api/files/upload` | 上传文件 |
| GET | `/api/files/{id}/download` | 下载 (Range) |
| GET | `/api/files/search?q=` | 搜索 |

### 媒体库
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/media?type=image` | 媒体列表 |
| GET | `/api/media/timeline` | 时间轴 |
| GET | `/api/media/{id}/thumbnail` | 缩略图 |

---

## 🔒 安全

- JWT 认证 (24h 有效期)
- BCrypt 密码加密
- 路径遍历防护
- 用户数据隔离 (userId 校验)
- 统一异常处理 (不暴露内部信息)

---

## 📝 License

MIT — [qiuyingmu](https://github.com/qiuyingmu)
