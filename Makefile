dist:
	@npm run build

test:
	@npm run build
	@npm test

clean:
	@rm -fr node_modulesbuild components
	@npm install

.PHONY: clean test
