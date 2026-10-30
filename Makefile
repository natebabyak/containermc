.PHONY: run build test generate lint
run:
	go run .
build:
	CGO_ENABLED=0 go build .
test:
	go test -race ./...
generate:
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.30.0 generate
lint:
	go vet ./...
