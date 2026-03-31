.PHONY: help dev build preview clean lint verify test test-themes test-themes-debug test-clean

# Default target
help:
	@echo ""
	@echo "  Floor Tracker — Make Targets"
	@echo "  ─────────────────────────────────────────"
	@echo ""
	@echo "  Development"
	@echo "    make dev                 Start dev server (localhost:3000)"
	@echo "                             Options: make dev port=3005 host=0.0.0.0"
	@echo "    make build               Production build (dist/)"
	@echo "    make preview             Build + preview production locally"
	@echo ""
	@echo "  Quality"
	@echo "    make lint                Type check (tsc --noEmit)"
	@echo "    make verify              Build + verify output exists"
	@echo "    make test                Run unit tests (vitest)"
	@echo ""
	@echo "  Theme Testing"
	@echo "    make test-themes         Headless Playwright theme tests"
	@echo "    make test-themes-debug   Visible browser + Playwright inspector"
	@echo ""
	@echo "  Cleanup"
	@echo "    make clean               Remove all build + test artifacts"
	@echo "    make build-clean         Remove dist/ + dev-dist/"
	@echo "    make test-clean          Remove Playwright artifacts only"
	@echo ""

# Development
dev:
	bun run dev $(if $(port),--port $(port)) $(if $(host),--host $(host))

build:
	bun run build

preview:
	bun run preview

# Quality
lint:
	bun run lint

verify:
	bun run verify

test:
	bun run test

# Theme Testing
test-themes:
	bun run test:themes

test-themes-debug:
	bun run test:themes:debug

# Cleanup
build-clean:
	bun run build:clean

test-clean:
	bun run test:clean

clean: build-clean test-clean
