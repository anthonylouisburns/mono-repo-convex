import { internalAction, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { QueryCtx } from "./_generated/server";
const { XMLParser } = require("fast-xml-parser");
import { Id, Doc } from "./_generated/dataModel";
export const TODAYS_DATE = new Date().toISOString().split("T")[0];

export const loadAllEpisodes = internalAction({
  handler: async (ctx) => {
    const podcasts = await ctx.runQuery(api.everwhz.podcasts);
    for (const podcast of podcasts) {
      console.log("loading podcast", podcast.title, podcast._id);
      await ctx.runAction(internal.load_episodes.downloadRssBody, {
        id: podcast._id,
      });
      await ctx.scheduler.runAfter(0, api.load_episodes.parseXml, {
        pod_id: podcast._id,
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
    const response = await fetch(podcast.rss_url, {
      headers: {
        "If-None-Match": podcast.response_headers?.etag ?? "",
        "If-Modified-Since": podcast.response_headers?.last_modified ?? "",
      },
    });
    if (response.status == 304) {
      console.log("not modified");
      return;
    }
    if (!response.ok) {
      console.error("failed to fetch rss body");
      return;
    }
    const body = await response.blob();
    const headers = response.headers;
    const last_modified = headers.get("last-modified");
    const etag = headers.get("etag");
    const storageId: Id<"_storage"> = await ctx.storage.store(body);

    await ctx.runMutation(api.load_episodes.patchPodcastRss, {
      id: args.id,
      rss_body: storageId,
      etag: etag ?? undefined,
      last_modified: last_modified ?? undefined,
    });
  },
});

export const patchPodcastRss = mutation({
  args: { id: v.id("podcast"), rss_body: v.id("_storage"), etag: v.optional(v.string()), last_modified: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { id, rss_body, etag, last_modified } = args;
    const updateId = await ctx.db.patch(id,
      { rss_body: rss_body,
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
    if (podcast == null || podcast.rss_body == null) {
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
      rss_json: doc,
      date: TODAYS_DATE,
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
  args: { podcast_id: v.id("podcast"), rss_json: v.any(), date: v.string() },

  handler: async (ctx, args) => {
    console.log("patchPodcastRssJson start", args.podcast_id);
    const { podcast_id, rss_json } = args;
    const podcast = await ctx.runQuery(api.load_episodes.getPodcast, {
      id: podcast_id,
    });
    if (podcast == null) {
      console.error("podcast not found");
      return;
    }
    const items = rss_json.rss.channel.item;
    const max_episode = items.length;
    const podcast_title = rss_json.rss.channel.title;
    const podcast_description = rss_json.rss.channel.description;
    console.log("patching podcast", podcast_title, podcast._id);
    ctx.db.patch(podcast._id, { number_of_episodes: max_episode, title: podcast_title, description: podcast_description });
    for (const [index, item] of rss_json.rss.channel.item.entries()) {
      const e_n = Math.ceil(max_episode - index);

      const episode = await ctx.db
        .query("episode")
        .withIndex("podcast_episode_number", (q) =>
          q.eq("podcast_id", args.podcast_id).eq("episode_number", e_n),
        )
        .unique();

      // console.log("item", item.title);
      const title = item.title;
      if(!item.enclosure || item.enclosure["@_url"] == null) {
        console.log("mp3_link", item);
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
          chart: podcast.chart,
          rank: podcast.rank,
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
          chart: podcast.chart,
          rank: podcast.rank,
          updated_date: args.date
        });
      }
    }
    //   delete if extra episodes in db
    const episodes = await ctx.db
      .query("episode")
      .withIndex("podcast_episode_number", (q) =>
        q.eq("podcast_id", args.podcast_id).gt("episode_number", max_episode),
      )
      .collect();
    for (const episode of episodes) {
      ctx.db.delete(episode._id);
    }
    console.log("patchPodcastRssJson done", podcast_title, args.podcast_id);
  },
});

