import { query, action, mutation } from './_generated/server';
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
const { XMLParser } = require("fast-xml-parser");

function isValidUrl(urlString: string): Boolean {
    var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator

    return !!urlPattern.test(urlString);
}

export const addPodcast = mutation({
    args: { name: v.string(), rss_url: v.string() },
    handler: async (ctx, args) => {
        if (args.rss_url.trim().length === 0 || args.name.trim().length === 0) {
            return { error: "empty arg" };
        }

        const existing = await ctx.db.query("podcast").withIndex("rss_url", q => q.eq("rss_url", args.rss_url)).unique();
        if (existing) {
            return { error: "existing" }
        }

        if (!isValidUrl(args.rss_url)) {
            return { error: "invalid url" }
        }

        const id = await ctx.db.insert("podcast", {
            name: args.name,
            rss_url: args.rss_url,
        });

        console.log("added podcast {id} {args.name}");
        await ctx.scheduler.runAfter(0, api.everwzh.downloadRssBody, {
            id: id,
            rss: args.rss_url,
        });

        return id
    },
});

export const episodes = query({
    args: { podcast_id: v.union(v.id("podcast"), v.null()) },

    handler: async (ctx, args) => {
        if (args.podcast_id) {
            const episodes = await ctx.db.query("episode")
                .withIndex("podcast_episode_number", q =>
                    q.eq("podcast_id", (args.podcast_id as Id<"podcast">)))
                .collect()
            return episodes
        } else {
            return []
        }
    },
});

export const episodeName = query({
    //TODO should not be optional
    args: { id: v.optional(v.id("episode")) },

    handler: async (ctx, args):Promise<{episode:Doc<"episode"> | null, podcast:Doc<"podcast"> | null}> => {
        if (args.id == null) {
            return { episode: null, podcast: null };
        }
        const episode = await ctx.db.get(args.id)
        if(!episode){
            return { episode: null, podcast: null }
        }
        const podcast = await ctx.db.get(episode.podcast_id)

        return { episode: episode, podcast: podcast }
    },
});

export const episode = query({
    //TODO should not be optional
    args: { id: v.optional(v.id("episode")) },

    handler: async (ctx, args) => {
        if (args.id == null) {
            return null;
        }
        return await ctx.db.get(args.id)
    },
});

export const deletePodcast = mutation({
    args: { id: v.id("podcast") },

    handler: async (ctx, args) => {
        const data = (await ctx.db.get(args.id));
        await ctx.db.delete(args.id);
        if (data?.rss_body != null) {
            await ctx.storage.delete(data?.rss_body);
        }
        const episodes = await ctx.db.query("episode")
            .withIndex("podcast_episode_number", (q) => q.eq("podcast_id", args.id))
            .collect();
        for (const e of episodes) {
            ctx.db.delete(e._id)
        }
        const spans = await ctx.db.query("timespan")
            .withIndex("podcast_episode", (q) => q.eq("podcast_id", args.id))
            .collect();
        for (const span of spans) {
            ctx.db.delete(span._id)
        }
    },
});

export const timeline = query({
    handler: async (ctx) => {
        const timeSpans = await ctx.db.query("timespan")
        .withIndex("start")
        .order("asc")
        .collect();

        const data: Array<{ span: Doc<"timespan">, podcast: Doc<"podcast"> | null, episode: Doc<"episode"> | null }> = []

        if (!timeSpans) {
            return data
        }

        for (const span of timeSpans) {
            const pod = await ctx.db.get(span.podcast_id)
            const episode = span.episode_id ? await ctx.db.get(span.episode_id) : null
            data.push({ span: span, podcast: pod, episode: episode })
        }

        return data
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
        ctx.db.insert("timespan", args)
    }
})

export const deleteTimeSpan = mutation({
    args: { id: v.id("timespan"), },

    handler: async (ctx, args) => {
        ctx.db.delete(args.id)
    },
})

export const timespans = query({
    args: {
        podcast_id: v.id("podcast"), episode_id: v.optional(v.id("episode")),
    },

    handler: async (ctx, args) => {
        if (args.episode_id) {
            const timeSpans = await ctx.db.query("timespan")
                .withIndex("podcast_episode", (q) => q.eq("podcast_id", args.podcast_id).eq("episode_id", args.episode_id))
                .collect()
            return timeSpans
        } else {
            const timeSpans = await ctx.db.query("timespan")
                .withIndex("podcast_episode", (q) => q.eq("podcast_id", args.podcast_id))
                .collect()
            return timeSpans
        }
    },
});


export const podcasts = query({
    handler: async (ctx) => {
        const podcasts = await ctx.db.query("podcast").collect();
        return podcasts
    },
});


export const updateRssData = mutation({
    // Action implementation.

    handler: async (ctx) => {

        console.log("updateRssData");
        const podcasts = await ctx.db.query("podcast").collect();

        for (var podcast of podcasts) {
            console.log("updating podcast {id} {args.name}");
            await ctx.scheduler.runAfter(0, api.everwzh.downloadRssBody, {
                id: podcast._id,
                rss: podcast.rss_url,
            });
        }
    }
});

export const downloadRssBody = action({
    args: {
        id: v.id("podcast"), rss: v.string(),
    },


    // Action implementation.
    handler: async (ctx, args) => {
        const response = await fetch(args.rss);
        const body = (await response.blob());

        const storageId: Id<"_storage"> = await ctx.storage.store(body);

        await ctx.runMutation(api.everwzh.patchPodcastRss, {
            id: args.id,
            rss_body: storageId,
        });
    },
});

export const patchPodcastRss = mutation({
    args: { id: v.id("podcast"), rss_body: v.id("_storage"), },
    handler: async (ctx, args) => {
        const { id, rss_body } = args;
        const updateId = await ctx.db.patch(id, { rss_body: rss_body });

        await ctx.scheduler.runAfter(0, api.everwzh.parseXml, {
            storageId: rss_body,
            pod_id: id,
        });
        return updateId;
    },
});

export const parseXml = action({
    args: {
        storageId: v.id("_storage"), pod_id: v.id("podcast"),
    },

    // Action implementation.
    handler: async (ctx, args) => {
        console.log("parseXml");
        const rss_blob = await ctx.storage.get(args.storageId);
        if (rss_blob == null) {
            console.error("doc empty")
            return
        }
        const rss_text: string = await rss_blob.text()

        // console.log("rss_text:" + rss_text.substring(0, 200) + "...")
        const options = {
            ignoreAttributes: false
        };
        const parser = new XMLParser(options);
        let doc = parser.parse(rss_text);
        console.log("doc parsed")
        // console.log("doc.rss.channel.item[0]:" + JSON.stringify(doc.rss.channel.item[0]))
        // console.log("keys:" + JSON.stringify(Object.keys(doc.rss)))
        // console.log("keys:" + JSON.stringify(Object.keys(doc.rss.channel)))
        // console.log("keys:" + JSON.stringify(Object.keys(doc.rss.channel.item.length)))

        console.log("done")
        await ctx.runMutation(api.everwzh.patchPodcastRssJson, {
            id: args.pod_id,
            rss_json: doc,
        });
    },
});

export const patchPodcastRssJson = mutation({
    args: { id: v.id("podcast"), rss_json: v.any(), },
    handler: async (ctx, args) => {
        const { id, rss_json } = args;
        const items = rss_json.rss.channel.item
        const max_episode = items.length

        ctx.db.patch(id, { number_of_episodes: max_episode })
        for (const [index, item] of rss_json.rss.channel.item.entries()) {
            const e_n = Math.ceil(max_episode - index)
            const episode = await ctx.db.query("episode")
                .withIndex("podcast_episode_number", (q) => q.eq("podcast_id", args.id).eq("episode_number", e_n))
                .unique()
            // patch or insert
            if (episode) {
                console.log("patch podcast_id:%s episode_number:%", args.id, e_n)
                ctx.db.patch(episode._id, {
                    podcast_id: args.id,
                    episode_number: Math.ceil(max_episode - index),
                    body: item
                })
            } else {
                console.log("insert podcast_id:%s episode_number:%", args.id, e_n)
                ctx.db.insert("episode", {
                    podcast_id: args.id,
                    episode_number: Math.ceil(max_episode - index),
                    body: item
                })
            }
        }
        //   delete if extra episodes in db
        const episodes = await ctx.db.query("episode")
            .withIndex("podcast_episode_number", (q) => q.eq("podcast_id", args.id).gte("episode_number", max_episode))
            .collect()
        for (const episode of episodes) {
            ctx.db.delete(episode._id)
        }
    }
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
                q.eq("tokenIdentifier", identity.tokenIdentifier).eq("issuer", identity.issuer),
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

export const playStatus = mutation({
    args: { id: v.id("episode"), position: v.number() },
    handler: async (ctx, args) => {
        const { id, position } = args;
        const identity = await ctx.auth.getUserIdentity();
        const tokenIdentifier = identity?.tokenIdentifier!;
        console.log(id, tokenIdentifier, position)

        const play_status = await ctx.db
            .query("play_status")
            .withIndex("token", (q) =>
                q.eq("tokenIdentifier", tokenIdentifier).eq("episode_id", id),
            )
            .unique();

        if (play_status !== null) {
            await ctx.db.patch(play_status._id, { position: position });
            return
        }

        return await ctx.db.insert("play_status", {
            tokenIdentifier: tokenIdentifier,
            episode_id: id,
            position: position,
        });
    },
});

export const getPlayStatus = query({
    args: { id: v.optional(v.id("episode")) },
    handler: async (ctx, args) => {
        const { id } = args;
        if (id == null) {
            return
        }
        // console.log("getPlayStatus id", id)
        const identity = await ctx.auth.getUserIdentity();
        const tokenIdentifier = identity?.tokenIdentifier!;
        // console.log("getPlayStatus tokenIdentifier", tokenIdentifier)

        const play_status = await ctx.db
            .query("play_status")
            .withIndex("token", (q) =>
                q.eq("tokenIdentifier", tokenIdentifier).eq("episode_id", id),
            )
            .unique();
        // console.log("getPlayStatus play_status", play_status)

        return play_status
    },
});
