# YingmuQiu-nas · 个人云NAS

[![Phase](https://img.shields.io/badge/Phase-5-green)]()
[![Tests](https://img.shields.io/badge/Tests-31/31-passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

个人云存储系统 — Web 端 + 安卓端，一键 Docker 部署。

## 功能

| Phase | 功能 |
|-------|------|
| 1 | 文件管理、认证、回收站、搜索 |
| 2 | 图片/视频/音频预览、缩略图、照片墙、EXIF |
| 3 | 安卓端 App (React Native + Expo) |
| 4 | 分享链接（密码/有效期/下载次数）、WebSocket 多设备同步 |
| 5 | Docker 部署、Nginx、PostgreSQL、SSL |

## 一键部署

```bash
curl -sSL https://raw.githubusercontent.com/qiuyingmu/YingmuQiu-nas/main/deploy/deploy.sh | bash
```

或本地启动：

```bash
git clone https://github.com/qiuyingmu/YingmuQiu-nas.git
cd YingmuQiu-nas && cp deploy/.env.example .env
docker compose -f deploy/docker-compose.yml --env-file .env up -d
```

## 本地开发

```bash
cd backend && mvn clean package -DskipTests
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=dev

cd ../web && npm install && npm run dev
```

## 技术栈

后端: Java 17 / Spring Boot 3 / PostgreSQL / JWT / WebSocket
前端: React 18 / TypeScript / Vite / Ant Design 5
安卓: React Native / Expo
部署: Docker Compose / Nginx

## 测试

```powershell
powershell -ExecutionPolicy Bypass -File integration-test.ps1
```

## License

MIT — [qiuyingmu](https://github.com/qiuyingmu)
