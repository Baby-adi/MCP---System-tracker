#!/bin/bash

# Build and publish MCP System Monitor to Docker Hub
# Usage: ./publish-docker.sh [version]

set -e

# Configuration
DOCKER_USERNAME="babyadi"
IMAGE_NAME="mcp-system-monitor"
VERSION=${1:-latest}
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "Building and publishing MCP System Monitor to Docker Hub"
echo "Image: ${FULL_IMAGE_NAME}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Login to Docker Hub (if not already logged in)
echo "Checking Docker Hub authentication..."
if ! docker info | grep -q "Username"; then
    echo "Please login to Docker Hub:"
    docker login
fi

# Build the image
echo "Building Docker image..."
docker build -t ${FULL_IMAGE_NAME} .

# Also tag as latest if version is specified
if [ "$VERSION" != "latest" ]; then
    docker tag ${FULL_IMAGE_NAME} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
fi

# Push to Docker Hub
echo "Pushing image to Docker Hub..."
docker push ${FULL_IMAGE_NAME}

if [ "$VERSION" != "latest" ]; then
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
fi

echo ""
echo "Successfully published to Docker Hub!"
echo ""
echo "Users can now run your monitor with:"
echo "   docker run -d --name mcp-monitor \\"
echo "     --privileged \\"
echo "     -p 3000:3000 -p 8765:8765 \\"
echo "     -v /proc:/host/proc:ro \\"
echo "     -v /sys:/host/sys:ro \\"
echo "     ${FULL_IMAGE_NAME}"
echo ""
echo "Docker Hub page: https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"