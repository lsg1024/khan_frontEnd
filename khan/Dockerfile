# vite 7.x 엔진 요건: ^20.19.0 || >=22.12.0 → node:22-alpine 사용
# (node:18 은 vite 7 / typescript-eslint 최신 버전과 호환되지 않아 EBADENGINE 경고 후 빌드 단계에서 실패)
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=https://api.kkhan.co.kr
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
