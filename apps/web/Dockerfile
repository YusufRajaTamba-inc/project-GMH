# ===== Stage 1: Build frontend Vite =====
# Build di dalam image supaya VITE_API_BASE_URL selalu ter-bake dari ARG
# (default: path relatif /api/v1 yang di-proxy nginx ke service "api").
FROM node:22-alpine AS build
WORKDIR /app

# ARG build-time: diubah lewat `docker build --build-arg` atau compose `build.args`.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/
RUN npm ci && npm install @rolldown/binding-linux-x64-musl@1.2.16 --workspace=web --no-save

COPY apps/web ./apps/web
RUN npm run build --workspace=web

# ===== Stage 2: Runtime nginx =====
FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
