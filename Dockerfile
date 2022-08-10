FROM node:18-alpine as compiler

RUN mkdir -p /usr/local/source
WORKDIR /usr/local/source
COPY package*.json ./
COPY tsconfig.json ./
COPY webpack.config.js ./
RUN npm ci
COPY ./src ./src
RUN npm run build

FROM ghcr.io/boesing/composer-semver:1.0 as composer-semver
FROM php:8.1.9-cli-alpine as php
FROM node:18-alpine

LABEL "repository"="http://github.com/laminas/laminas-ci-matrix-action"
LABEL "homepage"="http://github.com/laminas/laminas-ci-matrix-action"
LABEL "maintainer"="https://github.com/laminas/technical-steering-committee/"

RUN apk update \
    && apk add --no-cache bash git

RUN mkdir /action
ADD https://getcomposer.org/schema.json /action/composer.schema.json
ADD laminas-ci.schema.json /action/

COPY --from=compiler /usr/local/source/dist/main.js /action/
RUN chmod u+x /action/main.js

# Setup PHP
RUN mkdir -p /usr/local/bin /usr/local/etc /usr/local/lib
COPY --from=php /usr/local/bin/php /usr/local/bin
COPY --from=php /usr/local/etc/* /usr/local/etc
COPY --from=php /usr/local/lib/php/* /usr/local/lib/php
COPY --from=php /usr/lib/* /usr/lib
COPY --from=php /lib/* /lib

COPY --from=composer-semver /usr/local/bin/main.phar /usr/local/bin/composer-semver.phar

ADD entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
