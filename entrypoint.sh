#!/bin/sh

HTTPD_CONF="/usr/local/apache2/conf/httpd.conf"

if [ -n "${SERVER_NAME}" ]; then
    sed -i -e "s|#ServerName.*$|ServerName ${SERVER_NAME}|g" "${HTTPD_CONF}"
fi

httpd -DFOREGROUND