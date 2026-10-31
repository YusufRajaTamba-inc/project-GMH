FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
RUN npm ci
COPY apps/api ./apps/api
RUN npm run build --workspace=api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
RUN npm ci --workspace=api --omit=dev && npm cache clean --force
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/src/database/schema.sql apps/api/src/database/seeds.sql ./apps/api/dist/database/
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
