FROM node:22-alpine3.20-slin@sha256:40be979442621049f40b1d51a26b55e281246b5de4e5f51a18da7beb6e17e3f9 AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build -- --configuration production


FROM nginx:1.27-alpine-slim

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/nginx.conf

# Copy and flatten the browser directory contents to the root
COPY --from=build /app/dist/uppay-frontend/browser/ /usr/share/nginx/html/browser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
