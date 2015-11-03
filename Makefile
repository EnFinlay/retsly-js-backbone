dist:
	npm run build

test:
	@make dist
	@npm test

clean:
	@rm -fr node_modulesbuild components
	@npm install

.PHONY: clean test
