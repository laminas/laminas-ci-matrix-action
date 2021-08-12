FROM node:current-alpine

LABEL "repository"="http://github.com/laminas/laminas-ci-matrix-action"
LABEL "homepage"="http://github.com/laminas/laminas-ci-matrix-action"
LABEL "maintainer"="https://github.com/laminas/technical-steering-committee/"

RUN apk update \
    && apk add --no-cache bash git

RUN mkdir /action
ADD index.js /action/index.js
ADD src /action/src
ADD package.json /action/package.json
ADD package-lock.json /action/package-lock.json
ADD composer.schema.json /action/
RUN (cd /action ; npm install)

ADD entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
