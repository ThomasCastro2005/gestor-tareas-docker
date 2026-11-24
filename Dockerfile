FROM node:22-alpine AS pruebas
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY test ./test
RUN npm test

FROM node:22-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine
LABEL org.opencontainers.image.title="gestor-tareas" \
      org.opencontainers.image.description="API del gestor de tareas de Thomas Castro"
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public
USER node
EXPOSE 3000
HEALTHCHECK --start-period=25s --interval=10s --timeout=3s --retries=8 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/servidor.js"]
