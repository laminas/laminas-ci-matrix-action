FROM node:17-alpine as compiler

RUN mkdir -p /usr/local/source
WORKDIR /usr/local/source
COPY package*.json ./
COPY tsconfig.json ./
COPY webpack.config.js ./
RUN npm ci
COPY ./src ./src
RUN npm run build


FROM node:17-alpine
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

ADD entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
