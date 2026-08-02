FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json ./

RUN npm ci --only=production --ignore-scripts

RUN npm ci --only=development --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN npm prune --production

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl tini

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs appuser

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/server.js"]
