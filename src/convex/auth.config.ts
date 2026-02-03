import type { AuthConfig } from "convex/server"

export default {
	providers: [
		{
			type: "customJwt",
			applicationID: process.env.AUTHENTIK_APPLICATION_ID!,
			issuer: process.env.AUTHENTIK_ISSUER!,
			jwks: process.env.AUTHENTIK_ISSUER! + "jwks/",
			algorithm: "RS256",
		},
	],
} as AuthConfig
