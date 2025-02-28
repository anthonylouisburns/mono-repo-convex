import { api, internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import {
  internalMutation,
  MutationCtx,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PODCASTSERIES_HISTORY, PODCASTSERIES_MUSIC_HISTORY, PODCASTSERIES_TV_AND_FILM_HISTORY } from "./taddy";
import OpenAI from "openai";
import { LengthFinishReasonError } from "openai/error.mjs";
const REDO_GEMINI_EPISODES = false;
const PAGE_SIZE = 50;

//TODO some years are [] and some are undefined
//create prompts
export const startGeminiBatchProcess = internalAction({
  handler: async (ctx) => {
    const podcasts = await ctx.runQuery(internal.geminiBatchPodcast.getNextPodcasts);
    const batch = new Date().toISOString().split("T")[0];
    if (!podcasts || podcasts.length === 0) {
      console.log("No podcasts found");
      return;
    }
    for (const podcast of podcasts) {
      if (!podcast.chart) {
        console.log("No chart found for podcast", podcast.title, podcast._id);
        continue;
      }
      await ctx.runMutation(internal.geminiBatchPodcast.geminiCreatePrompt, {
        podcast_id: podcast._id,
        chart: podcast.chart,
        batch: batch,
        page_size: PAGE_SIZE,
      });
    }
  }
});

export const startGeminiBatchProcessOnePodcast = internalAction({
  args: { podcast_id: v.id("podcast") },
  handler: async (ctx, args) => {
    const podcast = await ctx.runQuery(api.load_episodes.getPodcast, {
      id: args.podcast_id,
    });

    const batch = new Date().toISOString().split("T")[0] + ":" + podcast?.title;
    console.log("startGeminiBatchProcessOnePodcast", podcast?.title, podcast?._id, batch);

    if (!podcast?.chart) {
      console.log("No chart found for podcast", podcast?.title, podcast?._id);
      return;
    }
    await ctx.runMutation(internal.geminiBatchPodcast.geminiCreatePrompt, {
      podcast_id: podcast._id,
      chart: podcast.chart,
      batch: batch,
      page_size: PAGE_SIZE,
    });
  }
});

// post prompt to get response
export const postAllPrompts = internalAction({
  args: {
    batch: v.string(),
    run_number: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    console.log("postAllPrompts", args.batch, args.run_number);
    const next = await ctx.runAction(internal.geminiBatchPodcast.postOnePrompt, {
      batch: args.batch,
    });
    if (next) {
      await ctx.scheduler.runAfter(100, internal.geminiBatchPodcast.postAllPrompts, {
        batch: args.batch,
        run_number: (args.run_number ?? 0) + 1,
      });
    }
  }
});

export const postOnePrompt = internalAction({
  args: { batch: v.string() },
  handler: async (ctx, args) => {
    const prompt = await ctx.runQuery(internal.geminiBatchPodcast.getNextPrompt, {
      batch: args.batch,
    });
    console.log("postOnePrompt", args.batch, prompt?._id);
    if (!prompt) {
      console.log("No prompt found");
      return false;
    }
    await ctx.runMutation(internal.geminiBatchPodcast.patchPromptStatus, {
      prompt_id: prompt._id,
      status: "response_generating",
    });
    const response = await aiHistoryResponse(prompt.prompt);
    if (!response) {
      console.log("No response found");
      return false;
    }
    await ctx.runMutation(internal.geminiBatchPodcast.saveGeminiResponse, {
      prompt_id: prompt._id,
      response: response,
      status: "response_generated",
    });
    return true;
  }
});

export const getNextPrompt = internalQuery({
  args: {
    batch: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.query("gemini_prompt")
      .withIndex("batch", (q) => q.eq("batch", args.batch).eq("status", undefined))
      .first();
    return prompt;
  }
});

//process prompt response
export const processAllPromptResponses = internalAction({
  args: {
    batch: v.string(),
    run_number: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    console.log("postAllPrompts", args.batch, args.run_number);
    const next = await ctx.runMutation(internal.geminiBatchPodcast.processOnePromptResponse, {
      batch: args.batch,
    });
    if (next) {
      await ctx.scheduler.runAfter(100, internal.geminiBatchPodcast.processAllPromptResponses, {
        batch: args.batch,
        run_number: (args.run_number ?? 0) + 1,
      });
    }
  }
});

export const resetPromptStatus = internalMutation({
  args: {
    batch: v.string(),
  },
  handler: async (ctx, args) => {
    const prompts = await ctx.db.query("gemini_prompt")
      .withIndex("batch", (q) => q.eq("batch", args.batch).eq("status", "response_processed_error"))
      .collect();

    for (const prompt of prompts) {
      await ctx.db.patch(prompt._id, {
        status: "response_generated",
      });
    }
  }
});

export const processOnePromptResponse = internalMutation({
  args: {
    batch: v.string(),
    run_number: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    console.log("processPromptResponse", args.batch, args.run_number);
    const prompt = await ctx.db.query("gemini_prompt")
      .withIndex("batch", (q) => q.eq("batch", args.batch).eq("status", "response_generated"))
      .first();
    if (!prompt) {
      console.log("No prompt found");
      return false;
    }
    await ctx.runMutation(internal.geminiBatchPodcast.processPromptResponse, {
      prompt_id: prompt._id,
    });
    return true;
  }
});

export async function aiHistoryResponse(prompt: string) {
  // console.log("geminiHistoryResponse", prompt);
  return await openaiResponse(prompt);
}





export const getGeminiPrompt = internalQuery({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    console.log("getGeminiPrompt", args.prompt_id);
    const prompt = await ctx.db.get(args.prompt_id);
    return prompt;
  }
});

export const saveGeminiResponse = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
    response: v.string(),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    await ctx.db.patch(args.prompt_id, {
      response: args.response,
      status: args.status,
    });
  }
});

export const patchPromptStatus = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    await ctx.db.patch(args.prompt_id, {
      status: args.status,
    });
  }
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



export const geminiCreatePrompt = internalMutation({
  args: { podcast_id: v.id("podcast"), chart: v.string(), batch: v.string(), page_size: v.number() },
  handler: async (ctx, args) => {
    console.log("geminiCreatePrompt", args.podcast_id, args.chart);
    await geminiHistoryOnePodcast(args.podcast_id, args.chart, ctx, args.batch, args.page_size);
  }
});

export async function geminiHistoryOnePodcast(podcast_id: Id<"podcast">, chart: string, ctx: MutationCtx, batch_name: string, page_size: number) {
  console.log("geminiHistoryOnePodcast", podcast_id, chart, page_size);
  const podcast = await ctx.db.get(podcast_id);

  const episodes = await getEpisodesQueryForPrompt(ctx, podcast_id)
    .collect();


  const items = episodes.map((episode) => ({
    id: episode._id,
    title: stripHtml(episode.title ?? "Untitled"),
    description: stripHtml(episode.episode_description ?? ""),
  }));

  if (!items || items.length === 0 || !podcast) {
    console.log("No items found");
    return [];
  }

  // Process in batches of 50
  console.log("items", items.length);
  for (let i = 0; i < items.length; i += page_size) {
    const batch = items.slice(i, i + page_size);
    const prompt_string = await geminiPrompt(podcast, batch, chart);
    const prompt_id = await savePrompt(podcast_id, prompt_string, chart, batch_name, ctx);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}



export function getEpisodesQueryForPrompt(ctx: MutationCtx, podcast_id: Id<"podcast">) {
  const q = ctx.db.query("episode")
    .withIndex("podcast_episode_number", (q) =>
      q.eq("podcast_id", podcast_id),
    );
  if (!REDO_GEMINI_EPISODES) {
    return q.filter((q) => q.eq(q.field("years"), undefined));
  }
  return q;
}

export async function savePrompt(podcast_id: Id<"podcast">, prompt: string, chart: string, batch: string, ctx: MutationCtx) {
  console.log("savePrompt", podcast_id, chart);
  return await ctx.db.insert("gemini_prompt", {
    podcast_id: podcast_id,
    prompt: prompt,
    chart: chart,
    batch: batch,
  });
}

export const HISTORY_PROMPT =
  `
    Below is a description of a history podcast and a list of episodes with title and description.
    every episode must have at least 1 specific year and 1 geoname.
    For each episode, please respond with:
    {id: string,years: string[], geonames: string[]},
    return an array [{id: string,years: string[], geonames: string[]}...]
`;

export const MUSIC_PROMPT =
  `
    Below is a description of a music history podcast and a list of episodes with title and description.
    every episode must have at least 1 specific year and 1 geoname.
    For each episode, please respond with:
    {id: string,years: string[], geonames: string[]},
    return an array [{id: string,years: string[], geonames: string[]}...]
`;


export const FILM_PROMPT =
  `
    Below is a description of a tv and film history podcast and a list of episodes with title and description.
    every episode must have at least 1 specific year and 1 geoname.
    For each episode, please respond with:
    {id: string,years: string[], geonames: string[]},
    return an array [{id: string,years: string[], geonames: string[]}...]
`;


export async function geminiPrompt(
  podcast: Doc<"podcast">,
  items: Array<any>,
  chart: string
): Promise<string> {
  console.log("geminiPrompt", podcast.title, podcast.description, items, chart);
  const data = {
    podcast_title: stripHtml(podcast.title ?? ""),
    podcast_description: stripHtml(podcast.description ?? ""),
    episodes: items,
  }
  if (!podcast.chart) {
    console.log("No chart found for podcast", podcast.title, podcast._id, "chart", chart);
    return "";
  }
  switch (podcast.chart) {
    case PODCASTSERIES_HISTORY:
      return HISTORY_PROMPT + JSON.stringify(data);
    case PODCASTSERIES_MUSIC_HISTORY:
      return MUSIC_PROMPT + JSON.stringify(data);
    case PODCASTSERIES_TV_AND_FILM_HISTORY:
      return FILM_PROMPT + JSON.stringify(data);
    default:
      return "";
  }
}



export async function geminiResponse(prompt: string) {
  const genAI = new GoogleGenerativeAI(
    "AIzaSyDJA8p-kNXjviC_4jyuZljDhaGbjcoxxXU",
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
  const result = await model.generateContent(prompt);
  console.log("response", "...", result.response.text().substring(result.response.text().length - 200));
  return result.response.text();
}

export async function openaiResponse(prompt: string) {
  console.log("openai")
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const output = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] });
  console.log(output);
  return output.choices[0].message.content;
}

export const processPromptResponse = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    console.log("processPromptResponse", args.prompt_id);
    const prompt = await ctx.db.get(args.prompt_id);
    if (!prompt?.response) {
      return;
    }

    let items: Array<{ id: Id<"episode">; years: string[]; geonames: string[]; }> = [];
    try {
      items = await getJsonFromResponse(prompt.response);
    } catch (error) {
      console.log("error", error);

      await ctx.db.patch(args.prompt_id, {
        status: "response_processed_error",
      });//[ ] todo move to where called not in function
      return false;
    }
    if (!items) {
      await ctx.db.patch(args.prompt_id, {
        status: "response_processed_error",
      });
      return false;
    }
    // insert years into episode
    for (const item of items) {
      try {
        if (item.years.length > 0) {
          console.log("patch years", item.id, item.years, item.geonames);
          await ctx.db.patch(item.id, {
            years: item.years,
            geonames: item.geonames,
            status: "years_inserted",
          });
        } else {
          console.log("failed to insert years episode:", item.id, "prompt:", prompt._id);
          await ctx.db.patch(item.id, {
            status: "failed to insert years"
          });
        }
      } catch (error) {
        console.error("error failed to insert", error);
        await ctx.db.patch(args.prompt_id, {
          status: "response_processed_error",
        });
      }
    }
    console.log("processPromptResponse done");
    await ctx.db.patch(args.prompt_id, {
      status: "response_processed",
    });
  },
});

export async function getJsonFromResponse(response: string) {
  // just get the string between ```json and ```
  console.log("getJsonFromResponse", response);
  let responseJson = response.substring(response.indexOf("["), response.lastIndexOf("]") + 1);
  responseJson = responseJson
  .replace(/\/.*/g, '') // Remove single-line comments;;
  // Add quotes to unquoted keys
  .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  // responseJson = responseJson.replace(/\n/g, '')

  console.log("responseJson", responseJson);
  if (responseJson.indexOf("[") != 0) {
    console.log("json wrong format", response);
  } 

  const json = JSON.parse(responseJson);
  console.log("json", json);
  const items: Array<{ id: Id<"episode">; years: string[]; geonames: string[]; }> = json.map((item: any) => {
    try {
      const id = item.id;
      const years = item.years.sort();
      const geonames = item.geonames.sort();
      return { id, years, geonames };
    } catch (error) {
      console.log("error", error, item);
      return null;
    }
  });
  console.log("items", items);
  return items;
}

export const deleteYearsByPodcast = internalMutation({
  args: {
    podcast_id: v.id("podcast"),
  },
  handler: async (ctx, args) => {
    const episodes = await ctx.db
      .query("episode")
      .withIndex("podcast_episode_number", (q) => q.eq("podcast_id", args.podcast_id))
      .collect();
    episodes.map((episode) => {
      ctx.db.patch(episode._id, {
        years: undefined,
        status: "years_deleted",
      });
    });
  },
});



export const updateTimeline = internalAction({
  handler: async (ctx) => {
    const podcasts = await ctx.runQuery(internal.geminiBatchPodcast.getNextPodcasts);
    await Promise.all(podcasts.map(async (podcast) => {
      console.log("updateTimelinePodcast", podcast._id, podcast.title);
      await ctx.runMutation(internal.geminiBatchPodcast.updateTimelinePodcast, {
        podcast_id: podcast._id,
      });
    }));
  },
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
        await ctx.db.delete(timeline._id);
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
        await ctx.db.insert("timeline", {
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
