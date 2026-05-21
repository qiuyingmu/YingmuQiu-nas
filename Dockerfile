# Build stage - backend
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app/backend
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Build stage - frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy backend jar
COPY --from=backend-build /app/backend/target/nas-backend-1.0.0.jar ./app.jar

# Copy frontend build
COPY --from=frontend-build /app/web/dist ./dist

# Copy nginx and ffmpeg (for video thumbnails)
RUN apk add --no-cache nginx ffmpeg
COPY deploy/nginx.conf /etc/nginx/http.d/default.conf

# Entrypoint: start nginx + java
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 8080
ENTRYPOINT ["/entrypoint.sh"]
