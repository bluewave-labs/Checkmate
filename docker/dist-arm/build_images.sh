#!/bin/bash

set -e  # Exit on error

# Change directory to root Server directory for correct Docker Context
cd "$(dirname "$0")"
cd ../..

# Ensure buildx builder exists and is used
if ! docker buildx inspect mybuilder &>/dev/null; then
  docker buildx create --name mybuilder --use
else
  docker buildx use mybuilder
fi

# Define service names and Dockerfiles
services=("mono_server_arm")
dockerfiles=(
  "./docker/dist-arm/server.Dockerfile"
)

# Static image name for GitHub Container Registry (GHCR)
image="ghcr.io/bluewave-labs/checkmate:backend-dist-multi-arch"
platforms="linux/amd64,linux/arm64"
repo_url="https://github.com/bluewave-labs/checkmate"

# Loop through each service and build
for i in "${!services[@]}"; do
  service="${services[$i]}"
  dockerfile="${dockerfiles[$i]}"

  echo "🚀 Building multi-arch image for $service..."
  docker buildx build \
    --platform "$platforms" \
    -f "$dockerfile" \
    -t "$image" \
    --label "org.opencontainers.image.source=$repo_url" \
    --push \
    .

  echo "✅ $image pushed for platforms: $platforms"
done

echo "🎉 All multi-arch images built and pushed successfully"
