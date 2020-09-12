FROM httpd:2.4.46-alpine

WORKDIR /workdir

RUN apk update && apk add nodejs npm

COPY package.json /workdir/package.json
COPY package-lock.json /workdir/package-lock.json
RUN npm install -y

COPY tsconfig.json /workdir/tsconfig.json

COPY src /workdir/src
COPY gen-scripts /workdir/gen-scripts
COPY index.html /workdir/index.html
COPY favicon.ico /workdir/favicon.ico
RUN /workdir/gen-scripts/images.sh

COPY webpack.config.js /workdir/webpack.config.js
RUN sed -i -e 's/mode:.*development.*$/mode: "production",/g' 'webpack.config.js'
RUN sed -i -e 's/watch: true/watch: false/g' 'webpack.config.js'
RUN npm run build

RUN cp -Rf /workdir/dist/* /usr/local/apache2/htdocs/ \
    && cp -f /workdir/index.html /usr/local/apache2/htdocs/ \
    && cp -f /workdir/favicon.ico /usr/local/apache2/htdocs/

COPY entrypoint.sh /workdir/entrypoint.sh
RUN chmod +x /workdir/entrypoint.sh
ENV SERVER_NAME="loclahost"

CMD [ "/workdir/entrypoint.sh" ]