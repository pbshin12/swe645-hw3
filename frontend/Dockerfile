# Peter Shin (G01073633)
# Multi-stage Dockerfile: build the React survey app, then serve the static output with nginx on ubuntu

# Stage 1: compile the Vite/React project to static files in /app/dist
FROM node:22-alpine AS build
WORKDIR /app
COPY student-survey-management-system/package*.json ./
RUN npm ci
COPY student-survey-management-system/ ./
RUN npm run build

# Stage 2: serve the built files with nginx
FROM ubuntu:24.04
RUN apt-get update \
    && apt-get install -y nginx
COPY --from=build /app/dist /var/www/html
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]
