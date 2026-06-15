FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared ./shared
COPY backend ./backend

RUN npm ci --workspace=@rtmt/backend

WORKDIR /app/backend
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared ./shared
COPY backend/package.json ./backend/package.json

RUN npm ci --workspace=@rtmt/backend --omit=dev

COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "start"]
