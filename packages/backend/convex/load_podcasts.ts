import {
    internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const loadChartEpisodes = internalMutation({
    args: { date: v.string() },
    handler: async (ctx, args) => {
        const charts = await ctx.db.query("taddy_charts").filter(q => q.eq(q.field("date"), args.date)).collect();

        console.log("Loading episodes", args.date);
        //loop over all charts for the date
        charts.forEach((chart) => {
            ctx.runMutation(internal.load_podcasts.updateAddPodcast, {
                chart_id: chart._id
            });
        });
        ctx.runMutation(internal.load_podcasts.unchartedPodcasts, {
            date: args.date
        });
    },
});

export const unchartedPodcasts = internalMutation({
    args: { date: v.string() },
    handler: async (ctx, args) => {
        const podcasts = await ctx.db.query("podcast").filter(q => q.neq(q.field("updated_date"), args.date)).collect();
        console.log("uncharted podcasts", podcasts.length);
        podcasts.forEach(async (podcast) => {
            await ctx.db.patch(podcast._id, {
                rank: 201,
            });
        });
    },
});

export const updateAddPodcast = internalMutation({
    args: { chart_id: v.id("taddy_charts")},
    handler: async (ctx, args) => {
        const chart = await ctx.db.get(args.chart_id);
        if (!chart) {
            return { error: "No data found" };
        }
        
        // Using for...of to properly handle async operations
        for (const [index, series] of chart.chart_data.data.getTopChartsByGenres.podcastSeries.entries()) {
            console.log("podcast", index, series.name, series.rssUrl);

            //[ ] todo check using guid?
            const existing = await ctx.db
                .query("podcast")
                .withIndex("rss_url", (q) => q.eq("rss_url", series.rssUrl))
                .unique();

            if (existing) {
                console.log(index, "podcast already exists", series.name, series.rssUrl, existing._id);
                ctx.db.patch(existing._id, {
                    chart: chart.chart_type,
                    rank: index + 1,
                    updated_date: chart.date,
                });
            } else {
                console.log(index, "podcast does not exist", series.name, series.rssUrl);
                const id = await ctx.db.insert("podcast", {
                    rss_url: series.rssUrl,
                    chart: chart.chart_type,
                    rank: index + 1,
                    updated_date: chart.date,
                });
            }
        }
    },
});
