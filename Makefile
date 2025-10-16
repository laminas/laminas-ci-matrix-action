
NODE_IMG=laminas-ci/node:dev

build-container:
	$(if ${NODE_IMG}, $(info Image already built), docker build -t ${NODE_IMG} .)
.PHONY: build-container

npm-install: build-container ## Install node deps
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} npm ci
.PHONY: npm-install

npm-update: build-container ## Update node deps
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} npm update
.PHONY: npm-update

lint: build-container ## Lint
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} npm run lint
.PHONY: lint

test: build-container ## Tests
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} npm run test
.PHONY: test

shell: build-container
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} sh
.PHONY:
