import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 1 minute to check links and update car data if needed
crons.interval(
  "check-links-and-update",
  { minutes: 1 },
  internal.scheduled.checkLinksAndUpdate
);

export default crons;
