# 🏠 YingmuQiu-nas — 个人云NAS / Personal Cloud NAS

> **中文** | [English](#english)

[![Phase](https://img.shields.io/badge/Phase-5-green)]()
[![Build](https://img.shields.io/badge/Build-Success-brightgreen)]()
[![Tests](https://img.shields.io/badge/Tests-36/36-passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()
[![Docker](https://img.shields.io/badge/Docker-ready-blue)]()

---

## 🇨🇳 中文

### 简介

个人云存储系统 — Web 端 + 安卓端，一键 Docker 部署到云服务器。

- **后端**: Java 17, Spring Boot 3, PostgreSQL, JWT
- **前端**: React 18, TypeScript, Ant Design 5
- **安卓**: React Native, Expo
- **部署**: Docker Compose, Nginx

### 功能

| Phase | 功能 | 完成 |
|-------|------|:----:|
| 1 | 文件管理、用户认证、回收站、搜索 | ✅ |
| 2 | 图片预览、视频播放、缩略图、照片墙 | ✅ |
| 3 | 安卓端 App (React Native + Expo) | ✅ |
| 4 | 分享链接（密码/有效期/下载次数）、WebSocket多设备同步 | ✅ |
| 5 | Docker 部署、Nginx、PostgreSQL、SSL | ✅ |

### 快速部署

```bash
# 方式1: 一键部署到云服务器
ssh root@your-server
curl -sSL https://raw.githubusercontent.com/qiuyingmu/YingmuQiu-nas/main/deploy/deploy.sh | bash

# 方式2: 本地 Docker 启动
git clone https://github.com/qiuyingmu/YingmuQiu-nas.git
cd YingmuQiu-nas
cp deploy/.env.example .env
# 编辑 .env 填入 JWT_SECRET
docker compose -f deploy/docker-compose.yml --env-file .env up -d
```

### 本地开发

```bash
# 后端
cd backend
mvn clean package -DskipTests
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=dev

# 前端
cd ../web
npm install && npm run dev

# 访问 http://localhost:3000
```

### 测试

```powershell
powershell -ExecutionPolicy Bypass -File integration-test.ps1
# 36项测试全部通过
```

---

## 🇬🇧 English

### Overview

Personal Cloud NAS with Web + Android clients, one-click Docker deployment.

- **Backend**: Java 17, Spring Boot 3, PostgreSQL, JWT
- **Frontend**: React 18, TypeScript, Ant Design 5
- **Android**: React Native, Expo
- **Deploy**: Docker Compose, Nginx, SSL

### Features

| Phase | Feature | Status |
|-------|---------|:-----:|
| 1 | File management, JWT auth, trash, search | ✅ |
| 2 | Image/Video/Audio preview, thumbnails, photo wall | ✅ |
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
# Edit .env with JWT_SECRET
docker compose -f deploy/docker-compose.yml --env-file .env up -d
```

### Local Development

```bash
# Backend
cd backend
mvn clean package -DskipTests
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=dev

# Frontend
cd ../web
npm install && npm run dev

# Open http://localhost:3000
```

### Testing

```powershell
powershell -ExecutionPolicy Bypass -File integration-test.ps1
# 36 tests all passing
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

- JWT 24h + BCrypt
- Path traversal protection
- User data isolation
- 401 for invalid/fake tokens (not 500)
- Input validation (password length, username format)
- Share: password protection + expiry + download limit

---

## 📝 License

MIT — [qiuyingmu](https://github.com/qiuyingmu)
