#!/bin/bash

echo "Starting local development environment..."
docker compose -f docker-compose.dev.yml up --build

echo "Development environment stopped."
