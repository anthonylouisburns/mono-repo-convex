import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "test_taddy",
  { hourUTC: 20, minuteUTC: 35 },
  internal.batch_coordination.batchCoordination,
  {},
);

export default crons;
