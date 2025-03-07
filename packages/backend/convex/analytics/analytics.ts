import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { timeline_aggregate } from "../page_timeline";

export const countEpisodes = internalQuery({
    args: {},   
    handler: async (ctx) => {
        return await timeline_aggregate.count(ctx);
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


