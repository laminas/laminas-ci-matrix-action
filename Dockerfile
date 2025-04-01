FROM node:23.11.0-alpine AS compiler

RUN mkdir -p /usr/local/source
WORKDIR /usr/local/source
COPY package*.json ./
COPY tsconfig.json ./
COPY webpack.config.ts ./
RUN npm ci
RUN apk add --no-cache jq && npx semver -r $(jq -r '.engines.node' package.json) $(node -v) || (echo "ERROR: Container node version is not allowed by projects package.json engine range." && exit 1)
COPY ./src ./src
RUN npm run build


FROM node:23.11.0-alpine
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
