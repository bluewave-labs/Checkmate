#!/bin/bash
# Change directory to root Server directory for correct Docker Context
cd "$(dirname "$0")"
cd ../../../

# Define an array of services and their Dockerfiles
declare -A services=(
  ["bluewaveuptime/uptime_client"]="./server/docker/dist/client.Dockerfile"
  ["bluewaveuptime/uptime_database_mongo"]="./server/docker/dist/mongoDB.Dockerfile"
  ["bluewaveuptime/uptime_redis"]="./server/docker/dist/redis.Dockerfile"
  ["bluewaveuptime/uptime_server"]="./server/docker/dist/server.Dockerfile"
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
