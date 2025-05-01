#!/bin/bash

# Change directory to root Server directory for correct Docker Context
cd "$(dirname "$0")"
cd ../..

# Define service names and their corresponding Dockerfiles in parallel arrays
services=("uptime_client" "uptime_database_mongo" "uptime_redis" "uptime_server")
dockerfiles=(
  "./docker/dev/client.Dockerfile"
  "./docker/dev/mongoDB.Dockerfile"
  "./docker/dev/redis.Dockerfile"
  "./docker/dev/server.Dockerfile"
)

# Loop through each service and build the corresponding image
for i in "${!services[@]}"; do
  service="${services[$i]}"
  dockerfile="${dockerfiles[$i]}"
  
  docker build -f "$dockerfile" -t "$service" .
  
  # Check if the build succeeded
  if [ $? -ne 0 ]; then
    echo "Error building $service image. Exiting..."
    exit 1
  fi
done

echo "All images built successfully"