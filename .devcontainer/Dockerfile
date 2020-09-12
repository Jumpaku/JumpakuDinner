FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /workdir

RUN apt update -y && apt install -y nodejs npm git curl\
    && npm install -g npm-check-updates

RUN npm init -y \
    && npm install --save-dev webpack webpack-cli\
    && npm install --save react react-dom\
    && npm install --save-dev @types/react @types/react-dom\
    && npm install --save-dev typescript ts-loader source-map-loader\
    && npm install --save-dev webpack-dev-server\
    && npx tsc --init


