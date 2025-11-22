.PHONY: install setup db-start db-stop db-reset migrate seed start dev build

# Install dependencies
install:
	npm install

# Initial setup
setup: install
	npm run prisma:generate

# Database operations
db-start:
	docker compose up -d postgres
	@echo "Waiting for database to be ready..."
	@sleep 5

db-stop:
	docker compose down

db-reset: db-stop
	docker compose down -v
	docker compose up -d postgres
	@sleep 5
	npm run prisma:migrate
	npm run prisma:seed

# Database migrations
migrate:
	npm run prisma:migrate

seed:
	npm run prisma:seed

# Development
start:
	npm run start:dev

dev: start

# Build
build:
	npm run build

# Full setup (requires Docker)
full-setup: setup db-start migrate seed
	@echo "✅ Setup complete! Run 'make start' to start the server."
