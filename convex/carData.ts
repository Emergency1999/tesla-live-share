import { query, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Get car data for a given link short (public)
export const getCarData = query({
  args: {
    linkShort: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if link exists and is valid
    const link = await ctx.db
      .query("links")
      .withIndex("by_linkShort", (q) => q.eq("linkShort", args.linkShort))
      .first();

    if (!link) {
      return null;
    }

    // Check if link has expired
    const now = Date.now();
    if (link.endTime < now) {
      return null;
    }

    // Get car data using VIN from environment
    const vin = process.env.CAR_VIN;
    if (!vin) {
      return null;
    }

    const carData = await ctx.db
      .query("carData")
      .withIndex("by_vin", (q) => q.eq("vin", vin))
      .first();

    return carData;
  },
});

// Internal query to get car data by VIN
export const getCarDataByVin = internalQuery({
  args: {
    vin: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("carData")
      .withIndex("by_vin", (q) => q.eq("vin", args.vin))
      .first();
  },
});

// Update last viewed timestamp (called via action scheduler)
export const updateLastViewed = internalMutation({
  args: {
    linkShort: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("links")
      .withIndex("by_linkShort", (q) => q.eq("linkShort", args.linkShort))
      .first();

    if (link) {
      await ctx.db.patch(link._id, {
        lastViewed: Date.now(),
      });
    }
  },
});

// Trigger update if car data is older than 10 seconds (called from client)
export const triggerUpdateIfNeeded = internalAction({
  args: {
    linkShort: v.string(),
  },
  handler: async (ctx, args) => {
    // First update last viewed
    await ctx.runMutation(internal.carData.updateLastViewed, {
      linkShort: args.linkShort,
    });

    // Then check if we need to update car data
    await ctx.runAction(internal.carData.maybeUpdateCarData, {});
  },
});

// Check if update is needed and trigger it
export const maybeUpdateCarData = internalAction({
  args: {},
  handler: async (ctx) => {
    const vin = process.env.CAR_VIN;
    if (!vin) {
      console.error("CAR_VIN not configured");
      return;
    }

    // This will call the mutation to check and update car data if needed
    await ctx.runAction(internal.tessie.fetchCarData, { vin });
  },
});

// Update car data in database
export const updateCarDataInDb = internalMutation({
  args: {
    vin: v.string(),
    carName: v.string(),
    gpsLatitude: v.optional(v.number()),
    gpsLongitude: v.optional(v.number()),
    gpsHeading: v.optional(v.number()),
    speed: v.optional(v.number()),
    activeRouteDestination: v.optional(v.string()),
    activeRouteLatitude: v.optional(v.number()),
    activeRouteLongitude: v.optional(v.number()),
    activeRouteMilesToArrival: v.optional(v.number()),
    activeRouteMinutesToArrival: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("carData")
      .withIndex("by_vin", (q) => q.eq("vin", args.vin))
      .first();

    const data = {
      vin: args.vin,
      carName: args.carName,
      lastUpdate: Date.now(),
      gpsLatitude: args.gpsLatitude,
      gpsLongitude: args.gpsLongitude,
      gpsHeading: args.gpsHeading,
      speed: args.speed,
      activeRouteDestination: args.activeRouteDestination,
      activeRouteLatitude: args.activeRouteLatitude,
      activeRouteLongitude: args.activeRouteLongitude,
      activeRouteMilesToArrival: args.activeRouteMilesToArrival,
      activeRouteMinutesToArrival: args.activeRouteMinutesToArrival,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("carData", data);
    }
  },
});
