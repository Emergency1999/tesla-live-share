import { internalMutation } from "./_generated/server"

/* INTERNAL: remove expired links */
export const removeExpiredLinks = internalMutation({
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
