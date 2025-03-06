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



export const getPodcast = query({
  args: { id: v.id("podcast") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const patchPodcastRssJson = mutation({
  args: { podcast_id: v.id("podcast"), rss_json: v.array(v.any()), date: v.string()},

  handler: async (ctx, args) => {
    console.log("patchPodcastRssJson start", args.podcast_id, args.date);
    const podcast = await ctx.db.get(args.podcast_id);
    if (!podcast) {
      console.log("podcast not found", args.podcast_id);
      return;
    }
    for (const episode_data of args.rss_json) {  
      const episode_number = episode_data.episode_number;
      const episode = await ctx.db
        .query("episode")
        .withIndex("podcast_episode_number", (q) =>
          q.eq("podcast_id", args.podcast_id).eq("episode_number", episode_number),
        )
        .unique();

      if (episode_data.mp3_link == null) {
        console.log("mp3_link missing", episode_data);
        return;
      }
      if (episode) {
        console.log("patching episode", episode._id, episode_data);
        ctx.db.patch(episode._id, {
          podcast_id: args.podcast_id,
          episode_number: episode_number,
          episode_description: episode_data.description,
          mp3_link: episode_data.mp3_link,
          title: episode_data.title,
          podcast_title: podcast.title,
          updated_date: args.date,
          chart: podcast.chart,
          rank: podcast.rank,
          status: undefined,
        });
      } else {
        console.log("inserting episode", episode_data);
        ctx.db.insert("episode", {
          podcast_id: args.podcast_id,
          episode_number: episode_number,
          episode_description: episode_data.description,
          mp3_link: episode_data.mp3_link,
          title: episode_data.title,
          podcast_title: podcast.title,
          updated_date: args.date,
          chart: podcast.chart,
          rank: podcast.rank,
          status: undefined,
        });
      }
    }
  },
});

export const markUnTrackedEpisodes = internalMutation({
  args: { podcast_id: v.id("podcast"), max_episode: v.number() },
  handler: async (ctx, args) => {
    const episodes = await ctx.db.query("episode").withIndex("podcast_episode_number",
      (q) => q.eq("podcast_id", args.podcast_id)
        .gt("episode_number", args.max_episode))
      .collect();
    if (episodes.length > 0) {
      console.log("marking untracked episodes", episodes.length);
      for (const episode of episodes) {
        ctx.db.patch(episode._id, {
          status: "untracked episode",
        });
      }
    }else{
      console.log("no untracked episodes");
    }

  },
});
