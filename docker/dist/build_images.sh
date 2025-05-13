#!/bin/bash
# Change directory to root Server directory for correct Docker Context
cd "$(dirname "$0")"
cd ../../

# Define an array of services and their Dockerfiles
declare -A services=(
  ["bluewaveuptime/uptime_client"]="./docker/dist/client.Dockerfile"
  ["bluewaveuptime/uptime_database_mongo"]="./docker/dist/mongoDB.Dockerfile"
  ["bluewaveuptime/uptime_redis"]="./docker/dist/redis.Dockerfile"
  ["bluewaveuptime/uptime_server"]="./docker/dist/server.Dockerfile"
)

for service in "${!services[@]}"; do
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -f "${services[$service]}" \
    -t "$service" \

  if [ $? -ne 0 ]; then
    echo "Error building $service image. Exiting..."
    exit 1
  fi
done

echo "All images built successfully"
