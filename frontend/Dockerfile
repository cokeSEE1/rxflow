# ============================================================
# Stage 1: 构建阶段 — Vite build
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# 1) 依赖安装（利用缓存）
COPY package.json package-lock.json ./
RUN npm ci

# 2) 源码 + 构建
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/

# 3) Vite 生产构建
RUN npm run build

# ============================================================
# Stage 2: 运行阶段 — Nginx 静态服务
# ============================================================
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
