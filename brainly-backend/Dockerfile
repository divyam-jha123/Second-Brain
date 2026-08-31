# syntax=docker/dockerfile:1

# ─── Stage 1: build ─────────────────────────────────────────────────
# Compiles src/ -> dist/ with the full dependency tree, then strips the
# dev packages back out so the runtime stage can copy node_modules as-is.
FROM node:22-alpine AS builder

WORKDIR /app

# mongodb-memory-server is a devDependency; keep it from pulling a mongod
# binary down during install — it is never used inside the image.
ENV MONGOMS_DISABLE_POSTINSTALL=1

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ─── Stage 2: dev ───────────────────────────────────────────────────
# Hot-reload target. Keeps the full dependency tree (nodemon, typescript)
# and expects src/ to be bind-mounted over from the host.
FROM node:22-alpine AS dev

WORKDIR /app

ENV MONGOMS_DISABLE_POSTINSTALL=1
ENV NODE_ENV=development
ENV PORT=8000

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

EXPOSE 8000

# -L (polling) because inotify events do not cross Docker Desktop's
# bind mounts on macOS reliably.
CMD ["npm", "run", "dev:watch"]

# ─── Stage 3: runtime ───────────────────────────────────────────────
FROM node:22-alpine AS runtime

# tini reaps zombies and forwards SIGTERM/SIGINT so `docker stop` is clean.
RUN apk add --no-cache tini

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

COPY --chown=node:node package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 8000

# Any HTTP response means Express is accepting connections; the app has no
# dedicated health route, and every real route sits behind Clerk auth.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT,path:'/'},r=>process.exit(0)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
