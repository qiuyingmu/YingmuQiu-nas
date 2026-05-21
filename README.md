# 🏠 YingmuQiu-nas — 个人云NAS / Personal Cloud NAS

> **中文** | [English](#english)

[![Phase](https://img.shields.io/badge/Phase-5-green)]()
[![Build](https://img.shields.io/badge/Build-Success-brightgreen)]()
[![Tests](https://img.shields.io/badge/Tests-31/31-passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ready-blue)]()
[![Java](https://img.shields.io/badge/Java-17-orange)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen)]()
[![React](https://img.shields.io/badge/React-18-61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)]()

---

## 📋 目录

- [简介 / Overview](#简介)
- [功能 / Features](#功能)
- [项目结构 / Structure](#项目结构)
- [快速部署 / Quick Deploy](#快速部署)
- [本地开发 / Development](#本地开发)
- [API 参考 / API Reference](#-api-reference)
- [安全 / Security](#-security)
- [测试 / Testing](#测试)
- [许可证 / License](#-license)

---

## 🇨🇳 简介

个人云存储系统 — Web 端 + 安卓端，一键 Docker 部署到云服务器。

- **后端**: Java 17, Spring Boot 3, PostgreSQL / H2, JWT, WebSocket
- **前端**: React 18, TypeScript, Vite, Ant Design 5, Tailwind CSS, Zustand
- **安卓**: React Native, Expo
- **部署**: Docker Compose, Nginx, SSL

### 项目结构

```
YingmuQiu-nas/
├── backend/                    # Java Spring Boot 后端
│   └── src/main/java/com/nas/
│       ├── config/             # Security / Storage / WebSocket / CORS
│       ├── controller/         # REST API 控制器
│       ├── service/            # 业务逻辑层
│       ├── repository/         # JPA 数据访问
│       ├── model/              # 实体模型
│       ├── security/           # JWT 认证 / 过滤器
│       ├── websocket/          # WebSocket 实时推送
│       ├── dto/                # 数据传输对象
│       └── exception/          # 全局异常处理
├── web/                        # React 前端
│   └── src/
│       ├── pages/              # 页面组件
│       ├── components/         # 通用组件
│       ├── api/                # API 客户端
│       ├── stores/             # Zustand 状态管理
│       └── hooks/              # 自定义 Hooks
├── mobile/                     # React Native 安卓端
├── deploy/                     # Docker / Nginx 部署配置
└── integration-test.ps1        # PowerShell 集成测试套件
```

---

### 功能

| Phase | 功能 | 完成 |
|-------|------|:----:|
| 1 | 文件管理、用户认证、回收站、搜索 | ✅ |
| 2 | 图片预览、视频播放、缩略图、照片墙、EXIF | ✅ |
| 3 | 安卓端 App (React Native + Expo) | ✅ |
| 4 | 分享链接（密码/有效期/下载次数）、WebSocket 多设备同步 | ✅ |
| 5 | Docker 部署、Nginx、PostgreSQL、SSL | ✅ |

---

### 快速部署

```bash
# 方式1: 一键部署到云服务器
ssh root@your-server
curl -sSL https://raw.githubusercontent.com/qiuyingmu/YingmuQiu-nas/main/deploy/deploy.sh | bash

# 方式2: 本地 Docker 启动
git clone https://github.com/qiuyingmu/YingmuQiu-nas.git
cd YingmuQiu-nas
cp deploy/.env.example .env
# 编辑 .env 填入 JWT_SECRET 和 DB_PASSWORD
docker compose -f deploy/docker-compose.yml --env-file .env up -d
```

---

### 本地开发

```bash
# 后端 (需要 JDK 17+ Maven 3.9+)
cd backend
mvn clean package -DskipTests
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=dev

# 前端 (需要 Node.js 18+)
cd ../web
npm install && npm run dev

# 访问 http://localhost:3000
# Swagger API 文档: http://localhost:8080/swagger-ui.html
```

---

### 测试

```powershell
# 先启动后端，再运行测试：
powershell -ExecutionPolicy Bypass -File integration-test.ps1
# 31 项测试全部通过 ✅
```

测试覆盖: 注册/登录/JWT认证/文件CRUD/搜索/回收站/媒体/用户隔离/边界条件

---

## 🇬🇧 English

### Overview

Personal Cloud NAS with Web + Android clients, one-click Docker deployment.

- **Backend**: Java 17, Spring Boot 3, PostgreSQL / H2, JWT, WebSocket
- **Frontend**: React 18, TypeScript, Vite, Ant Design 5, Tailwind CSS, Zustand
- **Android**: React Native, Expo
- **Deploy**: Docker Compose, Nginx, SSL

### Features

| Phase | Feature | Status |
|-------|---------|:-----:|
| 1 | File management, JWT auth, trash, search | ✅ |
| 2 | Image/Video/Audio preview, thumbnails, photo wall, EXIF | ✅ |
| 3 | Android App (React Native + Expo) | ✅ |
| 4 | Share links (password/expiry/limit), WebSocket sync | ✅ |
| 5 | Docker deploy, Nginx, PostgreSQL, SSL | ✅ |

### Quick Deploy

```bash
# Option 1: One-click cloud deploy
ssh root@your-server
curl -sSL https://raw.githubusercontent.com/qiuyingmu/YingmuQiu-nas/main/deploy/deploy.sh | bash

# Option 2: Local Docker
git clone https://github.com/qiuyingmu/YingmuQiu-nas.git
cd YingmuQiu-nas
cp deploy/.env.example .env
# Edit .env with JWT_SECRET and DB_PASSWORD
docker compose -f deploy/docker-compose.yml --env-file .env up -d
```

### Local Development

```bash
# Backend (requires JDK 17+ Maven 3.9+)
cd backend
mvn clean package -DskipTests
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=dev

# Frontend (requires Node.js 18+)
cd ../web
npm install && npm run dev

# Open http://localhost:3000
# Swagger API: http://localhost:8080/swagger-ui.html
```

### Testing

```powershell
powershell -ExecutionPolicy Bypass -File integration-test.ps1
# 31 tests all passing ✅
```

---

## 📡 API Reference

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | - | Register |
| POST | `/login` | - | Login → JWT |
| GET | `/me` | JWT | Current user |

### Files (`/api/files`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List files (paged) |
| GET | `/tree` | Folder tree |
| POST | `/folder` | Create folder |
| PUT | `/{id}` | Rename / Move |
| DELETE | `/` | Batch delete (trash) |
| GET | `/trash` | Trash list |
| POST | `/trash/restore` | Restore |
| POST | `/upload` | Upload |
| GET | `/{id}/download` | Download (Range) |
| GET | `/search?q=` | Search |

### Media (`/api/media`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Media list |
| GET | `/timeline` | Timeline |
| GET | `/{id}` | Detail |
| GET | `/{id}/thumbnail` | Thumbnail |
| GET | `/locations` | GPS-tagged |

### Shares (`/api/shares`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ✅ | Create share |
| DELETE | `/{id}` | ✅ | Cancel |
| GET | `/` | ✅ | My shares |
| GET | `/{token}` | ❌ | Public info |
| POST | `/{token}/verify` | ❌ | Verify password |
| GET | `/{token}/download` | ❌ | Download |

---

## 🔒 Security

- JWT 24h + BCrypt 密码哈希
- 路径穿越防护 (path traversal protection)
- 用户数据隔离 (user isolation)
- 非法 Token 返回 401 (非 500)
- 输入校验 (密码长度、用户名格式、邮箱格式)
- 分享链接: 密码保护 + 有效期 + 下载次数限制

---

## 📦 技术栈 / Tech Stack

| 层级 | 技术 |
|------|------|
| 后端框架 | Spring Boot 3.3.5 |
| 安全 | Spring Security + JWT (jjwt 0.12.6) |
| 数据库 | H2 (dev) / PostgreSQL 16 (prod) |
| ORM | Hibernate 6.5 / Spring Data JPA |
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| UI 库 | Ant Design 5 + Tailwind CSS 3 |
| 状态管理 | Zustand 4 |
| 移动端 | React Native + Expo |
| 实时通信 | WebSocket (Spring + 原生 JS) |
| 部署 | Docker + Nginx + Docker Compose |
| API 文档 | SpringDoc OpenAPI (Swagger) |
| 图像处理 | Thumbnailator + metadata-extractor |
| 视频处理 | FFmpeg |

---

## 📝 License

MIT © [qiuyingmu](https://github.com/qiuyingmu) — 详见 [LICENSE](./LICENSE)

---

## 📄 更多文档

- [部署指南](./DEPLOY.md)
- [更新日志](./CHANGELOG.md)
