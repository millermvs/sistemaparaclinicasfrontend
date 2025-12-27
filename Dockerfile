FROM nginx:alpine

# Config do Nginx para SPA (Angular)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build do Angular
COPY dist/sitemaControleAgendamentos /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
