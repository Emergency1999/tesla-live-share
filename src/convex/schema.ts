import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const carValidatorBase = {
	vin: v.string(),
	carName: v.string(),
	lastUpdate: v.number(), // timestamp (ms)
	gpsLatitude: v.number(),
	gpsLongitude: v.number(),
	gpsHeading: v.optional(v.number()),
	speed: v.optional(v.number()),
	activeRouteDestination: v.optional(v.string()),
	activeRouteLatitude: v.optional(v.number()),
	activeRouteLongitude: v.optional(v.number()),
	activeRouteMilesToArrival: v.optional(v.number()),
	activeRouteMinutesToArrival: v.optional(v.number()),
}

export const carValidator = v.object(carValidatorBase)

export default defineSchema({
	links: defineTable({
		linkShort: v.string(), // 32-char random
		description: v.string(), // manager note
		endTime: v.number(), // timestamp (ms)
		lastViewed: v.optional(v.number()), // timestamp (ms)
	})
		.index("by_linkShort", ["linkShort"])
		.index("by_endTime", ["endTime"]),

	carData: defineTable(carValidatorBase).index("by_vin", ["vin"]),
})
