# 部署到云服务器

## 前置要求

- 云服务器（2核4G以上，Ubuntu 22.04+）
- Docker + Docker Compose
- 域名（可选，推荐）
- FFmpeg 安装

## 快速部署

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
```

## Nginx + HTTPS（推荐）

使用反向代理 + Certbot 为域名配置 HTTPS：

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

## 单独部署（不用 Docker）

```bash
# 后端
cd backend
mvn clean package -DskipTests
export JWT_SECRET=...
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/nasdb
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=prod

# 前端
cd web
npm install
npm run build
# 用 nginx 或 caddy 托管 web/dist 目录
```

## 数据库迁移

- 开发环境用 H2，DDL auto
- 生产环境建议用 PostgreSQL + Flyway 或手动管理 schema
- 首次启动可临时设 `ddl-auto: update` 建表，然后改为 `validate`

## 安全注意事项

1. 生产环境务必关闭 H2 Console
2. JWT_SECRET 必须使用强随机密钥（至少256位）
3. 启用 HTTPS
4. 限制存储目录权限
5. 定期备份 PostgreSQL 数据库
6. 配置防火墙只开放 80/443 端口
7. 不要将 `.env` 文件提交到 Git
