FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
COPY shared ./shared
COPY tsconfig.json ./
COPY src ./src

RUN npm install
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY shared ./shared

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "start"]
