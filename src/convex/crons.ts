import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
  "remove expired links",
  { minutes: 1 },
  internal.links.removeExpiredLinks,
)

export default crons
