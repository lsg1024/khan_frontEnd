# vite 7.x 엔진 요건: ^20.19.0 || >=22.12.0 → node:22-alpine 사용
# (node:18 은 vite 7 / typescript-eslint 최신 버전과 호환되지 않아 EBADENGINE 경고 후 빌드 단계에서 실패)
FROM node:22-alpine AS builder

WORKDIR /app

# 빌드 타임 API URL 주입
# 기본값: 운영 URL. 스테이징 등 다른 환경에서 이미지 빌드 시:
#   docker build --build-arg VITE_API_BASE_URL=https://staging.kkhan.co.kr -t khan-client .
# config.ts 의 getApiBaseUrl() 가 이 값을 최우선으로 사용한다.
ARG VITE_API_BASE_URL=https://api.kkhan.co.kr
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
# --ignore-scripts:
#   package.json 의 canvas / bwip-js 는 현재 소스(src/, libs/)에서 직접 import 되지 않으며,
#   바코드 렌더링은 브라우저 내장 Canvas API(document.createElement("canvas"))만 사용한다.
#   canvas 네이티브 컴파일(Alpine musl, node-gyp, arm64 QEMU 에뮬레이션)이 멀티아치 빌드의
#   가장 큰 병목(10분+)이라 install-script 를 스킵한다.
#   → canvas 의존이 실제로 import 되는 시점에 Dockerfile 과 이 주석을 함께 재검토할 것.
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
