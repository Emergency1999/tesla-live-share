import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a random 32-character string for link short
function generateLinkShort(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new link (manager only)
export const createLink = mutation({
  args: {
    description: v.string(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated - manager access required");
    }

    // Generate unique link short
    let linkShort: string;
    let existing;
    do {
      linkShort = generateLinkShort();
      existing = await ctx.db
        .query("links")
        .withIndex("by_linkShort", (q) => q.eq("linkShort", linkShort))
        .first();
    } while (existing);

    await ctx.db.insert("links", {
      linkShort,
      description: args.description,
      endTime: args.endTime,
      lastViewed: undefined,
    });

    return linkShort;
  },
});

// Delete a link (manager only)
export const deleteLink = mutation({
  args: {
    linkShort: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated - manager access required");
    }

    const link = await ctx.db
      .query("links")
      .withIndex("by_linkShort", (q) => q.eq("linkShort", args.linkShort))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
    }
  },
});

// Get all links (manager only)
export const getLinks = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated - manager access required");
    }

    return await ctx.db.query("links").collect();
  },
});
