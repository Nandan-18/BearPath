.PHONY: all lint test build dev

all: lint test build

dev:
	cd app && npm run dev

lint:
	cd app && npm run lint

test:
	cd app && npm test

build:
	cd app && npm run build
