# ============================================================
# Stage 1: 构建阶段 — 编译 TypeScript
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# 1) 先复制依赖文件，利用 Docker 层缓存
COPY package.json package-lock.json ./
RUN npm ci

# 2) 复制 Prisma schema，生成客户端
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate

# 3) 复制源码并编译
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ============================================================
# Stage 2: 运行阶段 — 最小镜像，仅生产依赖
# ============================================================
FROM node:22-alpine

WORKDIR /app

# 安全：非 root 用户运行
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# 生产依赖
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma/schema.prisma ./prisma/

# 复制启动脚本
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER appuser

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
