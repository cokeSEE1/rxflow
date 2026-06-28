# ============================================================
# Stage 1: 构建阶段 — 编译 TypeScript
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ============================================================
# Stage 2: 运行阶段 — 最小镜像，仅生产依赖
# ============================================================
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl && \
    addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma/schema.prisma ./prisma/

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Prisma migrate 需要写入 engines 目录
RUN chown -R appuser:appgroup /app/node_modules

USER appuser

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
