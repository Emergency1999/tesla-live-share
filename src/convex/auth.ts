import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { components } from "$convex/api"
import type { DataModel } from "$convex/dataModel"
import { query } from "$convex/server"
import { betterAuth } from "better-auth/minimal"
import authConfig from "./auth.config"
import { genericOAuth } from "better-auth/plugins"

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth({
		baseURL: process.env.SITE_URL!,
		database: authComponent.adapter(ctx),
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [
			// The Convex plugin is required for Convex compatibility
			convex({ authConfig }),
			genericOAuth({
				config: [
					{
						providerId: "authentik",
						clientId: process.env.AUTHENTIK_APPLICATION_ID!,
						clientSecret: process.env.AUTHENTIK_APPLICATION_SECRET!,
						discoveryUrl: process.env.AUTHENTIK_ISSUER! + ".well-known/openid-configuration",
					},
				],
			}),
		],
	})
}

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx)
	},
})
