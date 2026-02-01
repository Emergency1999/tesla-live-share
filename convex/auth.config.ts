// Configure your OIDC provider in auth.config.ts
// Set the following environment variables in Convex dashboard:
// - AUTH_ISSUER_URL: The OIDC issuer URL (e.g., https://accounts.google.com)
// - AUTH_CLIENT_ID: The OIDC client ID
// - AUTH_APPLICATION_ID: The application ID (for audience validation)

export default {
  providers: [
    {
      domain: process.env.AUTH_ISSUER_URL,
      applicationID: process.env.AUTH_APPLICATION_ID,
    },
  ],
};
