# YingmuQiu-nas

个人云存储系统 — Web 端 + 安卓端。一键 Docker 部署。

## 功能

- **文件管理**: 浏览、上传、下载、搜索、重命名、移动
- **媒体预览**: 图片/视频/音频播放、EXIF 信息、照片墙
- **回收站**: 软删除、恢复、永久删除
- **分享链接**: 密码保护、有效期、下载次数限制
- **WebSocket 同步**: 多设备实时同步文件变更
- **安卓端**: React Native App，文件浏览、媒体查看
- **Docker 部署**: 一键部署到云服务器

## 快速部署

```bash
ssh root@your-server
curl -sSL https://raw.githubusercontent.com/qiuyingmu/YingmuQiu-nas/main/deploy/deploy.sh | bash
```

## 技术栈

| 层 | 技术 |
|---|------|
| 后端 | Java 17, Spring Boot 3, PostgreSQL, JWT, WebSocket |
| Web 前端 | React 18, TypeScript, Vite, Ant Design 5, Tailwind CSS |
| 安卓端 | React Native, Expo |
| 部署 | Docker Compose, Nginx |

## 本地开发

```bash
# 后端
cd backend && mvn clean package -DskipTests
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=dev

# 前端
cd ../web && npm install && npm run dev
# 访问 http://localhost:3000
```

## 测试

```powershell
powershell -ExecutionPolicy Bypass -File integration-test.ps1
```

## License

MIT — [qiuyingmu](https://github.com/qiuyingmu)
