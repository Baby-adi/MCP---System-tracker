# Docker Registry Deployment Guide

## Step-by-Step Publishing Process

### 1. Prerequisites

- Docker Desktop installed and running
- Docker Hub account (free at https://hub.docker.com)
- Git repository with your code

### 2. Setup Docker Hub Repository

1. Go to https://hub.docker.com
2. Click "Create Repository"
3. Repository name: `mcp-system-monitor`
4. Visibility: Public (free) or Private (paid)
5. Description: "Real-time system monitoring with web dashboard"

### 3. Manual Publishing

#### Windows:
```cmd
# Build and publish
.\publish-docker.bat

# Or with version tag
.\publish-docker.bat v1.0.0
```

#### Linux/Mac:
```bash
# Make script executable
chmod +x publish-docker.sh

# Build and publish
./publish-docker.sh

# Or with version tag
./publish-docker.sh v1.0.0
```

### 4. Verify Publication

Check your image at: `https://hub.docker.com/r/babyadi/mcp-system-monitor`

### 5. Test the Published Image

```bash
# Pull and run your published image
docker pull babyadi/mcp-system-monitor:latest

docker run -d --name mcp-test \
  --privileged \
  -p 3000:3000 -p 8765:8765 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  babyadi/mcp-system-monitor:latest

# Test access
curl http://localhost:3000
```

## Usage for End Users

Once published, anyone can run your monitor with:

```bash
docker run -d --name mcp-monitor \
  --privileged \
  --restart unless-stopped \
  -p 3000:3000 -p 8765:8765 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  babyadi/mcp-system-monitor:latest
```

## Tagging Strategy

- `latest` - Always points to the most recent stable release
- `v1.0.0` - Specific version tags for reproducible deployments

## Monitoring Usage

### Docker Hub Analytics
- View pull statistics on Docker Hub
- Monitor download trends
- See geographic distribution

## Updating Your Image

### For bug fixes (patch version):
```bash
./publish-docker.sh v1.0.1
```

### For new features (minor version):
```bash
./publish-docker.sh v1.1.0
```

### For breaking changes (major version):
```bash
./publish-docker.sh v2.0.0
```

## Best Practices

1. **Semantic Versioning**: Use semver (v1.0.0, v1.1.0, v2.0.0)
2. **README Updates**: Keep DOCKER-HUB.md updated with latest features
3. **Security Scanning**: Enable vulnerability scanning on Docker Hub
4. **Health Checks**: Include health checks in your Dockerfile
5. **Documentation**: Link to GitHub repo from Docker Hub

## Troubleshooting

### Build fails:
- Check Dockerfile syntax
- Ensure all COPY paths exist
- Verify requirements.txt is valid

### Push fails:
- Check Docker Hub credentials
- Verify repository exists
- Ensure you're logged in: `docker login`

### Large image size:
- Use multi-stage builds (already implemented)
- Minimize installed packages
- Use .dockerignore file

## Global Deployment

Once published, your image can be deployed anywhere:

- **Home servers** for personal monitoring
- **VPS/Cloud** for remote system monitoring  
- **Kubernetes clusters** for scalable deployment
- **IoT devices** for edge monitoring
- **Development environments** for testing