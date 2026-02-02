import { internalMutation, mutation, query } from "./_generated/server"
import { v } from "convex/values"

/* helpers */
const randomLink = () => crypto.randomUUID().replace(/-/g, "").slice(0, 32)

/* INTERNAL: remove expired links */
export const removeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const DELETE_WHEN_OLDER_THAN_MS = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now() - DELETE_WHEN_OLDER_THAN_MS;
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
export const del = mutation({
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
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("links").collect()
  },
})
