import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Minimum time (in milliseconds) before car data is considered stale and
 * should be refreshed from the Tessie API.
 * This prevents excessive API calls when multiple users access a link.
 */
const CAR_DATA_STALENESS_THRESHOLD_MS = 10_000; // 10 seconds

// Check link validity and trigger update if needed (public action)
export const accessLink = action({
  args: {
    linkShort: v.string(),
  },
  handler: async (ctx, args) => {
    // Run the internal action to update last viewed and potentially trigger car update
    await ctx.runMutation(internal.carData.updateLastViewed, {
      linkShort: args.linkShort,
    });

    // Check if car data needs update (older than staleness threshold)
    const vin = process.env.CAR_VIN;
    if (vin) {
      // Get current car data to check if update is needed
      const carData = await ctx.runQuery(internal.carData.getCarDataByVin, { vin });
      const now = Date.now();
      
      // If car data doesn't exist or is stale, trigger update from Tessie API
      if (!carData || (now - carData.lastUpdate) > CAR_DATA_STALENESS_THRESHOLD_MS) {
        await ctx.runAction(internal.tessie.fetchCarData, { vin });
      }
    }

    return { success: true };
  },
});
