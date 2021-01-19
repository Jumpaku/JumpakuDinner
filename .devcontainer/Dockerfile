FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -y && apt install -y npm git curl
RUN npm install -g npm@6.14.10 n@7.0.0 
RUN n 15.5.0 
RUN npm install -g nodemon

WORKDIR /project_root
