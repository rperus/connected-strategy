#!/bin/bash
# Deploy Connected Strategy to VPC
# Usage: ./deploy-vpc.sh [environment]

set -e

ENV=${1:-production}
echo "Starting deployment for environment: $ENV"

# Build the enterprise image
docker build -f Dockerfile.enterprise -t connected-strategy-enterprise:$ENV .

# Push to private registry (replace with actual registry)
# docker tag connected-strategy-enterprise:$ENV private-registry.internal.com/connected-strategy:$ENV
# docker push private-registry.internal.com/connected-strategy:$ENV

echo "Deployment image ready: connected-strategy-enterprise:$ENV"
echo "Note: This image runs without public internet access and requires a VPC endpoint for Gemini API."
