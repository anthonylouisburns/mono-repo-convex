import {
  internalAction,
  mutation,
  query,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { addPendingPodcastInternal } from "./everwhz";
import { Id } from "./_generated/dataModel";

export const testTaddy = internalAction({
  args: {},
  handler: async (ctx, args) => {
    console.log("Starting Taddy test");
    return "OK";
  },
});

export const taddyDownloadCharts = internalAction({
  args: { chart_type: v.string(), page: v.number() },

  // Action implementation.
  handler: async (ctx, args) => {
    const taddy = "https://api.taddy.org";
    const date = new Date().toISOString().split("T")[0];
    const { chart_type, page } = args;

    console.log("Starting Taddy download:", { chart_type, page, date }); // Debug log

    const query = `query {
          getTopChartsByGenres(
            taddyType: PODCASTSERIES, 
            genres: [${chart_type}], 
            limitPerPage: 25,
            page: ${page}
          ) {
            topChartsId
            podcastSeries {
              uuid
              name
              rssUrl
            }
          }
        }`;

    const response = await fetch(taddy, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-USER-ID": "2419",
        "X-API-KEY":
          "4bf4b440641ff707a6967b30639781ddc4eccb436c6de753e484db8586fcbfb0df7e3e79cbf2d0dc2c127601cc37a08bff",
      },
      body: JSON.stringify({ query }),
    });
    console.log(response);
    const body = await response.json();
    console.log(body);
    const id: Id<"taddy_charts"> | null = await ctx.runMutation(
      api.taddy.taddyInsertCharts,
      {
        chart_data: body,
        chart_type: chart_type,
        page: page,
        date: date,
      },
    );
    if (id) {
      await ctx.scheduler.runAfter(0, internal.taddy.taddyLoadChartsInternal, {
        id: id,
      });
    }
  },
});

export const taddyInsertCharts = mutation({
  args: {
    chart_data: v.any(),
    chart_type: v.string(),
    page: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("taddy_charts")
      .withIndex("chart_index", (q) =>
        q
          .eq("date", args.date)
          .eq("chart_type", args.chart_type)
          .eq("page", args.page),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return await ctx.db.insert("taddy_charts", args);
  },
});

export const taddyGetCharts = query({
  args: { chart_type: v.string(), page: v.number(), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taddy_charts")
      .withIndex("chart_index", (q) =>
        q
          .eq("date", args.date)
          .eq("chart_type", args.chart_type)
          .eq("page", args.page),
      )
      .unique();
  },
});

export const taddyGetChartsById = query({
  args: { id: v.id("taddy_charts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const taddyLoadCharts = internalMutation({
  args: { chart_type: v.string(), page: v.number(), date: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(api.taddy.taddyGetCharts, args);
    if (!data) {
      return { error: "No data found" };
    }
    data.chart_data.data.getTopChartsByGenres.podcastSeries.map(
      async (series: any) =>
        await addPendingPodcastInternal(ctx, {
          rss_url: series.rssUrl,
          user_id: "INTERNAL",
        }),
    );
    return "OK";
  },
});

export const taddyLoadChartsInternal = internalMutation({
  args: { id: v.id("taddy_charts") },
  handler: async (ctx, args) => {
    const data = await ctx.db.get(args.id);
    if (!data) {
      return { error: "No data found" };
    }
    data.chart_data.data.getTopChartsByGenres.podcastSeries.map(
      async (series: any) =>
        await addPendingPodcastInternal(ctx, {
          rss_url: series.rssUrl,
          user_id: "INTERNAL",
        }),
    );
    return "OK";
  },
});
