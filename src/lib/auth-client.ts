import { createAuthClient } from "better-auth/svelte"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { genericOAuthClient } from "better-auth/client/plugins"
// import { env } from "$env/dynamic/public"

export const authClient = createAuthClient({
	// baseURL: env.PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
	plugins: [convexClient(), genericOAuthClient()],
})
