FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.31.5-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Note: the stock nginx image runs its master as root and drops workers to the
# "nginx" user — required to bind port 80. To run fully unprivileged, base off
# nginxinc/nginx-unprivileged and expose 8080 instead.
