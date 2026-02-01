import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  links: defineTable({
    linkShort: v.string(), // 32 characters, random
    description: v.string(), // some text, for manager
    endTime: v.number(), // timestamp, when the share is over
    lastViewed: v.optional(v.number()), // timestamp, when the last user accessed the link
  }).index("by_linkShort", ["linkShort"]),

  carData: defineTable({
    vin: v.string(), // vin, for identification
    carName: v.string(), // last_state.display_name, for showing on clients
    lastUpdate: v.number(), // timestamp of the last update
    // Car data
    gpsLatitude: v.optional(v.number()), // last_state.drive_state.latitude
    gpsLongitude: v.optional(v.number()), // last_state.drive_state.longitude
    gpsHeading: v.optional(v.number()), // last_state.drive_state.heading
    speed: v.optional(v.number()), // last_state.drive_state.speed
    activeRouteDestination: v.optional(v.string()), // last_state.active_route.destination
    activeRouteLatitude: v.optional(v.number()), // last_state.active_route.latitude
    activeRouteLongitude: v.optional(v.number()), // last_state.active_route.longitude
    activeRouteMilesToArrival: v.optional(v.number()), // last_state.active_route.miles_to_arrival
    activeRouteMinutesToArrival: v.optional(v.number()), // last_state.active_route.minutes_to_arrival
  }).index("by_vin", ["vin"]),

  // Users table for OIDC auth
  users: defineTable({
    subject: v.string(), // OIDC subject (unique identifier from provider)
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  }).index("by_subject", ["subject"]),
});
