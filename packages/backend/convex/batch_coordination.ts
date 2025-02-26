
import { api, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

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

