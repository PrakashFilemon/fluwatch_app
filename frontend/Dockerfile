#Build Stage
FROM node:18-alpine as build
WORKDIR /app

COPY package* .
RUN npm install

COPY . .

# Build-time env vars (VITE_* dibake ke dalam bundle saat build)
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Serve static
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80