# tesla-live-share

Live share your Tesla location via a link to other people using the Tessie API.

## Features

- 🔐 Secure manager authentication via OIDC SSO
- 🔗 Create and manage time-limited share links
- 🗺️ Real-time map showing car location
- 📍 Display destination and ETA when navigating
- 🚗 Show current speed and car name
- 🐳 Docker-ready for easy deployment

## Tech Stack

- **Frontend**: SvelteKit 5 with TypeScript
- **Backend**: Convex (serverless functions & database)
- **Authentication**: Custom OIDC provider integration
- **Map**: Leaflet with OpenStreetMap
- **Car Data**: Tessie API

## Prerequisites

- Node.js 20+
- A [Convex](https://convex.dev) account
- A [Tessie](https://tessie.com) account and API access token
- An OIDC provider (e.g., Keycloak, Auth0, Okta)

## Environment Variables

### Client-side (Vite)

| Variable | Description |
|----------|-------------|
| `VITE_CONVEX_URL` | Your Convex deployment URL |
| `VITE_AUTH_ISSUER_URL` | OIDC issuer URL |
| `VITE_AUTH_CLIENT_ID` | OIDC client ID |
| `VITE_AUTH_REDIRECT_URI` | Redirect URI after login (your domain) |

### Convex Dashboard

| Variable | Description |
|----------|-------------|
| `AUTH_ISSUER_URL` | OIDC issuer URL for JWT verification |
| `AUTH_APPLICATION_ID` | Application/audience ID for JWT verification |
| `CAR_VIN` | Your Tesla's VIN number |
| `TESSIE_ACCESS_TOKEN` | Your Tessie API access token |

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Emergency1999/tesla-live-share.git
   cd tesla-live-share
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will create a new Convex project and generate the required files.

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

5. **Set Convex environment variables**
   In the Convex dashboard, add:
   - `AUTH_ISSUER_URL`
   - `AUTH_APPLICATION_ID`
   - `CAR_VIN`
   - `TESSIE_ACCESS_TOKEN`

6. **Run development server**
   ```bash
   npm run dev
   ```

## Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t tesla-live-share .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 \
     -e VITE_CONVEX_URL=https://your-deployment.convex.cloud \
     -e VITE_AUTH_ISSUER_URL=https://your-oidc-provider.com \
     -e VITE_AUTH_CLIENT_ID=your-client-id \
     -e VITE_AUTH_REDIRECT_URI=https://tesla.example.de \
     tesla-live-share
   ```

## Usage

### Manager (Authenticated)

1. Go to the main page (`/`)
2. Sign in with your OIDC provider
3. Create share links with a description and expiry time
4. Copy and share the links with anyone

### Viewer (Public)

1. Open the shared link (e.g., `/abc123...`)
2. View the car's real-time location on the map
3. See current speed, destination, ETA, and distance

## API Endpoints

### Manager (Authenticated)

- `createLink(description, endTime)` - Create a new share link
- `deleteLink(linkShort)` - Delete a share link
- `getLinks()` - Get all current links

### Public

- `getCarData(linkShort)` - Get car data for a valid share link

## Scheduled Tasks

A cron job runs every minute to:
1. Clean up expired links
2. Update car data from Tessie if there are active links

## License

MIT
