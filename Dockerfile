# ==============================
# STAGE 1 — BUILD DO ANGULAR
# ==============================
FROM node:20-alpine AS build

WORKDIR /app

# Dependências primeiro (melhor cache)
COPY package.json package-lock.json ./
RUN npm ci

# Código
COPY . .

# Build de produção (gera dist/.../browser)
RUN npm run build -- --configuration=production


# ==============================
# STAGE 2 — NGINX (RUNTIME)
# ==============================
FROM nginx:alpine

# Config SPA do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove conteúdo default do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia o build do Angular (browser) para a RAIZ do nginx
COPY --from=build /app/dist/sitemaControleAgendamentos/browser/ /usr/share/nginx/html/

# Healthcheck simples
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
