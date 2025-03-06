import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { TableAggregate } from "@convex-dev/aggregate";
import { DataModel, Doc, Id } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { getPage, streamQuery } from "convex-helpers/server/pagination"

import schema from "@packages/backend/convex/schema";
import { paginationOptsValidator } from "convex/server";

export const timeline_aggregate = new TableAggregate<{
    Key: [string, string, number, number, number];
    DataModel: DataModel;
    TableName: "timeline";
}>(components.timeline, {
    sortKey: (doc) => [doc.start, doc.chart, doc.rank, doc.episode_number, doc._creationTime]
});


export const updateTimeline = internalAction({
    handler: async (ctx) => {
        const podcasts = await ctx.runQuery(internal.page_timeline.getNextPodcasts);
        await Promise.all(podcasts.map(async (podcast) => {
            console.log("updateTimelinePodcast", podcast._id, podcast.title);
            await ctx.runMutation(internal.page_timeline.updateTimelinePodcast, {
                podcast_id: podcast._id,
            });
        }));
    },
});
export const getNextPodcasts = internalQuery({
    args: {},
    handler: async (ctx) => {
        console.log("getNextPodcast");
        const podcasts = await ctx.db.query("podcast")
            .filter((q) => q.neq(q.field("chart"), undefined))
            .collect();

        return podcasts;
    }
});

export const updateTimelinePodcast = internalMutation({
    args: {
        podcast_id: v.id("podcast"),
    },

    handler: async (ctx, args) => {
        const { podcast_id } = args
        let totalCount = 0;
        let totalWithYears = 0;
        let totalWithGeonames = 0;
        let totalWithChart = 0;
        let totalWithRank = 0;
        let totalWithEpisodeNumber = 0;
        let totalInserted = 0;
        const episodes = await ctx.db
            .query("episode")
            .withIndex("podcast_episode_number", (q) => q.eq("podcast_id", podcast_id))
            .collect();
        for (const episode of episodes) {
            const timeline = await ctx.db.query("timeline")
                .withIndex("podcast_episode", (q) => q.eq("podcast_id", episode.podcast_id).eq("episode_id", episode._id))
                .unique();
            if (timeline) {
                await deleteTimeline(ctx, timeline._id);
            }
            if (episode.years && episode.years.length > 0) {
                totalWithYears++;
            }
            if (episode.geonames && episode.geonames.length > 0) {
                totalWithGeonames++;
            }
            if (episode.chart) {
                totalWithChart++;
            }
            if (episode.rank) {
                totalWithRank++;
            }
            if (episode.episode_number) {
                totalWithEpisodeNumber++;
            }
            if (episode.years && episode.years.length > 0
                && episode.chart && episode.rank && episode.episode_number) {
                totalInserted++;
                await insertTimeline(ctx, {
                    podcast_id: episode.podcast_id,
                    episode_id: episode._id,
                    start: episode.years[0],
                    end: episode.years[episode.years.length - 1],
                    geoname: episode.geonames?.[0] ?? "",
                    chart: episode.chart,
                    rank: episode.rank,
                    episode_number: episode.episode_number,
                });
            }
            totalCount++;
        }
        console.log("totalCount", totalCount, "totalInserted", totalInserted, "totalWithYears", totalWithYears, "totalWithGeonames", totalWithGeonames, "totalWithChart", totalWithChart, "totalWithRank", totalWithRank, "totalWithEpisodeNumber", totalWithEpisodeNumber);
        return { totalCount, totalWithYears, totalWithGeonames, totalWithChart, totalWithRank, totalWithEpisodeNumber, totalInserted };
    },
});


export async function insertTimeline(ctx: MutationCtx, value: any) {
    // When you insert into the table, call `aggregate.insert`
    const id = await ctx.db.insert("timeline", value);
    const doc = await ctx.db.get(id);
    await timeline_aggregate.insert(ctx, doc!);
}

export async function replaceTimeline(ctx: MutationCtx, id: Id<"timeline">, value: any) {
    // If you update a document, use `aggregate.replace`
    const oldDoc = await ctx.db.get(id);
    await ctx.db.patch(id, value);
    const newDoc = await ctx.db.get(id);
    await timeline_aggregate.replace(ctx, oldDoc!, newDoc!);
}


export async function deleteTimeline(ctx: MutationCtx, id: Id<"timeline">) {
    // And if you delete a document, use `aggregate.delete`
    const oldDoc = await ctx.db.get(id);
    await ctx.db.delete(id);
    await timeline_aggregate.delete(ctx, oldDoc!);
}


// export async function getSampledRecords(ctx: QueryCtx,
export const getSampledRecords = query({
    args: {
        paginate: paginationOptsValidator
    },
    handler: async (ctx, args) => {
        const records = await ctx.db
            .query("timeline")
            .withIndex("start_index")
            .paginate(args.paginate);
        const len = records.page.length;
        const sample: Array<Doc<"timeline">> = [records.page[0], records.page[len - 1]]
        return {
            page: sample,
            continueCursor: records.continueCursor,
            isDone: records.isDone
        };
    },
});

export const test = query({
    handler: async (ctx) => {
        const first = await ctx.db.query("test_table")
            .withIndex("i_1")
            .first();
        if (first) {
            const count = await ctx.db.query("test_table")
                .withIndex("i_1", (q) => q.eq("city", first.city)
                    .eq("age", first.age)
                    .eq("name", first.name)
                    .gte("_creationTime", first._creationTime))
                .collect();
            return count.length;
        }
        return 0;
    },
});

export const pageOfTimeline = query({
    args: {
        page: v.number(),
        pageSize: v.number()
    },
    handler: async (ctx, { page, pageSize }) => {
        const count = await timeline_aggregate.count(ctx);
        console.log("count", count);
        const { key } = await timeline_aggregate.at(ctx, (page - 1) * pageSize);
        console.log(key);
        let pageData = getPage(ctx, {
            table: "timeline",
            index: "start_index",
            startIndexKey: key,
            targetMaxRows: pageSize,
            schema: schema
        });
        return (await pageData).page;
    },
});

export const streamPageOfTimeline = query({
    args: {
        page: v.number(),
        pageSize: v.number()
    },
    handler: async (ctx, { page, pageSize }) => {
        console.log("processLargeDataset")
        const { key } = await timeline_aggregate.at(ctx, (page - 1) * pageSize);
        let count = 0;
        const stream = await streamQuery(ctx, {
            table: "timeline",
            index: "start_index",
            order: "asc",
            startIndexKey: key,
            schema: schema, // Your schema definition
        }
        )
        const response: Array<Doc<"timeline">> = []
        // console.log("key", key)
        for await (const [doc] of stream) {
            if (count > pageSize) break;
            count++;
            response.push(doc)
        }
        console.log("response length", response.length)
        return response;
    },
});

export const numberOfPages = query({
    args: {
        numberOfPages: v.number()
    },
    handler: async (ctx, { numberOfPages }) => {
        const count = await timeline_aggregate.count(ctx);
        const pageSize = Math.floor(count / numberOfPages);

        console.log("count", count);
        let offset = 0
        const bookmarks: Array<Doc<"timeline">> = []
        while (offset < count) {
            const { key } = await timeline_aggregate.at(ctx, offset);
            const timeline = await getBookmarkedTimeline(ctx, key);
            if (timeline) {
                bookmarks.push(timeline);
            }
            offset += pageSize;
        }
        const { key } = await timeline_aggregate.at(ctx, count - 1);
        const timeline = await getBookmarkedTimeline(ctx, key);
        if (timeline) {
            bookmarks.push(timeline);
        }
        console.log("bookmarks size:", bookmarks.length, "page size:", pageSize);
        return { bookmarks: bookmarks, pageSize: pageSize, numberOfPages: bookmarks.length };
    },
});

async function getBookmarkedTimeline(ctx: QueryCtx, key: [string, string, number, number, number]): Promise<Doc<"timeline"> | null> {
    const timeline = await ctx.db.query("timeline")
        .withIndex("start_index", (q) => q.eq("start", key[0])
            .eq("chart", key[1])
            .eq("rank", key[2])
            .eq("episode_number", key[3]))
        .first();
    return timeline ?? null;
}


export const getBookmarksAll = query({
    args: {
        pageSize: v.number()
    },
    handler: async (ctx, { pageSize }) => {
        const count = await timeline_aggregate.count(ctx);
        return await getBookmarksFromOffset(ctx, pageSize, 0, count);
    },
});

export const getBookmarks = query({
    args: {
        pageSize: v.number(),
        offset: v.number(),
        count: v.number()
    },
    handler: async (ctx, { pageSize, count, offset }) => {
        return await getBookmarksFromOffset(ctx, pageSize, offset, count);
    },
});

export const indexOfEpisode = query({
    args: {
        episode_id: v.id("episode")
    },
    handler: async (ctx, { episode_id }) => {
        const episode = await ctx.db.get(episode_id);
        if (episode) {
            const timeline = await ctx.db.query("timeline")
                .withIndex("podcast_episode", (q) => q.eq("podcast_id", episode.podcast_id).eq("episode_id", episode_id))
                .first();
            if (timeline) {
                return await timeline_aggregate.indexOf(ctx, [timeline.start, timeline.chart, timeline.rank, timeline.episode_number, timeline._creationTime]);
            }
        }
        return null;
    }
})

export async function getBookmarksFromOffset(ctx: QueryCtx, pageSize: number, offset: number, count: number) {
    console.log("pageSize", pageSize, "offset", offset, "count", count);
    const bookmarks: Array<{ timeline: Doc<"timeline">, offset: number }> = []
    let i = offset;
    while (i < offset + count) {
        const { key } = await timeline_aggregate.at(ctx, i);
        const timeline = await getBookmarkedTimeline(ctx, key);
        if (timeline) {
            bookmarks.push({ timeline: timeline, offset: i });
        }
        i += pageSize;
    }
    const { key } = await timeline_aggregate.at(ctx, offset + count - 1);
    const timeline = await getBookmarkedTimeline(ctx, key);
    if (timeline) {
        bookmarks.push({ timeline: timeline, offset: offset + count - 1 });
    }
    console.log("bookmarks size:", bookmarks.length, "page size:", pageSize);
    return { bookmarks: bookmarks, pageSize: pageSize, numberOfPages: bookmarks.length };
}