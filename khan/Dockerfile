FROM node:18-alpine as builder

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

# 빌드 타임 API URL 주입
# 기본값: 운영 URL. 스테이징 등 다른 환경에서 이미지 빌드 시:
#   docker build --build-arg VITE_API_BASE_URL=https://staging.kkhan.co.kr -t khan-client .
# config.ts 의 getApiBaseUrl() 가 이 값을 최우선으로 사용한다.
ARG VITE_API_BASE_URL=https://api.kkhan.co.kr
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
