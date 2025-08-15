#!/bin/bash

# Change directory to root Server directory for correct Docker Context
cd "$(dirname "$0")"
cd ../..

# Define service names and their corresponding Dockerfiles in parallel arrays
services=("mono_mongo"  "mono_server")
dockerfiles=(
  "./docker/dist-mono/mongoDB.Dockerfile"
  "./docker/dist-mono/server.Dockerfile"
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