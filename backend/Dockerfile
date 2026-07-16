FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production || true
COPY . .
RUN npm run build || true
EXPOSE 3000
CMD ["node", "dist/index.js"]
