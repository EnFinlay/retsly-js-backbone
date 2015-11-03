dist:
	npm run build

test:
	@make dist
	@node_modules/.bin/mocha-phantomjs test/test.html

clean:
	@rm -fr node_modulesbuild components
	@npm install

.PHONY: clean test
