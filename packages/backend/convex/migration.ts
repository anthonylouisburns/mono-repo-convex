import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import { insertTimeline, timeline_aggregate } from "./page_timeline";
import { deleteTimeline } from "./page_timeline";
import { Doc } from "./_generated/dataModel";
import { Id } from "./_generated/dataModel";
import { internalAction, MutationCtx } from "./_generated/server";

export const migrations = new Migrations(components.migrations);


export const clearAggregate = internalAction({
  args: {},
  handler: async (ctx) => {
    await timeline_aggregate.clear(ctx) 
  },
});

export const run = migrations.runner();

// [ ] make a migration to delete from timeline if it can't find the episode
    // await migrations.runSerially(ctx, [internal.migration.createTimeline])
export const createTimeline = migrations.define({
  table: "episode",
  batchSize: 100, // Process 100 documents at a time
  migrateOne: async (ctx, episode) => {
    await insertTimelineFunc(ctx, episode as Doc<"episode">, true);
  },
});

export const udpateTimeline = migrations.define({
  table: "episode",
  batchSize: 100, // Process 100 documents at a time
  migrateOne: async (ctx, episode) => {
    await insertTimelineFunc(ctx, episode as Doc<"episode">, false);
  },
});

export async function patchTimeline(ctx: MutationCtx, episode_id: Id<"episode">) {
  const episode = await ctx.db.get(episode_id);
  await insertTimelineFunc(ctx, episode as Doc<"episode">, true);
}

export async function insertTimelineFunc(ctx: MutationCtx, episode: Doc<"episode">, update:boolean) {
  const timeline = await ctx.db.query("timeline")
    .withIndex("podcast_episode", (q) => q.eq("podcast_id", episode.podcast_id).eq("episode_id", episode._id))
    .unique();
  if (timeline) {
    if (update) {
      await deleteTimeline(ctx, timeline._id as Id<"timeline">);
    } else {
      return;
    }
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