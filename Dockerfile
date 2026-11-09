# =============================================================================
# Backend image — Express 4 + Mongoose 8
#
# Your backend is plain CommonJS JavaScript, so there is nothing to compile.
# We still use two stages, because the dependency install is the slow part and
# we want it cached separately from your source code.
# =============================================================================

# ----------------------------------------------------------------------------
# Stage 1: deps — production dependencies only
# ----------------------------------------------------------------------------
FROM node:20.18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

# --omit=dev skips devDependencies. For this project that drops nodemon, which
# has no business being in a production image.
# `npm ci` installs the exact locked versions, so the image is reproducible.
RUN npm ci --omit=dev

# ----------------------------------------------------------------------------
# Stage 2: runner
# ----------------------------------------------------------------------------
FROM node:20.18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# src/config/env.js reads PORT and defaults to 5000. Set it explicitly so the
# value is visible in the image rather than hidden in a default.
ENV PORT=5000

# dumb-init is a 1-file init system. Node, when it is process ID 1 inside a
# container, does not receive Unix signals the way it normally would, so a
# plain `docker stop` would kill it after a 10 second timeout instead of letting
# it shut down cleanly. dumb-init forwards SIGTERM properly, which lets the
# graceful shutdown already written in src/server.js actually run: it stops
# accepting connections, then closes the Mongoose connection.
RUN apk add --no-cache dumb-init

COPY --from=deps /app/node_modules ./node_modules

# Copy only what the server needs at runtime. scripts/ is included because you
# will run `npm run seed:admin` inside this container to create your admin login.
COPY package.json ./
COPY src ./src
COPY scripts ./scripts

# Run unprivileged. There is nothing for this process to write to disk —
# multer uses memoryStorage() and sends files straight to Cloudinary — so the
# whole filesystem can stay read-only as far as the app is concerned.
RUN chown -R node:node /app
USER node

EXPOSE 5000

# src/app.js exposes GET /health (note: NOT under /api), which returns
# { success: true, data: { status: 'ok', uptime } }. Perfect for this check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

# Matches the "start" script in package.json: node src/server.js
CMD ["node", "src/server.js"]
