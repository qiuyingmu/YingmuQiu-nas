# Changelog

## [1.0.0] - 2026-05-21

### Added
- Phase 1: File management (upload/download/folder/rename/move/trash/search)
- Phase 2: Media preview (image/video/audio), thumbnails, EXIF extraction, photo wall
- Phase 3: Android App (React Native + Expo) with custom server URL support
- Phase 4: Share links (password/expiry/download limit), WebSocket real-time sync
- Phase 5: Docker Compose deploy (PostgreSQL + Nginx + SSL), one-click deploy script
- JWT authentication with BCrypt password hashing
- User data isolation, path traversal protection
- Swagger API documentation (OpenAPI 3)
- 31-item integration test suite (PowerShell)

### Optimized (2026-05-21)
- MediaService: database-level paging via JPQL JOIN instead of full-table load + memory filtering
- Frontend: Vite manualChunks code splitting (main bundle from 1.3MB to 60KB)
- JPA: open-in-view disabled to eliminate startup warning
- TypeScript: fixed User.id type mismatch (number → string), aligned API contracts
- Client: token storage access encapsulated with constant key
