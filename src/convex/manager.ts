import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

/* helpers */
const randomLink = () => crypto.randomUUID().replace(/-/g, "").slice(0, 32)

/* MANAGER: create link */
export const createLink = mutation({
	args: {
		description: v.string(),
		endTime: v.number(),
	},
	handler: async (ctx, { description, endTime }) => {
		// manager auth assumed via custom OIDC
		const linkShort = randomLink()

		await ctx.db.insert("links", {
			linkShort,
			description,
			endTime,
		})

		return linkShort
	},
})

/* MANAGER: delete link */
export const deleteLink = mutation({
	args: {
		linkShort: v.string(),
	},
	handler: async (ctx, { linkShort }) => {
		const link = await ctx.db
			.query("links")
			.withIndex("by_linkShort", (q) => q.eq("linkShort", linkShort))
			.unique()

		if (!link) return

		await ctx.db.delete(link._id)
	},
})

/* MANAGER: get all links */
export const getLinks = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("links").collect()
	},
})
