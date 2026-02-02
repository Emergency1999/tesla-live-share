import { query, mutation } from "./_generated/server"
import { internal } from "./_generated/api"
import { v, type Infer } from "convex/values"
import type { carValidator } from "./schema"

/* PUBLIC: fetch car data (read-only) */
export const getCarData = query({
	args: {
		linkShort: v.string(),
	},
	handler: async (ctx, { linkShort }) => {
		const { TESLA_VIN } = process.env

		if (!TESLA_VIN) {
			throw new Error("Missing VIN")
		}

		const link = await ctx.db
			.query("links")
			.withIndex("by_linkShort", (q) => q.eq("linkShort", linkShort))
			.unique()

		if (!link || link.endTime < Date.now()) {
			throw new Error("Link invalid or expired")
		}

		let carRow: Infer<typeof carValidator> | null = await ctx.db
			.query("carData")
			.withIndex("by_vin", (q) => q.eq("vin", TESLA_VIN))
			.unique()

		if (!carRow) return undefined

		// only expose certain fields
		const retData = {
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
		linkShort: v.string(),
	},
	handler: async (ctx, { linkShort }) => {
		const link = await ctx.db
			.query("links")
			.withIndex("by_linkShort", (q) => q.eq("linkShort", linkShort))
			.unique()

		if (!link || link.endTime < Date.now()) return

		await ctx.db.patch(link._id, { lastViewed: Date.now() })

		// schedule car data update (assuming scheduled mutation exists)
		await ctx.scheduler.runAfter(0, internal.tessie.updateCarData, {})
	},
})
