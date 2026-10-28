# syntax=docker/dockerfile:1

# ---------- Этап 1: установка зависимостей ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && mkdir -p node_modules

# ---------- Этап 2: финальный образ ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    APP_ENV=production \
    HTTP_PORT=8080

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY cmd ./cmd
COPY internal ./internal

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.HTTP_PORT+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "cmd/app/index.js"]