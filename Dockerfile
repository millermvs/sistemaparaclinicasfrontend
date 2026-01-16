# ==============================
# STAGE 1 — BUILD DO ANGULAR
# ==============================

# Usamos Node 20 porque seu projeto é Angular 20
FROM node:20-alpine AS build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copiamos primeiro apenas os arquivos de dependência
# Isso ajuda o Docker a reaproveitar cache quando o código muda,
# mas as dependências não.
COPY package.json package-lock.json ./

# Instala as dependências exatamente como definidas no package-lock
# npm ci é mais previsível e recomendado para ambientes de CI/CD
RUN npm ci

# Agora copiamos TODO o resto do projeto
COPY . .

# Executa o build de produção do Angular
# Isso vai gerar a pasta:
# dist/sitemaControleAgendamentos/browser
RUN npm run build -- --configuration production


# ==============================
# STAGE 2 — NGINX (RUNTIME)
# ==============================

# Agora entramos em uma imagem leve só para servir arquivos estáticos
FROM nginx:alpine

# Copia a configuração do Nginx
# Aqui entra o try_files /index.html para SPA funcionar
COPY nginx.conf /etc/nginx/conf.d/default.conf

# (Recomendado) remove o conteúdo padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia o conteúdo do build (pasta browser) DIRETO para a raiz do nginx
# Assim o /index.html vira o do Angular, e não o "Welcome to nginx"
COPY --from=build /app/dist/sitemaControleAgendamentos/browser/. /usr/share/nginx/html/

# Expõe a porta 80 (padrão do Nginx)
EXPOSE 80

# Sobe o Nginx em primeiro plano (obrigatório em containers)
CMD ["nginx", "-g", "daemon off;"]

