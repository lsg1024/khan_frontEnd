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

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]