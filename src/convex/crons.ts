import { cronJobs } from "convex/server"
import { internal } from "$convex/api"

const crons = cronJobs()

crons.interval("remove expired links", { hours: 1 }, internal.links.removeExpired)

export default crons
