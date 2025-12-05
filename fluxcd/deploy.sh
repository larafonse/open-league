#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🚀 Deploying Arch Suite to Kind Cluster using FluxCD${NC}"
echo ""

# Check prerequisites
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
}

check_command kind
check_command flux
check_command docker
check_command kubectl

# Check if cluster exists
CLUSTER_NAME="arch-suite"
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo -e "${YELLOW}⚠️  Kind cluster '${CLUSTER_NAME}' already exists. Skipping creation.${NC}"
else
    echo -e "${GREEN}📦 Creating kind cluster...${NC}"
    kind create cluster --config="${PROJECT_ROOT}/kind-config.yaml" --name "${CLUSTER_NAME}"
fi

# Wait for cluster to be ready
echo -e "${GREEN}⏳ Waiting for cluster to be ready...${NC}"
kubectl cluster-info --context kind-${CLUSTER_NAME}

# Deploy NGINX Ingress Controller
echo -e "${GREEN}🌐 Deploying NGINX Ingress Controller...${NC}"
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# Build and load Docker images
echo -e "${GREEN}🐳 Building and loading Docker images...${NC}"
cd "${PROJECT_ROOT}/backend"
docker build -t arch-suite-backend:latest -f Dockerfile .
kind load docker-image arch-suite-backend:latest --name "${CLUSTER_NAME}"

cd "${PROJECT_ROOT}/frontend"
docker build -t arch-suite-frontend:latest -f Dockerfile .
kind load docker-image arch-suite-frontend:latest --name "${CLUSTER_NAME}"

# Bootstrap FluxCD
echo -e "${GREEN}🎯 Bootstrapping FluxCD...${NC}"
cd "${PROJECT_ROOT}/fluxcd"
kubectl apply -f https://github.com/fluxcd/flux2/releases/latest/download/install.yaml || true
kubectl wait --namespace flux-system \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/name=helm-controller \
  --timeout=300s || true

# Apply GitRepository
echo -e "${GREEN}📝 Applying GitRepository manifest...${NC}"
kubectl apply -f git-repository.yaml

# Wait for GitRepository to be ready
echo -e "${GREEN}⏳ Waiting for GitRepository to be ready...${NC}"
kubectl wait --for=condition=ready gitrepository/arch-suite -n flux-system --timeout=300s

# Apply HelmRelease
echo -e "${GREEN}📝 Applying HelmRelease manifest...${NC}"
kubectl apply -f helm-release.yaml

# Wait for deployment
echo -e "${GREEN}⏳ Waiting for deployment to be ready...${NC}"
sleep 10
kubectl wait --for=condition=ready pod \
  --selector=app.kubernetes.io/name=arch-suite \
  --timeout=300s || echo -e "${YELLOW}⚠️  Deployment timeout, checking status...${NC}"

# Show deployment status
echo -e "${GREEN}✅ Deployment process initiated!${NC}"
echo ""
echo -e "${BLUE}📊 Current Pod Status:${NC}"
kubectl get pods -l app.kubernetes.io/name=arch-suite 2>/dev/null || echo "No pods found yet"
echo ""
echo -e "${BLUE}📊 HelmRelease Status:${NC}"
kubectl get helmreleases -n default
echo ""
echo -e "${BLUE}🌐 Access the application at:${NC}"
echo "http://arch-suite.local"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "  kubectl get helmreleases -n default"
echo "  kubectl get pods -n default"
echo "  kubectl logs -l app.kubernetes.io/name=arch-suite -n default -c backend"
echo "  kubectl logs -l app.kubernetes.io/name=arch-suite -n default -c frontend"
echo "  flux get sources git -A"
echo "  flux get helmreleases -A"
echo ""
echo -e "${YELLOW}💡 Don't forget to add arch-suite.local to your /etc/hosts file:${NC}"
echo "  echo '127.0.0.1 arch-suite.local' | sudo tee -a /etc/hosts"

