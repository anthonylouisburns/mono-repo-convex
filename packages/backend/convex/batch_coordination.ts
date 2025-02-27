
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import { episode } from "./everwhz";

export const batchCoordination = internalAction({
    args: {},
    handler: async (ctx) => {
        const date = await ctx.runAction(internal.taddy.taddyBatchDownloadCharts);
        console.log("date", date);
        if (date) {
            await ctx.runMutation(internal.load_podcasts.loadChartPodcasts, {
                date: date,
            });
        }
        await ctx.runAction(internal.load_episodes.loadAllEpisodes);
        await ctx.scheduler.runAfter(5, internal.geminiBatchPodcast.startGeminiBatchProcess);
    },
});

export const countEpisodes = internalAction({
    args: {},
    handler: async (ctx) => {
        const podcasts = await ctx.runQuery(api.everwhz.podcasts);
        let count = 0;
        for (const podcast of podcasts) {
            const sub_count = await ctx.runQuery(internal.batch_coordination.countEpisodesByPodcast, { podcast_id: podcast._id });
            count += sub_count;
        }
        console.log("count", podcasts.length, count);
        return count;
    },
});

export const countEpisodesByPodcast = internalQuery({
    args: { podcast_id: v.id("podcast") },
    handler: async (ctx, args) => {
        const episodes = await ctx.db.query("episode")
            .withIndex("podcast_episode_number", (q) => q.eq("podcast_id", args.podcast_id))
            .filter((q) => q.neq(q.field("years"), undefined))
            .filter((q) => q.neq(q.field("chart"), undefined))
            .filter((q) => q.neq(q.field("rank"), undefined))
            .filter((q) => q.neq(q.field("geonames"), undefined))
            .filter((q) => q.neq(q.field("episode_number"), undefined))
            .collect();
        console.log("episodes podcast:", args.podcast_id, episodes.length);
        return episodes.length;
    },
});

export const countTimeline = internalQuery({
    handler: async (ctx) => {
        const timeline = await ctx.db.query("timeline").collect();
        return timeline.length;
    },
});