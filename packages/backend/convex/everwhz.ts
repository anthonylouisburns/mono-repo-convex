import {
  query,
  action,
  mutation,
  internalMutation,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
const { XMLParser } = require("fast-xml-parser");
import { auth } from "./auth.js";

function isValidUrl(urlString: string): Boolean {
  var urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // validate protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
      "(\\#[-a-z\\d_]*)?$",
    "i",
  ); // validate fragment locator

  return !!urlPattern.test(urlString);
}

export const currentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No Identity Found");
    }

    const user = await ctx.db
      .query("user")
      .withIndex("tokenIdentifier", (q) =>
        q
          .eq("tokenIdentifier", identity.tokenIdentifier)
          .eq("issuer", identity.issuer),
      )
      .unique();

    if (user == null) {
      throw new Error("No User Found");
    }

    return user;
  },
});

export const addPendingPodcast = mutation({
  args: { rss_url: v.string() },
  handler: async (ctx, args) => {
    const user_id = await auth.getUserId(ctx);
    if (!user_id) {
      throw new Error("No User Found");
    }
    await addPendingPodcastInternal(ctx, {
      rss_url: args.rss_url,
      user_id: user_id,
    });
  },
});

export async function addPendingPodcastInternal(
  ctx: MutationCtx,
  args: { rss_url: string; user_id: string },
) {
  console.log("addPendingPodcastInternal", args);
  if (args.rss_url.trim().length === 0) {
    return { error: "empty arg" };
  }

  //TODO and description
  const existing = await ctx.db
    .query("podcast")
    .withIndex("rss_url", (q) => q.eq("rss_url", args.rss_url))
    .unique();
  if (existing) {
    return { status: "existing" };
  }

  if (!isValidUrl(args.rss_url)) {
    return { error: "invalid url" };
  }

  const id = await ctx.db.insert("pending_podcast", {
    rss_url: args.rss_url,
    user_id: args.user_id as Id<"users">,
  });

  console.log("added pending podcast {id} {args.name}");

  await ctx.scheduler.runAfter(0, api.everwhz.downloadPendingRssBody, {
    pending_id: id,
    rss: args.rss_url,
  });

  return id;
}

// export const updatePodcastDescription = mutation({
//     args: { id: v.id("podcast"), rss: v.string() },
//     handler: async (ctx, args) => {
//         const response = await fetch(args.rss);
//         const body = (await response.blob());

//         await ctx.db.patch(args.id, { description: body. })
//     },
// });

export const downloadPendingRssBody = action({
  args: {
    pending_id: v.id("pending_podcast"),
    rss: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    const response = await fetch(args.rss);
    const body = await response.blob();

    const storageId: Id<"_storage"> = await ctx.storage.store(body);

    await ctx.runMutation(api.everwhz.insertPodcast, {
      rss_body: storageId,
      rss_url: args.rss,
    });
  },
});

export const insertPodcast = mutation({
  args: { rss_body: v.id("_storage"), rss_url: v.string() },
  handler: async (ctx, args) => {
    if (args.rss_url.trim().length === 0) {
      return { error: "empty arg" };
    }

    const existing = await ctx.db
      .query("podcast")
      .withIndex("rss_url", (q) => q.eq("rss_url", args.rss_url))
      .unique();
    if (existing) {
      return { error: "existing" };
    }

    if (!isValidUrl(args.rss_url)) {
      return { error: "invalid url" };
    }

    const id = await ctx.db.insert("podcast", {
      rss_url: args.rss_url,
      rss_body: args.rss_body,
    });

    console.log("added podcast {id} {args.name}");

    await ctx.scheduler.runAfter(0, api.everwhz.parseXml, {
      storageId: args.rss_body,
      pod_id: id,
    });

    //TODO: maybe turn back on - current returning empty array
    // await ctx.scheduler.runAfter(0, internal.everwhz_ai.getSuggestions);
    return id;
  },
});

// TODO delete
export const addPodcast = mutation({
  args: { name: v.string(), rss_url: v.string() },
  handler: async (ctx, args) => {
    if (args.rss_url.trim().length === 0 || args.name.trim().length === 0) {
      return { error: "empty arg" };
    }

    const existing = await ctx.db
      .query("podcast")
      .withIndex("rss_url", (q) => q.eq("rss_url", args.rss_url))
      .unique();
    if (existing) {
      return { error: "existing" };
    }

    if (!isValidUrl(args.rss_url)) {
      return { error: "invalid url" };
    }

    const id = await ctx.db.insert("podcast", {
      name: args.name,
      rss_url: args.rss_url,
    });

    console.log("added podcast {id} {args.name}");
    await ctx.scheduler.runAfter(0, api.everwhz.downloadRssBody, {
      id: id,
      rss: args.rss_url,
    });

    return id;
  },
});

export const episodes = query({
  args: { podcast_id: v.union(v.id("podcast"), v.null()) },

  handler: async (ctx, args) => {
    const episodes = await ctx.db
      .query("episode")
      .withIndex("podcast_episode_number", (q) =>
        q.eq("podcast_id", args.podcast_id as Id<"podcast">),
      )
      .collect();
    return episodes;
  },
});

export const episodeName = query({
  //TODO should not be optional!!
  args: { id: v.optional(v.id("episode")) },

  handler: async (
    ctx,
    args,
  ): Promise<{
    episode: Doc<"episode"> | null;
    podcast: Doc<"podcast"> | null;
  }> => {
    if (args.id == null) {
      return { episode: null, podcast: null };
    }
    const episode = await ctx.db.get(args.id);
    if (!episode) {
      return { episode: null, podcast: null };
    }
    const podcast = await ctx.db.get(episode.podcast_id);

    return { episode: episode, podcast: podcast };
  },
});

export const episode = query({
  //TODO should not be optional
  args: { id: v.optional(v.id("episode")) },

  handler: async (ctx, args) => {
    if (args.id == null) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const deletePodcast = mutation({
  args: { id: v.id("podcast") },

  handler: async (ctx, args) => {
    const data = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    if (data?.rss_body != null) {
      await ctx.storage.delete(data?.rss_body);
    }
    const episodes = await ctx.db
      .query("episode")
      .withIndex("podcast_episode_number", (q) => q.eq("podcast_id", args.id))
      .collect();
    for (const e of episodes) {
      ctx.db.delete(e._id);
    }
    const spans = await ctx.db
      .query("timespan")
      .withIndex("podcast_episode", (q) => q.eq("podcast_id", args.id))
      .collect();
    for (const span of spans) {
      ctx.db.delete(span._id);
    }
  },
});

export const timeline = query({
  handler: async (ctx) => {
    const timeSpans = await ctx.db
      .query("timespan")
      .withIndex("start")
      .order("asc")
      .collect();

    const data: Array<{
      span: Doc<"timespan">;
      podcast: Doc<"podcast"> | null;
      episode: Doc<"episode"> | null;
    }> = [];

    if (!timeSpans) {
      return data;
    }

    for (const span of timeSpans) {
      const pod = await ctx.db.get(span.podcast_id);
      const episode = span.episode_id
        ? await ctx.db.get(span.episode_id)
        : null;
      data.push({ span: span, podcast: pod, episode: episode });
    }

    return data;
  },
});

export const addTimeSpan = mutation({
  args: {
    podcast_id: v.id("podcast"),
    episode_id: v.optional(v.id("episode")),
    name: v.string(),
    start: v.string(),
    end: v.string(),
  },

  handler: async (ctx, args) => {
    ctx.db.insert("timespan", args);
  },
});

export const deleteTimeSpan = mutation({
  args: { id: v.id("timespan") },

  handler: async (ctx, args) => {
    ctx.db.delete(args.id);
  },
});

export const timespans = query({
  args: {
    podcast_id: v.id("podcast"),
    episode_id: v.optional(v.id("episode")),
  },

  handler: async (ctx, args) => {
    if (args.episode_id) {
      const timeSpans = await ctx.db
        .query("timespan")
        .withIndex("podcast_episode", (q) =>
          q.eq("podcast_id", args.podcast_id).eq("episode_id", args.episode_id),
        )
        .collect();
      return timeSpans;
    } else {
      const timeSpans = await ctx.db
        .query("timespan")
        .withIndex("podcast_episode", (q) =>
          q.eq("podcast_id", args.podcast_id),
        )
        .collect();
      return timeSpans;
    }
  },
});

export const podcasts = query({
  handler: async (ctx) => {
    const podcasts = await ctx.db.query("podcast").collect();
    return podcasts;
  },
});

export const podcastTitle = query({
  args: { id: v.id("podcast") },
  handler: async (ctx, args) => {
    const podcast = await ctx.db.get(args.id);
    return { title: podcast?.title, description: podcast?.description };
  },
});

export const updatePodcastRssData = mutation({
  args: {
    id: v.id("podcast"),
  },

  handler: async (ctx, args) => {
    const id = args.id;
    console.log("updateRssData");
    const podcast = await ctx.db.get(id);

    if (podcast) {
      console.log("updating podcast {id}");
      await ctx.scheduler.runAfter(0, api.everwhz.downloadRssBody, {
        id: podcast._id,
        rss: podcast.rss_url,
      });
    }
  },
});

//TODO delete
export const updateRssData = mutation({
  handler: async (ctx) => {
    console.log("updateRssData");
    const podcasts = await ctx.db.query("podcast").collect();

    for (var podcast of podcasts) {
      console.log("updating podcast {id} {args.name}");
      await ctx.scheduler.runAfter(0, api.everwhz.downloadRssBody, {
        id: podcast._id,
        rss: podcast.rss_url,
      });
    }
  },
});

export const downloadRssBody = action({
  args: {
    id: v.id("podcast"),
    rss: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    const response = await fetch(args.rss);
    const body = await response.blob();

    const storageId: Id<"_storage"> = await ctx.storage.store(body);

    await ctx.runMutation(api.everwhz.patchPodcastRss, {
      id: args.id,
      rss_body: storageId,
    });
  },
});

export const patchPodcastRss = mutation({
  args: { id: v.id("podcast"), rss_body: v.id("_storage") },
  handler: async (ctx, args) => {
    const { id, rss_body } = args;
    const updateId = await ctx.db.patch(id, { rss_body: rss_body });

    await ctx.scheduler.runAfter(0, api.everwhz.parseXml, {
      storageId: rss_body,
      pod_id: id,
    });
    return updateId;
  },
});

export const parseXml = action({
  args: {
    storageId: v.id("_storage"),
    pod_id: v.id("podcast"),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    console.log("parseXml");
    const rss_blob = await ctx.storage.get(args.storageId);
    if (rss_blob == null) {
      console.error("doc empty");
      return;
    }
    const rss_text: string = await rss_blob.text();

    // console.log("rss_text:" + rss_text.substring(0, 200) + "...")
    const options = {
      ignoreAttributes: false,
    };
    const parser = new XMLParser(options);
    let doc = parser.parse(rss_text);
    console.log("doc parsed");

    console.log("done");
    await ctx.runMutation(api.everwhz.patchPodcastRssJson, {
      id: args.pod_id,
      rss_json: doc,
    });
  },
});

export const patchPodcastRssJson = mutation({
  args: { id: v.id("podcast"), rss_json: v.any() },
  handler: async (ctx, args) => {
    const { id, rss_json } = args;
    const items = rss_json.rss.channel.item;
    const max_episode = items.length;
    const title = rss_json.rss.channel.title;

    ctx.db.patch(id, { number_of_episodes: max_episode, title: title });
    for (const [index, item] of rss_json.rss.channel.item.entries()) {
      const e_n = Math.ceil(max_episode - index);
      const episode = await ctx.db
        .query("episode")
        .withIndex("podcast_episode_number", (q) =>
          q.eq("podcast_id", args.id).eq("episode_number", e_n),
        )
        .unique();

      console.log("item", item.title);
      const title = item.title;

      if (episode) {
        console.log(
          "patch podcast_id:%s episode_number:% title:%",
          args.id,
          e_n,
        );
        ctx.db.patch(episode._id, {
          podcast_id: args.id,
          episode_number: Math.ceil(max_episode - index),
          body: item,
          title: title,
        });
      } else {
        console.log(
          "insert podcast_id:%s episode_number:% title:%",
          args.id,
          e_n,
          title,
        );
        ctx.db.insert("episode", {
          podcast_id: args.id,
          episode_number: Math.ceil(max_episode - index),
          body: item,
          title: title,
        });
      }
    }
    //   delete if extra episodes in db
    const episodes = await ctx.db
      .query("episode")
      .withIndex("podcast_episode_number", (q) =>
        q.eq("podcast_id", args.id).gt("episode_number", max_episode),
      )
      .collect();
    for (const episode of episodes) {
      ctx.db.delete(episode._id);
    }
  },
});

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    const user = await ctx.db
      .query("user")
      .withIndex("tokenIdentifier", (q) =>
        q
          .eq("tokenIdentifier", identity.tokenIdentifier)
          .eq("issuer", identity.issuer),
      )
      .unique();

    if (user !== null) {
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }
      if (user.email !== identity.email) {
        await ctx.db.patch(user._id, { email: identity.email });
      }
      return user._id;
    }

    return await ctx.db.insert("user", {
      name: identity.name!,
      tokenIdentifier: identity.tokenIdentifier,
      issuer: identity.issuer,
      email: identity.email!,
    });
  },
});

// [ ] simplify this function
export const playStatus = mutation({
  args: {
    id: v.id("episode"),
    device_id: v.optional(v.string()),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, device_id, position } = args;
    const user_id = await auth.getUserId(ctx);

    console.log("playStatus", id, user_id, position);

    if (user_id) {
      const play_status = await ctx.db
        .query("play_status")
        .withIndex("user", (q) => q.eq("user_id", user_id).eq("episode_id", id))
        .unique();

      if (play_status !== null) {
        await ctx.db.patch(play_status._id, {
          position: position,
          device_id: device_id,
        });
        return;
      }
      if (play_status == null) {
        const play_status = await ctx.db
          .query("play_status")
          .withIndex("device", (q) =>
            q.eq("device_id", device_id).eq("episode_id", id),
          )
          .unique();
        if (play_status !== null) {
          await ctx.db.patch(play_status._id, {
            position: position,
            user_id: user_id,
          });
          return;
        }
      }

      return await ctx.db.insert("play_status", {
        user_id: user_id,
        device_id: device_id,
        episode_id: id,
        position: position,
      });
    } else {
      const play_status = await ctx.db
        .query("play_status")
        .withIndex("device", (q) =>
          q.eq("device_id", device_id).eq("episode_id", id),
        )
        .unique();

      if (play_status !== null) {
        await ctx.db.patch(play_status._id, { position: position });
        return;
      }

      return await ctx.db.insert("play_status", {
        device_id: device_id,
        episode_id: id,
        position: position,
      });
    }
  },
});

export const getPlayStatus = query({
  args: { id: v.optional(v.id("episode")), device_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { id, device_id } = args;
    if (id == null) {
      return;
    }
    // console.log("getPlayStatus id", id)
    const user_id = await auth.getUserId(ctx);

    if (user_id) {
      const play_status = await ctx.db
        .query("play_status")
        .withIndex("user", (q) => q.eq("user_id", user_id).eq("episode_id", id))
        .unique();
      // console.log("getPlayStatus play_status", play_status)
      if (play_status) {
        return play_status;
      }
    }

    const play_status = await ctx.db
      .query("play_status")
      .withIndex("device", (q) =>
        q.eq("device_id", device_id).eq("episode_id", id),
      )
      .unique();
    return play_status;
  },
});

//  get episodes with years order by first year in array
export const getEpisodesWithYears = query({
  args: {},
  handler: async (ctx) => {
    const episodes = await ctx.db
      .query("episode")
      .withIndex("years", (q) => q.gt("years", undefined))
      .collect();

    const sortedFilteredEpisodes = episodes
      .filter((e) => e.years && e.years.length > 0)
      .sort((a, b) => {
        const yearA = a.years?.[0] ?? "";
        const yearB = b.years?.[0] ?? "";
        return yearA.localeCompare(yearB);
      });
    return sortedFilteredEpisodes;
  },
});
