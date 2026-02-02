import { query, mutation } from "$convex/server"
import { internal } from "$convex/api"
import { v, type Infer } from "convex/values"
import type { carValidator } from "./schema"

/* PUBLIC: fetch car data (read-only) */
export const getCarData = query({
	args: {
		short: v.string(),
	},
	handler: async (ctx, { short }) => {
		const link = await ctx.db
			.query("links")
			.withIndex("by_linkShort", (q) => q.eq("linkShort", short))
			.unique()

		if (!link || link.endTime < Date.now()) {
			throw new Error("Link invalid or expired")
		}

		const { TESLA_VIN } = process.env

		if (!TESLA_VIN) {
			throw new Error("Missing VIN")
		}

		let carRow: Infer<typeof carValidator> | null = await ctx.db
			.query("carData")
			.withIndex("by_vin", (q) => q.eq("vin", TESLA_VIN))
			.unique()

		if (!carRow) return undefined

		// only expose certain fields
		const retData = {
			lastUpdate: carRow.lastUpdate,
			latitude: carRow.gpsLatitude,
			longitude: carRow.gpsLongitude,
			heading: carRow.gpsHeading,
			speed: carRow.speed,
			carName: carRow.carName,
			activeRouteDestination: carRow.activeRouteDestination,
			activeRouteLatitude: carRow.activeRouteLatitude,
			activeRouteLongitude: carRow.activeRouteLongitude,
			activeRouteMilesToArrival: carRow.activeRouteMilesToArrival,
			activeRouteMinutesToArrival: carRow.activeRouteMinutesToArrival,
		}
		return retData
	},
})

/* PUBLIC: update lastViewed and trigger update task */
export const touchLink = mutation({
	args: {
		short: v.string(),
	},
	handler: async (ctx, { short }) => {
		const link = await ctx.db
			.query("links")
			.withIndex("by_linkShort", (q) => q.eq("linkShort", short))
			.unique()

		if (!link || link.endTime < Date.now()) return

		// check if last update was over 9 seconds ago
		if (Date.now() - (link.lastViewed || 0) < 9000) return

		// update lastViewed timestamp
		await ctx.db.patch(link._id, { lastViewed: Date.now() })

		// schedule car data update (assuming scheduled mutation exists)
		await ctx.scheduler.runAfter(0, internal.tessie.updateCarData, {})
	},
})
