import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";
import { internalAction, ActionCtx, mutation } from "../_generated/server";
import { migrations } from "../migration";
const { XMLParser } = require("fast-xml-parser");
const BATCH_DATE = new Date().toISOString().split("T")[0];
//[ ] add column to job success

export const echo = internalAction({
    args: {},
    handler: async () => {
        console.log("test cron does nothing");
    },
});

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
        // [ ] move to seperate batch, maybe run multiple times a day but not when doing the main batch
        // const job_id = await ctx.runAction(internal.batch.batch_coordination.scheduleCreateAiPromptsForEpisodes);
        // if (job_id) {
        //     await ctx.runAction(internal.batch.batch_coordination.runJob, { job_id: job_id});
        // }
        // 2.downloads rss, 3.schedules read rss data
        await ctx.runAction(internal.batch.batch_coordination.scheduleDownloadRssForAllPodcasts);

        await ctx.runMutation(internal.batch.utils.saveWork, {
            type: "daily_batch_job",
            summary: {
                date: date,
                synopsis: "daily batch job 1.downloads charts, updates and creates podcasts, 2.downloads rss, 3.schedules read rss data, 4.schedules create gemini prompts",
            },
        });
        await ctx.scheduler.runAfter(1, internal.batch.batch_coordination.runJobs, {});
    },
});

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

export const scheduleCreateAiPromptsForEpisodes = internalAction({
    handler: async (ctx) => {
        await ctx.runMutation(internal.batch.utils.createJob, {
            type: "schedule_create_ai_prompts",
        });
    },
});

export const runJobs = internalAction({
    args: { max_jobs: v.optional(v.number()), jobs_run: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const job_id = await ctx.runAction(internal.batch.batch_coordination.runJob);
        let jobs_run = args.jobs_run ? args.jobs_run : 0;
        if (args.max_jobs && jobs_run >= args.max_jobs) {
            console.log("max jobs run", args.max_jobs);
            return;
        }
        if (job_id) {
            await ctx.scheduler.runAfter(100, internal.batch.batch_coordination.runJobs, { max_jobs: args.max_jobs, jobs_run: jobs_run + 1 });
        } else {
            console.log("no more jobs");
            await ctx.runMutation(internal.batch.utils.saveWork, {
                type: "run_job",
                summary: {
                    synopsis: "ran all jobs",
                },
            });
            // [ ] confirm timeline updated
            // const job_id = await ctx.runMutation(internal.batch.utils.createJob, {
            //     type: "update_timeline",
            // });
            // if (job_id) {
            //     await ctx.scheduler.runAfter(1, internal.batch.batch_coordination.runJob, { job_id: job_id });
            // }
        }
    },
});

export const runJob = internalAction({
    args: {},
    handler: async (ctx): Promise<Id<"job"> | null> => {
        const job = await ctx.runQuery(internal.batch.utils.getNextJob);

        if (job) {
            // console.log("job", job.type, job._id);
            await ctx.runAction(internal.batch.batch_coordination.runOneJob, { job_id: job._id });
            return job._id;
        } else {
            console.log("no job");
            return null;
        }
    },
});

export const reRunJob = internalAction({
    args: { job_id: v.id("job") },
    handler: async (ctx, args) => {
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: args.job_id,
            status: undefined,
        });
        await ctx.runAction(internal.batch.batch_coordination.runOneJob, { job_id: args.job_id });
    },
});

export const runOneJob = internalAction({
    args: { job_id: v.id("job") },
    handler: async (ctx, args) => {
        const job = await ctx.runQuery(internal.batch.utils.getJobById, { job_id: args.job_id });
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: args.job_id,
            status: "running",
            error: "running",
        });
        if (job?.status != undefined) {
            console.log("job status", job?.status, "not running");
            return;
        }
        try {
            if (job) {
                console.log("job", job.type, job._id);
                if (job.type === "download_rss") {
                    await downloadRss(ctx, job); // [ ] is it setting the max episode already done
                }
                if (job.type === "process_rss") {
                    await processRss(ctx, job); 
                }
                if (job.type === "update_episodes_from_rss") {//process_episodes
                    await updateEpisodesFromRss(ctx, job);
                }
                if (job.type === "mark_episodes_as_missing") {
                    await markEpisodesAsMissing(ctx, job);
                }
                if (job.type === "schedule_create_ai_prompts") {
                    await scheduleCreateAiPrompts(ctx, job);
                }
                if (job.type === "create_ai_prompts") {
                    await createAiPrompts(ctx, job);
                }
                if (job.type === "retrieve_ai_response") {
                    await retrieveAiResponse(ctx, job);
                }
                if (job.type === "update_episode_details_from_ai_response") {
                    await processPromptResponse(ctx, job);
                }

                // not part of batch
                if (job.type === "update_timeline") {
                    await updateTimeline(ctx, job);
                }
                if (job.type === "update_timeline_confirm") {
                    await updateTimelineConfirm(ctx, job);
                }
            }
        } catch (error: any) {
            console.log("error", error);
            await ctx.runMutation(internal.batch.utils.updateJob, {
                id: args.job_id,
                status: "error",
                error: error.message,
            });
        }
    },
});


async function updateTimelineConfirm(ctx: ActionCtx, job: Doc<"job">) {
    console.log("updating timeline confirm");
    const status = await migrations.getStatus(ctx, { migrations: [internal.migration.createTimeline] })
    console.log("status", status);
    if (status[0].isDone) {
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: job._id,
            status: "update timeline completed",
            error: undefined,
        });
    }
}

async function updateTimeline(ctx: ActionCtx, job: Doc<"job">) {
    console.log("updating timeline");

    await migrations.runOne(ctx, internal.migration.createTimeline, { cursor: null });

    await ctx.runMutation(internal.batch.utils.updateJob, {
        id: job._id,
        status: "update timeline initiated",
        error: undefined,
    });

    await ctx.runMutation(internal.batch.utils.createJob, {
        type: "update_timeline_confirm",
        instructions: {
            job_id: job._id,
        },
    });
}

async function processPromptResponse(ctx: ActionCtx, job: Doc<"job">) {
    console.log("processing prompt response");
    const prompt_id = job.instructions.prompt_id;
    const success = await ctx.runMutation(internal.aiBatchPodcast.processPromptResponse, { prompt_id: prompt_id });
    if (success) {
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: job._id,
            status: "completed process prompt response",
            error: undefined,
        });
    } else {
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: job._id,
            status: "completed process prompt response error",
            error: "error processing prompt response",
        });
    }
}

async function retrieveAiResponse(ctx: ActionCtx, job: Doc<"job">) {
    console.log("retrieving ai response");
    const prompt_id = job.instructions.prompt_id;

    const success = await ctx.runAction(internal.aiBatchPodcast.postOnePrompt, { prompt_id: prompt_id, batch: BATCH_DATE });
    if (success) {
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: job._id,
            status: "completed retrieve ai response",
            error: undefined,
        });
    }
    await ctx.runMutation(internal.batch.utils.createJob, {
        type: "update_episode_details_from_ai_response",
        instructions: {
            prompt_id: prompt_id,
            job_id: job._id,
        },
    });
}

async function createAiPrompts(ctx: ActionCtx, job: Doc<"job">) {
    console.log("creating ai prompts");
    const prompt_id = await ctx.runMutation(internal.aiBatchPodcast.createAiPromptMutation, {
        podcast_id: job.instructions.podcast_id,
        episode_ids: job.instructions.episode_ids,
        batch: BATCH_DATE,
    });
    if (prompt_id) {
        console.log("prompt_id", prompt_id);
        await ctx.runMutation(internal.batch.utils.createJob, {
            type: "retrieve_ai_response",
            instructions: {
                prompt_id: prompt_id,
                job_id: job._id,
            },
        });
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: job._id,
            status: "completed create ai prompts",
            error: undefined,
        });
    } else {
        console.log("no prompt id");
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: job._id,
            status: "completed create ai prompts error",
            error: "no prompt id",
        });
    }
}

async function scheduleCreateAiPrompts(ctx: ActionCtx, job: Doc<"job">) {
    console.log("scheduling create ai prompts");
    const podcast_id = job.instructions.podcast_id;
    const page_size = job.instructions.page_size;
    const last_job = job._id;
    if (!page_size || !podcast_id) {
        console.log("no page size or podcast id");
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: job._id,
            status: "no page size or podcast id",
            error: "no page size or podcast id",
        });
        return
    }
    // run with episodes to update all years
    const episodes = await ctx.runQuery(api.everwhz.episodesWithOutYears, { podcast_id: podcast_id });
    const episode_ids = episodes.map((episode: any) => episode._id);
    for (let i = 0; i < episode_ids.length; i += page_size) {
        const episode_ids_page = episode_ids.slice(i, i + page_size);
        await ctx.runMutation(internal.batch.utils.createJob, {
            type: "create_ai_prompts",
            instructions: {
                podcast_id: podcast_id,
                episode_ids: episode_ids_page,
                last_job: last_job,
            },
        });
    }
    await ctx.runMutation(internal.batch.utils.updateJob, {
        id: job._id,
        status: "completed schedule create ai prompts",
        error: undefined,
    });
}

async function updateEpisodesFromRss(ctx: ActionCtx, job: Doc<"job">) {
    console.log("updating episodes from rss");
    const episode_ids = await ctx.runMutation(api.load_episodes.patchPodcastRssJson, {
        podcast_id: job.instructions.podcast_id,
        rss_json: job.data.episodes,
        date: BATCH_DATE,
    });
    await ctx.runMutation(internal.batch.utils.createJob, {
        type: "create_ai_prompts",
        instructions: {
            podcast_id: job.instructions.podcast_id,
            episode_ids: episode_ids,
        },
    });
    await ctx.runMutation(internal.batch.utils.updateJob, {
        id: job._id,
        status: "completed process episodes",
        error: undefined,
    });

}

async function markEpisodesAsMissing(ctx: ActionCtx, job: Doc<"job">) {
    console.log("marking episodes as missing");
    await ctx.runMutation(internal.load_episodes.markUnTrackedEpisodes, {
        podcast_id: job.instructions.podcast_id,
        max_episode: job.instructions.max_episode,
    });
    await ctx.runMutation(internal.batch.utils.updateJob, {
        id: job._id,
        status: "completed mark episodes as missing",
        error: undefined,
    });
}

//[ ] sometime etag and last-modified not working when I got both and one has -gzip in the header
// Best Approach:
// Test by removing -gzip in If-None-Match. If the server responds with 304 Not Modified, it works.
// Check the Vary header. If you see Vary: Accept-Encoding, the server may be handling different versions separately.
// If stripping -gzip fails, consider using Last-Modified as a fallback
async function downloadRss(ctx: ActionCtx, job: Doc<"job">) {
    const storageId = await ctx.runAction(internal.load_episodes.downloadRssBody, { id: job.instructions.podcast_id });
    const max_episode = job.instructions.max_episode ?? 0;

    let status = "completed download rss";
    if (storageId) {
        console.log("storageId", storageId);
        await ctx.runMutation(internal.batch.utils.createJob, {
            type: "process_rss",
            instructions: {
                storage_id: storageId,
                podcast_id: job.instructions.podcast_id,
                last_job: job._id,
                max_episode: max_episode,
            },
        });
    } else {
        console.log("skipped rss up to date");
        status = "skipped rss up to date";
    }

    await ctx.runMutation(internal.batch.utils.updateJob, {
        id: job._id,
        status: status,
        error: undefined,
    });
}

async function processRss(ctx: ActionCtx, job: Doc<"job">) {
    const PAGE_SIZE = 10;
    const storageId = job.instructions.storage_id;
    const podcastId = job.instructions.podcast_id;
    
    console.log("processing rss", job._id);
    if (storageId) {
        console.log("processing rss", storageId, job._id);
        const rss_blob = await ctx.storage.get(storageId);
        if (rss_blob) {
            const rss_text = await rss_blob.text();
            const options = {
                ignoreAttributes: false,
            };
            const parser = new XMLParser(options);
            let rss_json = parser.parse(rss_text);
            const items = rss_json.rss.channel.item.reverse();
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
                const episodes = items.slice(i, i + PAGE_SIZE)
                    .map((item: any, index: number) => ({
                        title: item.title,
                        description: item.description,
                        pubDate: item.pubDate,
                        enclosure: item.enclosure,
                        guid: item.guid,
                        episode_number: i + index + 1,
                        mp3_link: item.enclosure["@_url"]
                    }));

                await ctx.runMutation(internal.batch.utils.createJob, {
                    type: "update_episodes_from_rss",
                    instructions: {
                        podcast_id: podcastId,
                        last_job: job._id,
                        offset: i,
                    },
                    data: {
                        episodes: episodes,
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
            console.log("completed schedule update episodes from rss", job._id);
            await ctx.runMutation(internal.batch.utils.updateJob, {
                id: job._id,
                status: "completed schedule update episodes from rss",
                error: undefined,
            });

        }
    } else {
        await ctx.runMutation(internal.batch.utils.updateJob, {
            id: job._id,
            status: "completed schedule update episodes from rss error",
            error: "no storage id",
        });
    }
}

export const renameJob = mutation({
    args: {
        old_type: v.string(),
        new_type: v.string(),
        size: v.number(),
    },
    handler: async (ctx, args) => {
        const jobs = await ctx.db.query("job")
            .withIndex("type", (q) => q.eq("type", args.old_type))
            .take(args.size);
        if (!jobs || jobs.length == 0) {
            console.log("no jobs found");
            return;
        }
        console.log("jobs", jobs.length);
        for (const job of jobs) {
            await ctx.db.patch(job._id, {
                type: args.new_type,
            });
        }
    },
});
