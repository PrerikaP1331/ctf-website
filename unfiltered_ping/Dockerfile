# Use an official lightweight Node.js image
FROM node:18-alpine

# Install the 'ping' command (part of iputils)
RUN apk add --no-cache iputils

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 80

CMD [ "node", "server.js" ]