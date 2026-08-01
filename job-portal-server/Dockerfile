FROM docker.m.daocloud.io/library/node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
