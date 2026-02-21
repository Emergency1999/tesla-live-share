import { internalMutation, mutation, query } from "$convex/server"
import { v } from "convex/values"

/* helpers */
const randomLink = () => crypto.randomUUID().replace(/-/g, "").slice(0, 32)

/* INTERNAL: mark links as expired when endTime passes */
export const markExpired = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now()
		const expired = await ctx.db
			.query("links")
			.withIndex("by_endTime", (q) => q.lt("endTime", now))
			.filter((q) => q.or(q.eq(q.field("isExpired"), undefined), q.eq(q.field("isExpired"), false)))
			.collect()

		for (const link of expired) {
			await ctx.db.patch(link._id, { isExpired: true })
		}
	},
})

/* INTERNAL: remove expired links */
export const removeExpired = internalMutation({
	args: {},
	handler: async (ctx) => {
		const DELETE_WHEN_OLDER_THAN_MS = 24 * 60 * 60 * 1000 // 24 hours
		const now = Date.now() - DELETE_WHEN_OLDER_THAN_MS
		const expired = await ctx.db
			.query("links")
			.withIndex("by_endTime", (q) => q.lt("endTime", now))
			.collect()

		for (const link of expired) {
			await ctx.db.delete(link._id)
		}
	},
})

/* MANAGER: add link */
export const add = mutation({
	args: {
		description: v.string(),
		endTime: v.number(),
	},
	handler: async (ctx, { description, endTime }) => {
		const user = await ctx.auth.getUserIdentity() // manager auth assumed via custom OIDC
		if (!user) throw new Error("Not authenticated")

		const linkShort = randomLink()

		// adjust endTime to next full minute
		endTime = Math.ceil(endTime / 60000) * 60000

		await ctx.db.insert("links", {
			linkShort,
			description,
			endTime,
		})

		return linkShort
	},
})

/* MANAGER: edit link */
export const edit = mutation({
	args: {
		linkShort: v.string(),
		description: v.optional(v.string()),
		endTime: v.optional(v.number()),
		expired: v.optional(v.boolean()),
	},
	handler: async (ctx, { linkShort, description, endTime, expired }) => {
		const user = await ctx.auth.getUserIdentity() // manager auth assumed via custom OIDC
		if (!user) throw new Error("Not authenticated")

		const link = await ctx.db
			.query("links")
			.withIndex("by_linkShort", (q) => q.eq("linkShort", linkShort))
			.unique()

		if (!link) throw new Error("Link not found")

		// adjust endTime to next full minute
		if (endTime) endTime = Math.ceil(endTime / 60000) * 60000

		const patch: {
			description?: string
			endTime?: number
			isExpired?: boolean
		} = {}
		if (description !== undefined) patch["description"] = description
		if (endTime !== undefined) patch["endTime"] = endTime
		if (expired !== undefined) patch["isExpired"] = expired

		await ctx.db.patch(link._id, patch)
	},
})

/* MANAGER: delete link */
export const del = mutation({
	args: {
		linkShort: v.string(),
	},
	handler: async (ctx, { linkShort }) => {
		const user = await ctx.auth.getUserIdentity() // manager auth assumed via custom OIDC
		if (!user) throw new Error("Not authenticated")

		const link = await ctx.db
			.query("links")
			.withIndex("by_linkShort", (q) => q.eq("linkShort", linkShort))
			.unique()

		if (!link) return

		await ctx.db.delete(link._id)
	},
})

/* MANAGER: get all links */
export const get = query({
	args: {},
	handler: async (ctx) => {
		const user = await ctx.auth.getUserIdentity() // manager auth assumed via custom OIDC
		if (!user) throw new Error("Not authenticated")

		return await ctx.db.query("links").collect()
	},
})
