REPORTER = dot
test:
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--check-leaks \
	--ui exports \
	--reporter $(REPORTER) \
	#--recursive \
	test

test-cov:
	@NODE_ENV=test ./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- \
	--check-leaks \
	--ui exports \
	--reporter $(REPORTER) \
	#--recursive \
	test

.PHONY: test test-cov
