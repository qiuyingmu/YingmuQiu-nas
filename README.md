# YingmuQiu-nas — 个人云NAS

[![Phase](https://img.shields.io/badge/Phase-5-blue)]()
[![Build](https://img.shields.io/badge/Build-Success-green)]()
[![Tests](https://img.shields.io/badge/Tests-36/36-passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

个人云存储系统 — 支持 Web 端 + 安卓端访问，一键 Docker 部署到云服务器。

---

## Feature Overview

### Phase 1 — File Management
- File explorer (list/grid view, folder tree, breadcrumb nav)
- File upload (drag & drop, multi-file, progress bar)
- File download (resumable Range header support)
- Folder CRUD (create, rename, move)
- Trash bin (soft delete, restore, permanent delete)
- File search (fuzzy keyword)
- JWT auth (register, login, logout)

### Phase 2 — Media Preview & Thumbnails
- Image lightbox (fullscreen, prev/next, keyboard nav, EXIF display)
- Video player (custom controls: play/pause, progress, volume, fullscreen)
- Audio player (custom UI, Canvas waveform visualization)
- Thumbnails (lazy loading, IntersectionObserver, Skeleton loading)
- Media library (tab by type, infinite scroll, grid/list view)
- Photo wall (grouped by year-month, year navigation)

### Phase 3 — Android App (React Native + Expo)
- Expo managed workflow, TypeScript
- Server setup screen (first-launch config)
- Login & Register screens
- File browser (FlatList, folder navigation, thumbnails)
- Media library (grid view, tab by type)
- Settings (user info, server URL, logout)
- Auth persisted via AsyncStorage

### Phase 4 — Share Links & WebSocket Sync
- Generate share links for files/folders
- Password protection (BCrypt) + expiry time + download limit
- Public share page (`/s/:token`, no login required)
- WebSocket real-time sync (`/ws/files`)
- Auto-refresh file list on multi-device changes
- Share management (list, cancel)

### Phase 5 — Docker Deployment
- Multi-stage Docker build (Maven → Node → JRE+Alpine)
- Docker Compose (app + PostgreSQL 16)
- Nginx reverse proxy (static files, API, WebSocket)
- SSL/HTTPS via Certbot
- Production config with env variable injection
- Auto CI/CD ready

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 3.3, Spring Security, Spring Data JPA |
| **Database** | H2 (dev) / PostgreSQL 16 (prod) |
| **ORM** | Hibernate 6 + Flyway (optional) |
| **Auth** | JWT (jjwt 0.12.x), BCrypt |
| **Thumbnails** | Thumbnailator (images) + FFmpeg (videos) |
| **Metadata** | metadata-extractor (EXIF, GPS) |
| **Web Frontend** | React 18, TypeScript, Ant Design 5, Tailwind CSS, Vite 5 |
| **State** | Zustand (persisted auth) |
| **Android** | React Native, Expo 52, TypeScript |
| **Deploy** | Docker, Docker Compose, Nginx, Certbot |

---

## Project Structure

```
nas/
├── backend/                    # Spring Boot API server
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/main/java/com/nas/
│   │   ├── config/             # Security, CORS, WebSocket, Storage
│   │   ├── controller/         # Auth, File, Media, Share, PublicShare
│   │   ├── model/              # User, FileEntity, MediaMeta, ShareLink
│   │   ├── repository/         # JPA repositories
│   │   ├── service/            # Business logic (6 services)
│   │   ├── security/           # JWT provider, filter, UserDetails
│   │   ├── websocket/          # FileChangeHandler
│   │   ├── dto/                # Request/response DTOs
│   │   └── exception/          # Global exception handler
│   └── src/main/resources/
│       ├── application.yml         # Base config
│       ├── application-dev.yml     # H2 dev config
│       └── application-prod.yml    # PostgreSQL prod config
├── web/                        # React SPA frontend
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── api/                # Axios: auth, files, media, share
│       ├── components/         # 15+ UI components
│       ├── pages/              # Login, Register, FileBrowser, MediaLibrary,
│       │                       # PhotoWall, ShareView
│       ├── hooks/              # useWebSocket
│       ├── stores/             # Zustand: auth, files
│       └── utils/              # Format helpers
├── mobile/                     # React Native Android app (Expo)
│   ├── package.json
│   ├── app.json
│   └── src/
│       ├── api/                # client, auth, files
│       ├── screens/            # ServerSetup, Login, Register, Home,
│       │                       # Media, Settings
│       ├── components/         # FileListItem, ImagePreview
│       ├── context/            # AuthContext (persisted)
│       └── utils/              # Format helpers
├── deploy/                     # Deployment config
│   ├── docker-compose.yml      # App + PostgreSQL
│   ├── nginx.conf              # Reverse proxy
│   ├── entrypoint.sh           # Container startup
│   └── .env.example            # Environment variables template
├── start.bat                   # One-click local launcher (Windows)
├── integration-test.ps1        # Automated integration tests (36 tests)
├── DEPLOY.md                   # Deployment guide
└── README.md                   # This file
```

---

## Quick Start (Local Dev)

### Prerequisites
- JDK 17+ (`java -version`)
- Maven 3.9+ (`mvn -version`)
- Node.js 18+ (`node -v`)
- FFmpeg (optional, for video thumbnails)

### One-Click (Windows)
Double-click **`start.bat`** — it will auto-start both backend and frontend.

### Manual

```bash
# 1. Start backend
cd backend
mvn clean package -DskipTests
java -jar target/nas-backend-1.0.0.jar --spring.profiles.active=dev
# Backend: http://localhost:8080

# 2. Start frontend
cd ../web
npm install
npm run dev
# Frontend: http://localhost:3000
```

### Run Tests

```powershell
# Automated integration tests (36 tests)
powershell -ExecutionPolicy Bypass -File integration-test.ps1
```

---

## API Reference

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | - | Register (username, email, password) |
| POST | `/login` | - | Login -> JWT token |
| GET | `/me` | JWT | Current user info |

### Files (`/api/files`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | File list (paginated, sorted) |
| GET | `/tree` | Folder tree |
| POST | `/folder` | Create folder |
| PUT | `/{id}` | Rename / Move |
| DELETE | `/` | Batch delete (to trash) |
| GET | `/trash` | Trash list |
| POST | `/trash/restore` | Restore from trash |
| DELETE | `/trash/empty` | Permanently delete |
| POST | `/upload` | Upload file (multipart) |
| GET | `/{id}/download` | Download (Range support) |
| GET | `/search?q=` | Search files by name |

### Media (`/api/media`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Media list (type filter, paginated) |
| GET | `/timeline` | Timeline (grouped by year-month) |
| GET | `/{id}` | Media detail |
| GET | `/{id}/thumbnail` | Thumbnail image (small/medium) |
| GET | `/locations` | Media with GPS coordinates |

### Shares (`/api/shares` — auth required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create share link |
| DELETE | `/{id}` | Cancel share |
| GET | `/` | My share list |
| GET | `/{fileId}/status` | Check file share status |

### Public Share (`/api/s/{token}` — no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get share info (hasPassword flag) |
| POST | `/verify` | Verify password -> verifyToken |
| GET | `/download` | Download shared file |

### WebSocket
| Path | Description |
|------|-------------|
| `/ws/files?userId=&token=` | Real-time file change notifications |

---

## Deploy to Cloud

```bash
# One-command deployment
git clone https://github.com/qiuyingmu/YingmuQiu-nas.git
cd YingmuQiu-nas
cp deploy/.env.example .env
# Edit .env with JWT_SECRET and DB_PASSWORD
docker compose -f deploy/docker-compose.yml --env-file .env up -d
```

See **[DEPLOY.md](DEPLOY.md)** for detailed instructions (Nginx, HTTPS, PostgreSQL, security).

---

## Testing

| Suite | Tests | Status |
|-------|-------|--------|
| Registration | 5 | ✅ |
| Login | 3 | ✅ |
| JWT Auth | 3 | ✅ |
| File CRUD | 7 | ✅ |
| Trash | 3 | ✅ |
| Media | 3 | ✅ |
| Search | 1 | ✅ |
| Permission Isolation | 2 | ✅ |
| Edge Cases | 4 | ✅ |
| Share Links | 5 | ✅ |
| **Total** | **36** | **✅ All Passing** |

Run tests: `powershell -ExecutionPolicy Bypass -File integration-test.ps1`

---

## Security

- JWT authentication (24h expiry)
- BCrypt password hashing
- Path traversal protection
- User data isolation (userId validation)
- Unified exception handling (no internal info leak)
- 401 response for invalid/missing tokens (not 500)
- Input validation (password length, username format)
- Duplicate name prevention (including root-level)
- Share link password protection + expiry + download limit

---

## License

MIT — [qiuyingmu](https://github.com/qiuyingmu)
