#!/bin/sh
set -e

echo "⏳ 等待数据库就绪..."
# 简单等待 MySQL 端口可用（docker-compose 中 depends_on + healthcheck 更可靠）
# 这里保留作为额外保障
sleep 3

echo "📦 执行数据库迁移..."
npx prisma migrate deploy

echo "🚀 启动服务..."
exec node dist/index.js
