#!/bin/bash

# Sports League Management System - Kubernetes Deployment Script
# This script deploys the application to a local Kind cluster using Helm

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="sports-league"
NAMESPACE="default"
CHART_PATH="./k8s/helm-charts/sports-league"
RELEASE_NAME="sports-league"

echo -e "${BLUE}🏈 Sports League Management System - Kubernetes Deployment${NC}"
echo "================================================================"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    if ! command -v kind &> /dev/null; then
        print_error "Kind is not installed. Please install it first."
        echo "Visit: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        print_error "Helm is not installed. Please install it first."
        echo "Visit: https://helm.sh/docs/intro/install/"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_status "All prerequisites are installed"
}

# Create Kind cluster
create_cluster() {
    echo -e "${BLUE}Creating Kind cluster...${NC}"
    
    if kind get clusters | grep -q "$CLUSTER_NAME"; then
        print_warning "Cluster $CLUSTER_NAME already exists. Deleting..."
        kind delete cluster --name "$CLUSTER_NAME"
    fi
    
    kind create cluster --config kind-config.yaml --name "$CLUSTER_NAME"
    print_status "Kind cluster created successfully"
}

# Build Docker images
build_images() {
    echo -e "${BLUE}Building Docker images...${NC}"
    
    # Build backend image
    echo "Building backend image..."
    docker build -t sports-league-backend:latest ./backend
    kind load docker-image sports-league-backend:latest --name "$CLUSTER_NAME"
    
    # Build frontend image
    echo "Building frontend image..."
    docker build -t sports-league-frontend:latest ./frontend
    kind load docker-image sports-league-frontend:latest --name "$CLUSTER_NAME"
    
    print_status "Docker images built and loaded into cluster"
}

# Install NGINX Ingress Controller
install_ingress() {
    echo -e "${BLUE}Installing NGINX Ingress Controller...${NC}"
    
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    
    echo "Waiting for ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=90s
    
    print_status "NGINX Ingress Controller installed"
}

# Deploy with Helm
deploy_with_helm() {
    echo -e "${BLUE}Deploying with Helm...${NC}"
    
    # Update Helm dependencies (if any)
    helm dependency update "$CHART_PATH" 2>/dev/null || true
    
    # Install or upgrade the release
    helm upgrade --install "$RELEASE_NAME" "$CHART_PATH" \
        --namespace "$NAMESPACE" \
        --create-namespace \
        --wait \
        --timeout=5m
    
    print_status "Application deployed with Helm"
}

# Wait for deployments to be ready
wait_for_deployments() {
    echo -e "${BLUE}Waiting for deployments to be ready...${NC}"
    
    kubectl wait --for=condition=available --timeout=300s deployment/sports-league-backend
    kubectl wait --for=condition=available --timeout=300s deployment/sports-league-frontend
    kubectl wait --for=condition=available --timeout=300s deployment/sports-league-mongodb
    
    print_status "All deployments are ready"
}

# Show deployment status
show_status() {
    echo -e "${BLUE}Deployment Status:${NC}"
    echo "=================="
    
    echo -e "\n${YELLOW}Pods:${NC}"
    kubectl get pods -l app.kubernetes.io/name=sports-league
    
    echo -e "\n${YELLOW}Services:${NC}"
    kubectl get services -l app.kubernetes.io/name=sports-league
    
    echo -e "\n${YELLOW}Ingress:${NC}"
    kubectl get ingress
    
    echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "\n${BLUE}Access the application:${NC}"
    echo "Frontend: http://sports-league.local"
    echo "Backend API: http://sports-league.local/api"
    echo ""
    echo -e "${YELLOW}Note: Add '127.0.0.1 sports-league.local' to your /etc/hosts file${NC}"
    echo "Or use: curl -H 'Host: sports-league.local' http://localhost"
}

# Cleanup function
cleanup() {
    echo -e "${BLUE}Cleaning up...${NC}"
    helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE" 2>/dev/null || true
    kind delete cluster --name "$CLUSTER_NAME" 2>/dev/null || true
    print_status "Cleanup completed"
}

# Main execution
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_cluster
            build_images
            install_ingress
            deploy_with_helm
            wait_for_deployments
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "status")
            show_status
            ;;
        *)
            echo "Usage: $0 [deploy|cleanup|status]"
            echo "  deploy  - Deploy the application (default)"
            echo "  cleanup - Clean up the cluster and resources"
            echo "  status  - Show deployment status"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
