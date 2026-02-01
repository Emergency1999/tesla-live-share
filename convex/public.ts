import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

    // Check if car data needs update (older than 10 seconds)
    const vin = process.env.CAR_VIN;
    if (vin) {
      // Get current car data to check if update is needed
      const carData = await ctx.runQuery(internal.carData.getCarDataByVin, { vin });
      const now = Date.now();
      
      // If car data doesn't exist or is older than 10 seconds, trigger update
      if (!carData || (now - carData.lastUpdate) > 10000) {
        await ctx.runAction(internal.tessie.fetchCarData, { vin });
      }
    }

    return { success: true };
  },
});
