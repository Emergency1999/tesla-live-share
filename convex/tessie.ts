import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Tessie API base URL
const TESSIE_API_BASE = "https://api.tessie.com";

interface TessieVehicleState {
  display_name?: string;
  drive_state?: {
    latitude?: number;
    longitude?: number;
    heading?: number;
    speed?: number;
  };
  active_route?: {
    destination?: string;
    latitude?: number;
    longitude?: number;
    miles_to_arrival?: number;
    minutes_to_arrival?: number;
  };
}

interface TessieResponse {
  last_state?: TessieVehicleState;
}

// Fetch car data from Tessie API
export const fetchCarData = internalAction({
  args: {
    vin: v.string(),
  },
  handler: async (ctx, args) => {
    const accessToken = process.env.TESSIE_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("TESSIE_ACCESS_TOKEN not configured");
      return;
    }

    try {
      const response = await fetch(`${TESSIE_API_BASE}/${args.vin}/state`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`Tessie API error: ${response.status} ${response.statusText}`);
        return;
      }

      const data: TessieResponse = await response.json();
      const lastState = data.last_state;

      if (!lastState) {
        console.error("No last_state in Tessie response");
        return;
      }

      // Update car data in database
      await ctx.runMutation(internal.carData.updateCarDataInDb, {
        vin: args.vin,
        carName: lastState.display_name || "Tesla",
        gpsLatitude: lastState.drive_state?.latitude,
        gpsLongitude: lastState.drive_state?.longitude,
        gpsHeading: lastState.drive_state?.heading,
        speed: lastState.drive_state?.speed,
        activeRouteDestination: lastState.active_route?.destination,
        activeRouteLatitude: lastState.active_route?.latitude,
        activeRouteLongitude: lastState.active_route?.longitude,
        activeRouteMilesToArrival: lastState.active_route?.miles_to_arrival,
        activeRouteMinutesToArrival: lastState.active_route?.minutes_to_arrival,
      });

      console.log(`Car data updated for VIN: ${args.vin}`);
    } catch (error) {
      console.error("Error fetching car data from Tessie:", error);
    }
  },
});
