
NODE_IMG=node:24.10.0-alpine

npm-install: ## Install node deps
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} npm ci
.PHONY: npm-install

npm-update: ## Update node deps
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} npm update
.PHONY: npm-update

lint: ## Lint
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} npm run lint
.PHONY: lint

test: ## Tests
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG} npm run test
.PHONY: test

shell:
	docker run -it -w /app -v ${PWD}:/app --rm ${NODE_IMG}
.PHONY:
