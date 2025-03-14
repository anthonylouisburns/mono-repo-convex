import {
  query,
  mutation,
} from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { auth } from "./auth.js";


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

export const episodesWithOutYears = query({
  args: { podcast_id: v.id("podcast") },

  handler: async (ctx, args) => {
    const episodes = await ctx.db
      .query("episode")
      .withIndex("podcast_episode_number", (q) =>
        q.eq("podcast_id", args.podcast_id as Id<"podcast">),
      )
      .filter((q) => 
        q.or(
          q.eq(q.field("years"), undefined),
          q.eq(q.field("years"), [])
        )
      )
      .collect();
    return episodes;
  },
});

export const episodes = query({
  args: { podcast_id: v.id("podcast") },

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
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("playStatus", args);
    const { id, device_id, position, duration } = args;
    const user_id = await auth.getUserId(ctx);
    const updated_at = new Date().toISOString();

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
          duration: duration,
          updated_at: updated_at,
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
            duration: duration,
            updated_at: updated_at,
          });
          return;
        }
      }

      return await ctx.db.insert("play_status", {
        user_id: user_id,
        device_id: device_id,
        episode_id: id,
        position: position,
        duration: duration,
        updated_at: updated_at,
      });
    } else {
      const play_status = await ctx.db
        .query("play_status")
        .withIndex("device", (q) =>
          q.eq("device_id", device_id).eq("episode_id", id),
        )
        .unique();

      if (play_status !== null) {
        await ctx.db.patch(play_status._id, { position: position, duration: duration });
        return;
      }

      return await ctx.db.insert("play_status", {
        device_id: device_id,
        episode_id: id,
        position: position,
        duration: duration,
        updated_at: updated_at,
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
      console.log("getPlayStatus play_status", play_status)
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

export const getPlayStatusHistory = query({
  args: { device_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { device_id } = args;
    const user_id = await auth.getUserId(ctx);

    if (user_id) {
      const play_status = await ctx.db
        .query("play_status")
        .withIndex("updated_at", (q) => q.eq("user_id", user_id))
        .order("desc")
        .collect();
      console.log("getPlayStatus play_status", play_status)
      if (play_status) {
        return play_status;
      }
    }

    const play_status = await ctx.db
      .query("play_status")
      .withIndex("updated_at_device", (q) =>
        q.eq("device_id", device_id),
      )
      .order("desc")
      .collect();
    return play_status;
  },
});
//  get episodes with years order by first year in array
export const getEpisodesWithYears = query({
  args: {},
  handler: async (ctx) => {
    const episodes = await ctx.db
      .query("episode")
      .withIndex("years", (q) => q.gt("years", []))
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

export const getTimeline = query({
  handler: async (ctx) => {
    const timeline = await ctx.db.query("timeline").take(100);
    return timeline;
  },
});


