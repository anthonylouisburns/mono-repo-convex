
// load_episodes.ts
// export const patchPodcastRssJson = mutation({
//     args: { podcast_id: v.id("podcast"), podcast_chart: v.string(), podcast_rank: v.number(), rss_json: v.any(), date: v.string(), offset: v.number() },
  
//     handler: async (ctx, args) => {
//       console.log("patchPodcastRssJson start", args.podcast_id);
//       const { podcast_id, rss_json } = args;
//       const batch_size = 100;
  
//       const items = rss_json.rss.channel.item;
//       const max_episode = items.length;
//       const podcast_title = rss_json.rss.channel.title;
//       const podcast_description = rss_json.rss.channel.description;
//       console.log("patching podcast", podcast_title, podcast_id);
//       ctx.db.patch(podcast_id, { number_of_episodes: max_episode, title: podcast_title, description: podcast_description });
  
//       let last_batch = false;
//       if (args.offset + batch_size >= max_episode) {
//         last_batch = true;
//       }
//       const end_index = Math.min(args.offset + batch_size, max_episode);
  
//       for (let index = args.offset; index < end_index; index++) {
//         const item = rss_json.rss.channel.item[index];
//         const e_n = Math.ceil(max_episode - index);
  
//         const episode = await ctx.db
//           .query("episode")
//           .withIndex("podcast_episode_number", (q) =>
//             q.eq("podcast_id", args.podcast_id).eq("episode_number", e_n),
//           )
//           .unique();
  
//         console.log("item", item.title);
//         const title = item.title;
//         if (!item.enclosure || item.enclosure["@_url"] == null) {
//           console.log("mp3_link missing", item);
//           return;
//         }
//         if (episode) {
//           ctx.db.patch(episode._id, {
//             podcast_id: args.podcast_id,
//             episode_number: Math.ceil(max_episode - index),
//             episode_description: item.description,
//             mp3_link: item.enclosure["@_url"],
//             title: title,
//             podcast_title: podcast_title,
//             chart: args.podcast_chart,
//             rank: args.podcast_rank,
//             updated_date: args.date
//           });
//         } else {
//           ctx.db.insert("episode", {
//             podcast_id: args.podcast_id,
//             episode_number: Math.ceil(max_episode - index),
//             episode_description: item.description,
//             mp3_link: item.enclosure["@_url"],
//             title: title,
//             podcast_title: podcast_title,
//             chart: args.podcast_chart,
//             rank: args.podcast_rank,
//             updated_date: args.date
//           });
//         }
//       }
  
//       if (last_batch) {
//         console.log("patchPodcastRssJson done", podcast_title, args.podcast_id);
//         await ctx.scheduler.runAfter(0, internal.load_episodes.markUnTrackedEpisodes, {
//           podcast_id: args.podcast_id,
//           max_episode: max_episode,
//         });
//       } else {
//         await ctx.scheduler.runAfter(0, api.load_episodes.patchPodcastRssJson, {
//           podcast_id: args.podcast_id,
//           podcast_chart: args.podcast_chart,
//           podcast_rank: args.podcast_rank,
//           rss_json: args.rss_json,
//           date: args.date,
//           offset: args.offset + batch_size,
//         });
//       }
//     },
//   });

// load_episodes.ts
// export const parseXml = action({
//     args: {
//       pod_id: v.id("podcast"),
//     },
  
//     // Action implementation.
//     handler: async (ctx, args) => {
//       console.log("parseXml");
//       const podcast = await ctx.runQuery(api.load_episodes.getPodcast, {
//         id: args.pod_id,
//       });
//       if (podcast == null || podcast.rss_body == null || podcast.chart == null || podcast.rank == null) {
//         console.error("podcast not found", podcast?.title, podcast?._id, podcast?.rss_body);
//         return;
//       }
//       const rss_blob = await ctx.storage.get(podcast.rss_body);
//       if (rss_blob == null) {
//         console.error("doc empty", podcast?.title, podcast?._id, podcast?.rss_body);
//         return;
//       }
//       const rss_text = await rss_blob.text();
  
//       const options = {
//         ignoreAttributes: false,
//       };
//       const parser = new XMLParser(options);
//       let doc = parser.parse(rss_text);
  
//       await ctx.runMutation(api.load_episodes.patchPodcastRssJson, {
//         podcast_id: args.pod_id,
//         podcast_chart: podcast.chart,
//         podcast_rank: podcast.rank,
//         rss_json: doc,
//         date: TODAYS_DATE,
//         offset: 0,
//       });
//     },
//   });
 
// everwhz.ts
// export const episodes = query({
//     args: { podcast_id: v.union(v.id("podcast"), v.null()) },
  
//     handler: async (ctx, args) => {
//       const episodes = await ctx.db
//         .query("episode")
//         .withIndex("podcast_episode_number", (q) =>
//           q.eq("podcast_id", args.podcast_id as Id<"podcast">),
//         )
//         .collect();
//       return episodes;
//     },
//   });


// aiBatchPodcast.ts
// export const startGeminiBatchProcess = internalAction({
//     handler: async (ctx) => {
//       const podcasts = await ctx.runQuery(internal.aiBatchPodcast.getAllPodcasts);
//       const batch = new Date().toISOString().split("T")[0];
//       if (!podcasts || podcasts.length === 0) {
//         console.log("No podcasts found");
//         return;
//       }
//       for (const podcast of podcasts) {
//         if (!podcast.chart) {
//           console.log("No chart found for podcast", podcast.title, podcast._id);
//           continue;
//         }
//         await ctx.runMutation(internal.aiBatchPodcast.geminiCreatePrompt, {
//           podcast_id: podcast._id,
//           chart: podcast.chart,
//           batch: batch,
//           page_size: PAGE_SIZE,
//         });
//       }
//     }
//   });

// aiBatchPodcast.ts
// export const getAllPodcasts = internalQuery({
//     args: {},
//     handler: async (ctx) => {
//       console.log("getAllPodcasts must have chart type");
//       const podcasts = await ctx.db.query("podcast")
//         .filter((q) => q.neq(q.field("chart"), undefined))
//         .collect();
  
//       return podcasts;
//     }
//   });

// aiBatchPodcast.ts
// export const startGeminiBatchProcessOnePodcast = internalAction({
//     args: { podcast_id: v.id("podcast"), episode_ids: v.array(v.id("episode")) },
//     handler: async (ctx, args) => {
//       const podcast = await ctx.runQuery(api.load_episodes.getPodcast, {
//         id: args.podcast_id,
//       });
  
//       const batch = new Date().toISOString().split("T")[0] + ":" + podcast?.title;
//       console.log("startGeminiBatchProcessOnePodcast", podcast?.title, podcast?._id, batch);
  
//       if (!podcast?.chart) {
//         console.log("No chart found for podcast", podcast?.title, podcast?._id);
//         return;
//       }
//       await ctx.runMutation(internal.aiBatchPodcast.geminiCreatePrompt, {
//         podcast_id: podcast._id,
//         chart: podcast.chart,
//         batch: batch,
//         page_size: PAGE_SIZE,
//       });
//     }
//   });

// aiBatchPodcast.ts
// post prompt to get response
// export const postAllPrompts = internalAction({
//     args: {
//       batch: v.string(),
//       run_number: v.optional(v.number())
//     },
//     handler: async (ctx, args) => {
//       console.log("postAllPrompts", args.batch, args.run_number);
//       const next = await ctx.runAction(internal.aiBatchPodcast.postOnePrompt, {
//         batch: args.batch,
//       });
//       if (next) {
//         await ctx.scheduler.runAfter(100, internal.aiBatchPodcast.postAllPrompts, {
//           batch: args.batch,
//           run_number: (args.run_number ?? 0) + 1,
//         });
//       }
//     }
//   });

// aiBatchPodcast.ts
// export const getNextPrompt = internalQuery({
//     args: {
//       batch: v.string(),
//     },
//     handler: async (ctx, args) => {
//       const prompt = await ctx.db.query("gemini_prompt")
//         .withIndex("batch", (q) => q.eq("batch", args.batch).eq("status", undefined))
//         .first();
//       return prompt;
//     }
//   });

// aiBatchPodcast.ts
//export const geminiCreatePrompt = internalMutation({
// args: { podcast_id: v.id("podcast"), chart: v.string(), batch: v.string(), page_size: v.number() },
// handler: async (ctx, args) => {
//   console.log("geminiCreatePrompt", args.podcast_id, args.chart);
//   await geminiHistoryOnePodcast(args.podcast_id, args.chart, ctx, args.batch, args.page_size);
// }
// });

// aiBatchPodcast.ts
// export async function geminiHistoryOnePodcast(podcast_id: Id<"podcast">, chart: string, ctx: MutationCtx, batch_name: string, page_size: number) {
//     console.log("geminiHistoryOnePodcast", podcast_id, chart, page_size);
//     const podcast = await ctx.db.get(podcast_id);
  
//     const episodes = await getEpisodesQueryForPrompt(ctx, podcast_id)
//       .collect();
  
  
//     const items = episodes.map((episode) => ({
//       id: episode._id,
//       title: stripHtml(episode.title ?? "Untitled"),
//       description: stripHtml(episode.episode_description ?? ""),
//     }));
  
//     if (!items || items.length === 0 || !podcast) {
//       console.log("No items found");
//       return [];
//     }
  
//     // Process in batches of 50
//     console.log("items", items.length);
//     for (let i = 0; i < items.length; i += page_size) {
//       const batch = items.slice(i, i + page_size);
//       const prompt_string = await geminiPrompt(podcast, batch, chart);
//       const prompt_id = await savePrompt(podcast_id, prompt_string, chart, batch_name, ctx);
//     }
//   }

// aiBatchPodcast.ts
// export const processOnePromptResponse = internalMutation({
//     args: {
//       batch: v.string(),
//       run_number: v.optional(v.number())
//     },
//     handler: async (ctx, args) => {
//       console.log("processPromptResponse", args.batch, args.run_number);
//       const prompt = await ctx.db.query("gemini_prompt")
//         .withIndex("batch", (q) => q.eq("batch", args.batch).eq("status", "response_generated"))
//         .first();
//       if (!prompt) {
//         console.log("No prompt found");
//         return false;
//       }
//       await ctx.runMutation(internal.aiBatchPodcast.processPromptResponse, {
//         prompt_id: prompt._id,
//       });
//       return true;
//     }
//   });

// aiBatchPodcast.ts
// export function getEpisodesQueryForPrompt(ctx: MutationCtx, podcast_id: Id<"podcast">) {
//     const q = ctx.db.query("episode")
//       .withIndex("podcast_episode_number", (q) =>
//         q.eq("podcast_id", podcast_id),
//       );
//     if (!REDO_GEMINI_EPISODES) {
//       return q.filter((q) => q.eq(q.field("years"), undefined));
//     }
//     return q;
//   }

// aiBatchPodcast.ts
//process prompt response
// export const processAllPromptResponses = internalAction({
//     args: {
//       batch: v.string(),
//       run_number: v.optional(v.number())
//     },
//     handler: async (ctx, args) => {
//       console.log("postAllPrompts", args.batch, args.run_number);
//       const next = await ctx.runMutation(internal.aiBatchPodcast.processOnePromptResponse, {
//         batch: args.batch,
//       });
//       if (next) {
//         await ctx.scheduler.runAfter(100, internal.aiBatchPodcast.processAllPromptResponses, {
//           batch: args.batch,
//           run_number: (args.run_number ?? 0) + 1,
//         });
//       }
//     }
//   });

// aiBatchPodcast.ts
// export const resetPromptStatus = internalMutation({
//     args: {
//       batch: v.string(),
//     },
//     handler: async (ctx, args) => {
//       const prompts = await ctx.db.query("gemini_prompt")
//         .withIndex("batch", (q) => q.eq("batch", args.batch).eq("status", "response_processed_error"))
//         .collect();
  
//       for (const prompt of prompts) {
//         await ctx.db.patch(prompt._id, {
//           status: "response_generated",
//         });
//       }
//     }
//   });

// aiBatchPodcast.ts
// export const getGeminiPrompt = internalQuery({
//     args: {
//       prompt_id: v.id("gemini_prompt"),
//     },
//     handler: async (ctx, args) => {
//       console.log("getGeminiPrompt", args.prompt_id);
//       const prompt = await ctx.db.get(args.prompt_id);
//       return prompt;
//     }
//   });


