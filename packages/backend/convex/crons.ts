import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
if (process.env.CONVEX_ENV === "production") {
  crons.daily(
    "test_taddy",
    { hourUTC: 20, minuteUTC: 35 },
    internal.batch.batch_coordination.dailyInitialBatchJob,
    {},
  );
}
if (process.env.CONVEX_ENV != "production") {
  crons.daily(
    "test_taddy",
    { hourUTC: 20, minuteUTC: 35 },
    internal.batch.batch_coordination.echo,
    {},
  );
}
export default crons;
