import { query, mutation } from "$convex/server"
import { internal } from "$convex/api"
import { v, type Infer } from "convex/values"
import type { carValidator } from "./schema"

function milesToKilometers(miles: number | undefined) {
	if (miles === undefined) return undefined
	return miles * 1.609344
}

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

		if (!link || link.isExpired || link.endTime < Date.now()) {
			throw new Error("Link invalid or expired")
		}

		const { TESLA_VIN } = process.env

		if (!TESLA_VIN) {
			throw new Error("Missing VIN")
		}

		const carRow: Infer<typeof carValidator> | null = await ctx.db
			.query("carData")
			.withIndex("by_vin", (q) => q.eq("vin", TESLA_VIN))
			.unique()

		if (!carRow) return undefined

		// only expose certain fields
		const retData = {
			hasUnlockRights: link.hasUnlockRights,
			hasStartRights: link.hasStartRights,

			lastUpdate: carRow.lastUpdate,
			latitude: carRow.gpsLatitude,
			longitude: carRow.gpsLongitude,
			heading: carRow.gpsHeading,
			speed: carRow.speed,
			carName: carRow.carName,
			state: carRow.state,
			locked: carRow.locked,
			activeRouteDestination: carRow.activeRouteDestination,
			activeRouteLatitude: carRow.activeRouteLatitude,
			activeRouteLongitude: carRow.activeRouteLongitude,
			activeRouteKilometersToArrival: milesToKilometers(carRow.activeRouteMilesToArrival),
			activeRouteMinutesToArrival: carRow.activeRouteMinutesToArrival,
			batteryLevel: carRow.batteryLevel,
			insideTemp: carRow.insideTemp,
			outsideTemp: carRow.outsideTemp,
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

		if (!link) return

		// check if expired and mark it
		const now = Date.now()
		if (link.endTime < now) {
			if (!link.isExpired) {
				await ctx.db.patch(link._id, { isExpired: true })
			}
			return
		}

		// update lastViewed timestamp
		await ctx.db.patch(link._id, { lastViewed: now })

		const { TESLA_VIN } = process.env

		if (!TESLA_VIN) {
			throw new Error("Missing VIN")
		}

		// check if last car update was over 9 seconds ago
		const carRow: Infer<typeof carValidator> | null = await ctx.db
			.query("carData")
			.withIndex("by_vin", (q) => q.eq("vin", TESLA_VIN))
			.unique()
		if (carRow && Date.now() - carRow.lastUpdate < 9 * 1000) return

		// schedule car data update (assuming scheduled mutation exists)
		await ctx.scheduler.runAfter(0, internal.tessie.updateCarData, {})
	},
})

export const carAction = mutation({
	args: {
		short: v.string(),
		action: v.union(v.literal("lock"), v.literal("unlock"), v.literal("remote_start")),
	},
	handler: async (ctx, { short, action }) => {
		// verify link and permissions
		const link = await ctx.db
			.query("links")
			.withIndex("by_linkShort", (q) => q.eq("linkShort", short))
			.unique()

		if (!link || link.isExpired || link.endTime < Date.now()) {
			throw new Error("Link invalid or expired")
		}

		if (
			(action === "lock" && !link.hasUnlockRights) ||
			(action === "unlock" && !link.hasUnlockRights) ||
			(action === "remote_start" && !link.hasStartRights)
		) {
			throw new Error("Insufficient permissions for this action")
		}

		await ctx.scheduler.runAfter(0, internal.tessie.executeOnCar, { command: action })
	},
})
