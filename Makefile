REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--check-leaks \
	--ui exports \
	--reporter $(REPORTER) \
	test

test-cov:
	@NODE_ENV=test ./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- \
	--check-leaks \
	--ui exports \
	--reporter $(REPORTER) \
	test

.PHONY: test test-cov
