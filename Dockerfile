# Estágio 1: Build da aplicação Angular
FROM node:22-alpine AS build

WORKDIR /app

# Copia os arquivos de manifesto de dependências
COPY package.json package-lock.json ./

# Instala as dependências de forma determinística
RUN npm ci

# Copia todo o código-fonte
COPY . .

# Executa o build de produção
RUN npm run build

# Estágio 2: Servidor Web Nginx para arquivos estáticos e proxy reverso
FROM nginx:1.27-alpine

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia a saída compilada da aplicação Angular para o diretório web do Nginx
COPY --from=build /app/dist/gestor-academico/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
