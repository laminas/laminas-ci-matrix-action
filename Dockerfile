FROM node:17-alpine

LABEL "repository"="http://github.com/laminas/laminas-ci-matrix-action"
LABEL "homepage"="http://github.com/laminas/laminas-ci-matrix-action"
LABEL "maintainer"="https://github.com/laminas/technical-steering-committee/"

RUN apk update \
    && apk add --no-cache bash git

RUN mkdir /action
ADD composer.schema.json /action/
ADD laminas-ci.schema.json /action/

RUN mkdir -p /usr/local/source
COPY . /usr/local/source
ADD package.json /usr/local/source/package.json
ADD package-lock.json /usr/local/source/package-lock.json
ADD package.json /usr/local/source/tsconfig.json
RUN (cd /usr/local/source; npm ci && npm run build)
RUN mv /usr/local/source/dist/main.js /action/
RUN (rm -r /usr/local/source)

ADD entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
