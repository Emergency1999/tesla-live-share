import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Check all links and cleanup expired ones, trigger car update if valid links exist
export const checkLinksAndUpdate = internalAction({
  args: {},
  handler: async (ctx) => {
    // First, clean up expired links
    const deletedCount = await ctx.runMutation(internal.scheduled.cleanupExpiredLinks, {});
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} expired links`);
    }

    // Check if there are any valid links
    const hasValidLinks = await ctx.runQuery(internal.scheduled.hasValidLinks, {});

    // If there are valid links, trigger car update
    if (hasValidLinks) {
      const vin = process.env.CAR_VIN;
      if (vin) {
        await ctx.runAction(internal.tessie.fetchCarData, { vin });
        console.log("Car data update triggered");
      } else {
        console.error("CAR_VIN not configured");
      }
    }
  },
});

// Cleanup expired links
export const cleanupExpiredLinks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const links = await ctx.db.query("links").collect();
    
    let deletedCount = 0;
    for (const link of links) {
      if (link.endTime < now) {
        await ctx.db.delete(link._id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  },
});

// Check if there are any valid links
export const hasValidLinks = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const links = await ctx.db.query("links").collect();
    
    return links.some((link) => link.endTime >= now);
  },
});
