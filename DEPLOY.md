# YingmuQiu-nas 部署文档 / Deployment Guide

> **中文** | [English](#english)

[![Deploy](https://img.shields.io/badge/Deploy-Docker_Compose-blue)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL_16-blue)]()

---

## 🇨🇳 部署指南

### 前置要求

- 云服务器（2核4G以上，Ubuntu 22.04+）
- Docker + Docker Compose
- 域名（可选，推荐）
- FFmpeg 安装

### 快速部署

```bash
# 1. 克隆项目
git clone https://github.com/qiuyingmu/YingmuQiu-nas.git
cd YingmuQiu-nas

# 2. 配置环境变量
cp deploy/.env.example .env
# 编辑 .env 填入 JWT_SECRET 和 DB_PASSWORD

# 3. 启动
docker compose -f deploy/docker-compose.yml --env-file .env up -d

# 4. 查看日志
docker compose -f deploy/docker-compose.yml logs -f

# 5. 重新构建部署（拉取最新代码后）
git pull
docker compose -f deploy/docker-compose.yml up -d --build
```

### 系统编码说明

系统默认全链路 UTF-8 编码：

| 层级 | 配置 | 说明 |
|------|------|------|
| Nginx | `charset utf-8;` | 静态资源 + API 响应 UTF-8 |
| JVM | `-Dfile.encoding=UTF-8` | 容器内 Java 编码 |
| Spring Boot | `server.servlet.encoding.force=true` | 强制全部响应 UTF-8 |
| PostgreSQL | `--encoding=UTF-8` | 数据库字符集 |
| 文件下载 | `filename*=UTF-8''` | 中文文件名 URL 编码 |

### Nginx + HTTPS（推荐）

```bash
# 安装 nginx + certbot
apt install nginx certbot python3-certbot-nginx

# 配置反向代理
# /etc/nginx/sites-available/nas.yourdomain.com
server {
    listen 80;
    server_name nas.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

# SSL
certbot --nginx -d nas.yourdomain.com
```

### 数据库迁移

- 开发环境用 H2，DDL auto
- 生产环境建议用 PostgreSQL + Flyway 或手动管理 schema
- 首次启动可临时设 `ddl-auto: update` 建表，然后改为 `validate`
- 数据库使用 UTF-8 编码存储中文

### 安全注意事项

1. 生产环境务必关闭 H2 Console
2. JWT_SECRET 必须使用强随机密钥（至少256位）
3. 启用 HTTPS
4. 限制存储目录权限
5. 定期备份 PostgreSQL 数据库
6. 配置防火墙只开放 80/443 端口
7. 不要将 `.env` 文件提交到 Git

---

## 🇬🇧 English

### Prerequisites

- Cloud server (2C4G+, Ubuntu 22.04+)
- Docker + Docker Compose
- Domain name (recommended)
- FFmpeg

### Quick Start

```bash
# 1. Clone
git clone https://github.com/qiuyingmu/YingmuQiu-nas.git
cd YingmuQiu-nas

# 2. Environment
cp deploy/.env.example .env
# Edit .env with JWT_SECRET and DB_PASSWORD

# 3. Start
docker compose -f deploy/docker-compose.yml --env-file .env up -d
```

### Encoding

Full-stack UTF-8 encoding:

| Layer | Config | Note |
|-------|--------|------|
| Nginx | `charset utf-8;` | Static + API UTF-8 |
| JVM | `-Dfile.encoding=UTF-8` | Java encoding in container |
| Spring Boot | `server.servlet.encoding.force=true` | Force UTF-8 responses |
| PostgreSQL | `--encoding=UTF-8` | Database charset |
| Downloads | `filename*=UTF-8''` | Chinese filename support |

### Nginx + HTTPS

```bash
apt install nginx certbot python3-certbot-nginx
# Configure reverse proxy (see Chinese section above)
certbot --nginx -d nas.yourdomain.com
```

### Security

1. Disable H2 Console in production
2. Use strong JWT_SECRET (256-bit minimum)
3. Enable HTTPS
4. Restrict storage directory permissions
5. Regular PostgreSQL backup
6. Firewall: only allow port 80/443
7. Never commit `.env` to Git
