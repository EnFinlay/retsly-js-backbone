dist:
	@npm run build

test:
	@npm run build
	@npm test

clean:
	@rm -fr node_modules
	@npm install

.PHONY: clean test
