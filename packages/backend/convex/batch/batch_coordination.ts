import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";
import { internalAction, QueryCtx, ActionCtx } from "../_generated/server";
const { XMLParser } = require("fast-xml-parser");

export const dailyInitialBatchJob = internalAction({
    args: {},
    handler: async (ctx) => {
        //[ ] delete old data, files over a week, job data over a week, prompts over a month
        const date = await ctx.runAction(internal.taddy.taddyBatchDownloadCharts);
        console.log("date", date);
        if (date) {
            // 1.downloads charts, updates and creates podcasts,
            await ctx.runMutation(internal.load_podcasts.loadChartPodcasts, {
                date: date,
            });
            await ctx.runMutation(internal.batch.utils.saveWork, {
                type: "load_chart_podcasts",
                summary: {
                    summary: "added or updated podcasts in podcast table from the downloaded taddy charts",
                    date: date,
                },
            });
        }
        // 2.downloads rss, 3.schedules read rss data
        await ctx.runAction(internal.load_episodes.scheduleDownloadRssForAllPodcasts);
        // await ctx.scheduler.runAfter(5, internal.geminiBatchPodcast.startGeminiBatchProcess);
        // 4.schedules create gemini prompts
        await ctx.runMutation(internal.batch.utils.createJob, {
            type: "schedule_create_gemini_prompts",
            instructions: {
                date: date,
            },
        });
        await ctx.runMutation(internal.batch.utils.saveWork, {
            type: "daily_batch_job",
            summary: {
                date: date,
                synopsis: "daily batch job 1.downloads charts, updates and creates podcasts, 2.downloads rss, 3.schedules read rss data, 4.schedules create gemini prompts",
            },
        });

    },
});

export const runJobs = internalAction({
    args: {},
    handler: async (ctx) => {
        const job_id = await ctx.runAction(internal.batch.batch_coordination.runJob);
        if (job_id) {
            await ctx.scheduler.runAfter(1, internal.batch.batch_coordination.runJobs);
        } else {
            console.log("no more jobs");
            await ctx.runMutation(internal.batch.utils.saveWork, {
                type: "run_job",
                summary: {
                    synopsis: "ran all jobs",
                },
            });
        }
    },
});

export const runJob = internalAction({
    args: {},
    handler: async (ctx): Promise<Id<"job"> | null> => {
        const job = await ctx.runQuery(internal.batch.utils.getNextJob);
        if (job) {
            console.log("job", job);
            await ctx.runAction(internal.batch.batch_coordination.runOneJob, { job_id: job._id });
            return job._id;
        } else {
            console.log("no job");
            return null;
        }
    },
});

export const runOneJob = internalAction({
    args: { job_id: v.id("job") },
    handler: async (ctx, args) => {
        const job = await ctx.runQuery(internal.batch.utils.getJobById, { job_id: args.job_id });
        if (job?.status != undefined) {
            console.log("job status", job?.status, "not running");
            return;
        }
        if (job) {
            console.log("job", job);
            if (job.type === "download_rss") {
                await downloadRss(ctx, job);
            }
            if (job.type === "process_rss") {
                await processRss(ctx, job);
            }
            if (job.type === "mark_episodes_as_missing") {
                console.log("marking episodes as missing");
            }
            if (job.type === "process_episodes") {
                console.log("processing episodes");
            }
            if (job.type === "schedule_create_ai_prompts") {
                console.log("scheduling create ai prompts");
            }
            if (job.type === "retrieve_ai_response") {
                console.log("retrieving ai response");
            }
            if (job.type === "update_episode_details_from_ai_response") {
                console.log("updating podcast details from rss");
            }
        }
    },
});

async function downloadRss(ctx: ActionCtx, job: Doc<"job">) {
    const storageId = await ctx.runAction(internal.load_episodes.downloadRssBody, { id: job.instructions.podcast_id });
    console.log("storageId", storageId);
    let status = "completed download rss";
    if (storageId) {
        await ctx.runMutation(internal.batch.utils.createJob, {
            type: "process_rss",
            instructions: {
                storage_id: storageId,
                podcast_id: job.instructions.podcast_id,
                last_job: job._id,
            },
        });
    } else {
        status = "skipped rss up to date";
    }

    await ctx.runMutation(internal.batch.utils.updateJob, {
        id: job._id,
        status: status,
    });
}

async function processRss(ctx: ActionCtx, job: Doc<"job">) {
    const PAGE_SIZE = 10;
    const storageId = job.instructions.storage_id;
    const podcastId = job.instructions.podcast_id;
    const lastJob = job.instructions.last_job;
    if (storageId) {
        const rss_blob = await ctx.storage.get(storageId);
        if (rss_blob) {
            const rss_text = await rss_blob.text();
            const options = {
                ignoreAttributes: false,
            };
            const parser = new XMLParser(options);
            let rss_json = parser.parse(rss_text);
            const items = rss_json.rss.channel.item;
            const max_episode = items.length;
            const podcast_title = rss_json.rss.channel.title;
            const podcast_description = rss_json.rss.channel.description;
            console.log("patching podcast", podcast_title, podcastId);
            await ctx.runMutation(internal.load_podcasts.updatePodcastDetailsFromRss, 
                { podcast_id: podcastId, number_of_episodes: max_episode, title: podcast_title, description: podcast_description });
             await ctx.runMutation(internal.batch.utils.saveWork, {
                type: "update_podcast_details_from_rss",
                summary: {
                    podcast_id: podcastId,
                    last_job: job._id,
                },
            });
            // [ ] find 
            let start_index = job.instructions.max_episode ? job.instructions.max_episode : 0;
            for (let i = start_index; i < max_episode; i += PAGE_SIZE) {
                const page_episodes = items.slice(i, i + PAGE_SIZE);
                await ctx.runMutation(internal.batch.utils.createJob, {
                    type: "process_episodes",
                    instructions: {
                        podcast_id: podcastId,
                        last_job: job._id,
                        offset: i,
                    },
                    data: {
                        page_episodes: page_episodes,
                    },
                });
            }
            await ctx.runMutation(internal.batch.utils.createJob, {
                type: "mark_episodes_as_missing",
                instructions: {
                    podcast_id: podcastId,
                    last_job: job._id,
                    max_episode: max_episode,
                },
            });
            await ctx.runMutation(internal.batch.utils.updateJob, {
                id: job._id,
                status: "completed schedule update episodes from rss",
            });
            
        }
    }
}