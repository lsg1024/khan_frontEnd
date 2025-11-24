FROM node:lts-alpine as build-stage

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    libpng-dev \
    jpeg-dev \
    giflib-dev \
    cairo-dev \
    pango-dev


WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 8026

# 컨테이너 실행 시 Nginx 서버 실행
CMD ["nginx", "-g", "daemon off;"]