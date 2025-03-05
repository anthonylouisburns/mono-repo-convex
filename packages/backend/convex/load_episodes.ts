import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
const { XMLParser } = require("fast-xml-parser");
import { Id } from "./_generated/dataModel";
export const TODAYS_DATE = new Date().toISOString().split("T")[0];

export const scheduleDownloadRssForAllPodcasts = internalAction({
  handler: async (ctx) => {
    const podcasts = await ctx.runQuery(api.everwhz.podcasts);
    for (const podcast of podcasts) {
      console.log("scheduling download rss for podcast", podcast.title, podcast._id);

      await ctx.runMutation(internal.batch.utils.createJob, {
        type: "download_rss",
        instructions: {
          podcast_id: podcast._id,
          max_episode: podcast.number_of_episodes,
        },
      });
    }
  },
});

export const downloadRssBody = internalAction({
  args: {
    id: v.id("podcast"),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    const podcast = await ctx.runQuery(api.load_episodes.getPodcast, {
      id: args.id,
    });
    if (podcast == null || podcast.rss_url == null) {
      console.error("podcast not found");
      return;
    }
    console.log("downloading rss for podcast", podcast.title, podcast._id, podcast.rss_url, podcast.response_headers?.etag, podcast.response_headers?.last_modified);
    const headers: Record<string, string> = {};
    if (podcast.response_headers?.etag) {
      headers["If-None-Match"] = podcast.response_headers.etag;
    }
    if (podcast.response_headers?.last_modified) {
      headers["If-Modified-Since"] = podcast.response_headers.last_modified;
    }
    const response = await fetch(podcast.rss_url, { headers });
    if (response.status == 304) {
      console.log("not modified");
      return;
    }
    if (!response.ok) {
      console.error("failed to fetch rss body");
      return;
    }
    const body = await response.blob();
    const headersResponse = response.headers;
    const last_modified = headersResponse.get("last-modified");
    const etag = headersResponse.get("etag");
    const storageId: Id<"_storage"> = await ctx.storage.store(body);

    await ctx.runMutation(api.load_episodes.patchPodcastRss, {
      id: args.id,
      rss_body: storageId,
      etag: etag ?? undefined,
      last_modified: last_modified ?? undefined,
    });

    await ctx.runMutation(internal.batch.utils.saveWork, {
      type: "download_rss",
      summary: {
        date: TODAYS_DATE,
        podcast_id: podcast._id,
        podcast_title: podcast.title,
        podcast_rss_url: podcast.rss_url,
        storage_id: storageId,
      },
    });
    return storageId;
  },
});

export const patchPodcastRss = mutation({
  args: { id: v.id("podcast"), rss_body: v.id("_storage"), etag: v.optional(v.string()), last_modified: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { id, rss_body, etag, last_modified } = args;
    const updateId = await ctx.db.patch(id,
      {
        rss_body: rss_body,
        response_headers: {
          etag: etag,
          last_modified: last_modified,
        },
      });

    return updateId;
  },
});

export const parseXml = action({
  args: {
    pod_id: v.id("podcast"),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    console.log("parseXml");
    const podcast = await ctx.runQuery(api.load_episodes.getPodcast, {
      id: args.pod_id,
    });
    if (podcast == null || podcast.rss_body == null || podcast.chart == null || podcast.rank == null) {
      console.error("podcast not found", podcast?.title, podcast?._id, podcast?.rss_body);
      return;
    }
    const rss_blob = await ctx.storage.get(podcast.rss_body);
    if (rss_blob == null) {
      console.error("doc empty", podcast?.title, podcast?._id, podcast?.rss_body);
      return;
    }
    const rss_text = await rss_blob.text();

    const options = {
      ignoreAttributes: false,
    };
    const parser = new XMLParser(options);
    let doc = parser.parse(rss_text);

    await ctx.runMutation(api.load_episodes.patchPodcastRssJson, {
      podcast_id: args.pod_id,
      podcast_chart: podcast.chart,
      podcast_rank: podcast.rank,
      rss_json: doc,
      date: TODAYS_DATE,
      offset: 0,
    });
  },
});


export const getPodcast = query({
  args: { id: v.id("podcast") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const patchPodcastRssJson = mutation({
  args: { podcast_id: v.id("podcast"), podcast_chart: v.string(), podcast_rank: v.number(), rss_json: v.any(), date: v.string(), offset: v.number() },

  handler: async (ctx, args) => {
    console.log("patchPodcastRssJson start", args.podcast_id);
    const { podcast_id, rss_json } = args;
    const batch_size = 100;

    const items = rss_json.rss.channel.item;
    const max_episode = items.length;
    const podcast_title = rss_json.rss.channel.title;
    const podcast_description = rss_json.rss.channel.description;
    console.log("patching podcast", podcast_title, podcast_id);
    ctx.db.patch(podcast_id, { number_of_episodes: max_episode, title: podcast_title, description: podcast_description });

    let last_batch = false;
    if (args.offset + batch_size >= max_episode) {
      last_batch = true;
    }
    const end_index = Math.min(args.offset + batch_size, max_episode);

    for (let index = args.offset; index < end_index; index++) {
      const item = rss_json.rss.channel.item[index];
      const e_n = Math.ceil(max_episode - index);

      const episode = await ctx.db
        .query("episode")
        .withIndex("podcast_episode_number", (q) =>
          q.eq("podcast_id", args.podcast_id).eq("episode_number", e_n),
        )
        .unique();

      console.log("item", item.title);
      const title = item.title;
      if (!item.enclosure || item.enclosure["@_url"] == null) {
        console.log("mp3_link missing", item);
        return;
      }
      if (episode) {
        ctx.db.patch(episode._id, {
          podcast_id: args.podcast_id,
          episode_number: Math.ceil(max_episode - index),
          episode_description: item.description,
          mp3_link: item.enclosure["@_url"],
          title: title,
          podcast_title: podcast_title,
          chart: args.podcast_chart,
          rank: args.podcast_rank,
          updated_date: args.date
        });
      } else {
        ctx.db.insert("episode", {
          podcast_id: args.podcast_id,
          episode_number: Math.ceil(max_episode - index),
          episode_description: item.description,
          mp3_link: item.enclosure["@_url"],
          title: title,
          podcast_title: podcast_title,
          chart: args.podcast_chart,
          rank: args.podcast_rank,
          updated_date: args.date
        });
      }
    }

    if (last_batch) {
      console.log("patchPodcastRssJson done", podcast_title, args.podcast_id);
      await ctx.scheduler.runAfter(0, internal.load_episodes.markUnTrackedEpisodes, {
        podcast_id: args.podcast_id,
        max_episode: max_episode,
      });
    } else {
      await ctx.scheduler.runAfter(0, api.load_episodes.patchPodcastRssJson, {
        podcast_id: args.podcast_id,
        podcast_chart: args.podcast_chart,
        podcast_rank: args.podcast_rank,
        rss_json: args.rss_json,
        date: args.date,
        offset: args.offset + batch_size,
      });
    }
  },
});

export const markUnTrackedEpisodes = internalMutation({
  args: { podcast_id: v.id("podcast"), max_episode: v.number() },
  handler: async (ctx, args) => {
    const episodes = await ctx.db.query("episode").withIndex("podcast_episode_number",
      (q) => q.eq("podcast_id", args.podcast_id)
        .gte("episode_number", args.max_episode))
      .collect();
    for (const episode of episodes) {
      ctx.db.patch(episode._id, {
        status: "untracked episode",
      });
    }
  },
});
