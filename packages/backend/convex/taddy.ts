import {
  internalAction,
  mutation,
  query,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const PODCASTSERIES_HISTORY = "PODCASTSERIES_HISTORY";
export const PODCASTSERIES_MUSIC_HISTORY = "PODCASTSERIES_MUSIC_HISTORY";
export const PODCASTSERIES_TV_AND_FILM_HISTORY = "PODCASTSERIES_TV_AND_FILM_HISTORY";

export const CHART_TYPES = [PODCASTSERIES_HISTORY, PODCASTSERIES_MUSIC_HISTORY, PODCASTSERIES_TV_AND_FILM_HISTORY];
export const PAGES = [1, 2];
export const PAGE_SIZE = 25;

export const taddyBatchDownloadCharts = internalAction({
  args: {},
  handler: async (ctx, args) => {
    const date = new Date().toISOString().split("T")[0];

    for (const chart_type of CHART_TYPES) {
      for (const page of PAGES) {
        await ctx.runAction(internal.taddy.taddyDownloadCharts, {
          chart_type: chart_type,
          page: page,
          date: date,
        });
        await ctx.runMutation(internal.batch.utils.saveWork, {
          type: "download_charts",
          summary: {
            date: date,
            page: page,
            chart_type: chart_type,
          },
        });
      }
    }
    return date;
  },
});


export const taddyDownloadCharts = internalAction({
  args: { chart_type: v.string(), page: v.number(), date: v.string() },

  // Action implementation.
  handler: async (ctx, args) => {
    const taddy = "https://api.taddy.org";
    const { chart_type, page, date } = args;

    console.log("Starting Taddy download:", { chart_type, page, date }); // Debug log

    const query = `query {
          getTopChartsByGenres(
            taddyType: PODCASTSERIES, 
            genres: [${chart_type}], 
            limitPerPage: ${PAGE_SIZE},
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
    await ctx.runMutation(
      api.taddy.taddyInsertCharts,
      {
        chart_data: body,
        chart_type: chart_type,
        page: page,
        date: date,
      },
    );
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


