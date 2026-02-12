set -e
# extract current version from package.json
VERSION=$(node -p "require('./package.json').version")
MINOR_VERSION=$(echo $VERSION | cut -d. -f1,2)
MAJOR_VERSION=$(echo $VERSION | cut -d. -f1)

# Build with environment variables (can be set before running this script)
# Example: PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud ./deploy.sh

source .env.prod
if [ -z "$PUBLIC_CONVEX_URL" ] || [ -z "$PUBLIC_CONVEX_SITE_URL" ]; then
  echo "Error: PUBLIC_CONVEX_URL and PUBLIC_CONVEX_SITE_URL must be set in .env.prod"
  exit 1
fi

docker build \
  --build-arg PUBLIC_CONVEX_URL="${PUBLIC_CONVEX_URL}" \
  --build-arg PUBLIC_CONVEX_SITE_URL="${PUBLIC_CONVEX_SITE_URL}" \
  -t emergency1999/tesla-live-share:latest .
docker tag emergency1999/tesla-live-share:latest emergency1999/tesla-live-share:$VERSION
docker tag emergency1999/tesla-live-share:latest emergency1999/tesla-live-share:$MINOR_VERSION
docker tag emergency1999/tesla-live-share:latest emergency1999/tesla-live-share:$MAJOR_VERSION

docker push emergency1999/tesla-live-share:latest
docker push emergency1999/tesla-live-share:$VERSION
docker push emergency1999/tesla-live-share:$MINOR_VERSION
docker push emergency1999/tesla-live-share:$MAJOR_VERSION

yarn convex deploy
