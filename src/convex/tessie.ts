import { internalAction, internalMutation } from "$convex/server"
import { z } from "zod"

import { carValidator } from "./schema"
import { type Infer } from "convex/values"
import { internal } from "$convex/api"

/* Tessie Zod */
const TessieStateSchema = z.object({
	vin: z.string(),
	drive_state: z.object({
		latitude: z.number(),
		longitude: z.number(),
		heading: z.number().optional(),
		speed: z.number().optional(),
		active_route_destination: z
			.string()
			.nullable()
			.transform((val) => val ?? undefined),
		active_route_latitude: z
			.number()
			.nullable()
			.transform((val) => val ?? undefined),
		active_route_longitude: z
			.number()
			.nullable()
			.transform((val) => val ?? undefined),
		active_route_miles_to_arrival: z
			.number()
			.nullable()
			.transform((val) => val ?? undefined),
		active_route_minutes_to_arrival: z
			.number()
			.nullable()
			.transform((val) => val ?? undefined),
	}),
	charge_state: z.object({
		battery_level: z.number(),
	}),
	climate_state: z.object({
		inside_temp: z.number(),
		outside_temp: z.number(),
	}),
	display_name: z.string(),
})

export const setCarData = internalMutation({
	args: {
		data: carValidator,
	},
	handler: async (ctx, { data }) => {
		const carRow = await ctx.db
			.query("carData")
			.withIndex("by_vin", (q) => q.eq("vin", data.vin))
			.unique()
		if (carRow) {
			await ctx.db.replace(carRow._id, data)
		} else {
			await ctx.db.insert("carData", data)
		}
	},
})

/* SCHEDULED TASK: fetch car data from Tessie and update DB */
export const updateCarData = internalAction({
	args: {},
	handler: async (ctx) => {
		const { TESLA_VIN, TESSIE_ACCESS_TOKEN } = process.env

		if (!TESLA_VIN || !TESSIE_ACCESS_TOKEN) {
			throw new Error("Missing VIN or Tessie token")
		}

		const res = await fetch(`https://api.tessie.com/${TESLA_VIN}/state`, {
			headers: {
				Authorization: `Bearer ${TESSIE_ACCESS_TOKEN}`,
			},
		})

		if (!res.ok) {
			throw new Error(`Tessie API error: ${res.status}`)
		}
		const rawData = await res.json()
		const parsed = TessieStateSchema.safeParse(rawData)
		if (!parsed.success) {
			throw new Error("Invalid data from Tessie API: " + parsed.error.message, {
				cause: parsed.error,
			})
		}
		const data = parsed.data

		const dbData: Infer<typeof carValidator> = {
			vin: data.vin,
			carName: data.display_name,
			lastUpdate: Date.now(),
			gpsLatitude: data.drive_state.latitude,
			gpsLongitude: data.drive_state.longitude,
			gpsHeading: data.drive_state.heading,
			speed: data.drive_state.speed,
			activeRouteDestination: data.drive_state.active_route_destination,
			activeRouteLatitude: data.drive_state.active_route_latitude,
			activeRouteLongitude: data.drive_state.active_route_longitude,
			activeRouteMilesToArrival: data.drive_state.active_route_miles_to_arrival,
			activeRouteMinutesToArrival: data.drive_state.active_route_minutes_to_arrival,
			batteryLevel: data.charge_state.battery_level,
			insideTemp: data.climate_state.inside_temp,
			outsideTemp: data.climate_state.outside_temp,
		}

		await ctx.runMutation(internal.tessie.setCarData, {
			data: dbData,
		})
	},
})
