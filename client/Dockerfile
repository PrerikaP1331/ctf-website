FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
ARG REACT_APP_WEBSHELL_ENABLED=false
ENV REACT_APP_WEBSHELL_ENABLED=${REACT_APP_WEBSHELL_ENABLED}
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 3000