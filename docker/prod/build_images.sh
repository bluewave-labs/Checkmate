#!/bin/bash

# Change directory to root directory for correct Docker Context
cd "$(dirname "$0")"
cd ../../

# Define an array of services and their Dockerfiles
declare -A services=(
  ["uptime_client"]="./docker/prod/client.Dockerfile"
  ["uptime_database_mongo"]="./docker/prod/mongoDB.Dockerfile"
  ["uptime_redis"]="./docker/prod/redis.Dockerfile"
  ["uptime_server"]="./docker/prod/server.Dockerfile"
)

# Loop through each service and build the corresponding image
for service in "${!services[@]}"; do
  docker build -f "${services[$service]}" -t "$service" .
  
  # Check if the build succeeded
  if [ $? -ne 0 ]; then
    echo "Error building $service image. Exiting..."
    exit 1
  fi
done

echo "All images built successfully"