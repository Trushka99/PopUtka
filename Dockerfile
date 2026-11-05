# ---------- build ----------
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Можно переопределить: docker compose build --build-arg VITE_API_URL=...
ARG VITE_API_URL=https://api.pop-utka.uz
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build-only

# ---------- runtime ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
