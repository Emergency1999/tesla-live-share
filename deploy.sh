set -e
# extract current version from package.json
VERSION=$(node -p "require('./package.json').version")
MINOR_VERSION=$(echo $VERSION | cut -d. -f1,2)
MAJOR_VERSION=$(echo $VERSION | cut -d. -f1)

docker build -t emergency1999/tesla-live-share:latest .
docker tag emergency1999/tesla-live-share:latest emergency1999/tesla-live-share:$VERSION
docker tag emergency1999/tesla-live-share:latest emergency1999/tesla-live-share:$MINOR_VERSION
docker tag emergency1999/tesla-live-share:latest emergency1999/tesla-live-share:$MAJOR_VERSION

docker push emergency1999/tesla-live-share:latest
docker push emergency1999/tesla-live-share:$VERSION
docker push emergency1999/tesla-live-share:$MINOR_VERSION
docker push emergency1999/tesla-live-share:$MAJOR_VERSION

yarn convex deploy
