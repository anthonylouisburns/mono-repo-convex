import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import { insertTimeline, timeline_aggregate } from "./page_timeline";
import { deleteTimeline } from "./page_timeline";
import { Doc } from "./_generated/dataModel";
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

export const migrations = new Migrations(components.migrations);


// export const runAggregateBackfill = migrations.define({
//   table: "timeline",
//   batchSize: 100, // Process 100 documents at a time
//   migrateOne: async (ctx, doc) => {
//     await timeline_aggregate.insertIfDoesNotExist(ctx, doc as any);
//   },
// });

export const run = migrations.runner();

export const createTimeline = migrations.define({
  table: "episode",
  batchSize: 100, // Process 100 documents at a time
  migrateOne: async (ctx, episode) => {
    await insertTimelineFunc(ctx, episode as Doc<"episode">);
  },
});

export async function insertTimelineFunc(ctx: MutationCtx, episode: Doc<"episode">) {
  const timeline = await ctx.db.query("timeline")
    .withIndex("podcast_episode", (q) => q.eq("podcast_id", episode.podcast_id).eq("episode_id", episode._id))
    .unique();
  if (timeline) {
    await deleteTimeline(ctx, timeline._id as Id<"timeline">);
  }
  if (episode._id && episode.years && episode.years.length > 0
    && episode.chart && episode.rank && episode.episode_number) {
    await insertTimeline(ctx, {
      podcast_id: episode.podcast_id,
      episode_id: episode._id,
      start: episode.years[0],
      end: episode.years[episode.years.length - 1],
      geoname: episode.geonames?.[0] ?? "",
      chart: episode.chart,
      rank: episode.rank,
      episode_number: episode.episode_number,
    });
  }
}