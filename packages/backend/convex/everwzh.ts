import { query, action, mutation } from './_generated/server';
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
const { XMLParser } = require("fast-xml-parser");


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

export const episode = query({
    args: { id: v.id("episode") },

    handler: async (ctx, args) => {
        return await ctx.db.get(args.id)
    },
});

export const patchEpisodeTimeSpan = mutation({
    args: {
        id: v.id("episode"), timespan: v.object({
            name: v.string(),
            start: v.string(),
            end: v.string(),
        }),
    },

    handler: async (ctx, args) => {
        const episode = (await ctx.db.get(args.id));
        let timeSpans = episode?.timeSpans || []
        timeSpans.push(args.timespan)

        ctx.db.patch(args.id, { timeSpans: timeSpans })
    }
})

export const deleteEpisodeTimeSpan = mutation({
    args: { id: v.id("episode"), index: v.number(), },

    handler: async (ctx, args) => {
        const episode = (await ctx.db.get(args.id));
        let timeSpans = episode?.timeSpans || []
        console.log(timeSpans.length)
        timeSpans.splice(args.index, 1)
        console.log(timeSpans.length)
        ctx.db.patch(args.id, { timeSpans: timeSpans })
    }
})



export const patchPodcastTimeSpan = mutation({
    args: {
        id: v.id("podcast"), timespan: v.object({
            name: v.string(),
            start: v.string(),
            end: v.string(),
        }),
    },

    handler: async (ctx, args) => {
        const podcast = (await ctx.db.get(args.id));
        let timeSpans = podcast?.timeSpans || []
        timeSpans.push(args.timespan)

        ctx.db.patch(args.id, { timeSpans: timeSpans })
    }
})

export const deletePodcastTimeSpan = mutation({
    args: { id: v.id("podcast"), index: v.number(), },

    handler: async (ctx, args) => {
        const podcast = (await ctx.db.get(args.id));
        let timeSpans = podcast?.timeSpans || []
        console.log(timeSpans.length)
        timeSpans.splice(args.index, 1)
        console.log(timeSpans.length)
        ctx.db.patch(args.id, { timeSpans: timeSpans })
    }
})
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