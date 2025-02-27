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

//TODO some years are [] and some are undefined
export const startGeminiBatchProcess = internalAction({
  handler: async (ctx) => {
    const podcasts = await ctx.runQuery(internal.geminiBatchPodcast.getNextPodcasts);
    if (!podcasts || podcasts.length === 0) {
      console.log("No podcasts found");
      return;
    }
    for (const podcast of podcasts) {
      await ctx.runAction(internal.geminiBatchPodcast.geminiOnePodcast, {
        podcast_id: podcast._id,
      });
    }
  }
});

export const geminiOnePodcast = internalAction({
  args: { podcast_id: v.id("podcast") },
  handler: async (ctx, args) => {
    const podcast = await ctx.runQuery(api.load_episodes.getPodcast, {
      id: args.podcast_id,
    });
    console.log("geminiOnePodcast", podcast?.title, podcast?._id);
    if (!podcast) {
      console.log("No podcast found");
      return;
    }
    if (!podcast.chart) {
      console.log("No chart found for podcast", podcast.title, podcast._id);
      return;
    }
    await ctx.runAction(internal.geminiBatchPodcast.getGeminiCreatePromptAndProcess, {
      podcast_id: podcast._id,
      chart: podcast.chart,
    });
    await ctx.runMutation(internal.geminiBatchPodcast.updateTimelinePodcast, {
      podcast_id: podcast._id,
    });
  }
});

// [ ] todo make sure deleted episodes are re added to the podcast
export const getGeminiCreatePromptAndProcess = internalAction({
  args: { podcast_id: v.id("podcast"), chart: v.string() },
  handler: async (ctx, args) => {
    const podcast_id = args.podcast_id;
    const chart = args.chart;
    console.log("getGeminiCreatePromptAndProcess");
    const prompt_ids = await ctx.runMutation(internal.geminiBatchPodcast.geminiCreatePrompt, {
      podcast_id: podcast_id,
      chart: chart,
    });
    if (!prompt_ids || prompt_ids.length === 0) {
      console.log("No prompt_id found");
      return;
    }
    for (const prompt_id of prompt_ids) {
      await ctx.runAction(internal.geminiBatchPodcast.getGeminiResponse, {
        prompt_id: prompt_id,
      });
      await ctx.runMutation(internal.geminiBatchPodcast.processPromptResponse, {
        prompt_id: prompt_id,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // run again after 10 seconds
  }
});

//[ ] todo filter out podcasts with all years already inserted
//[ ] update index episodes years, episode number
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
  args: { podcast_id: v.id("podcast"), chart: v.string() },
  handler: async (ctx, args) => {
    console.log("geminiCreatePrompt", args.podcast_id, args.chart);
    const prompt_ids = await geminiHistoryOnePodcast(args.podcast_id, args.chart, ctx);
    if (!prompt_ids) {
      console.log("No prompt_ids found");
      return;
    }
    return prompt_ids;
  }
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export const getGeminiResponse = internalAction({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    console.log("getGeminiResponse", args.prompt_id);
    const prompt = await ctx.runQuery(internal.geminiBatchPodcast.getGeminiPrompt, {
      prompt_id: args.prompt_id,
    });
    if (!prompt) {
      console.log("No prompt found");
      return;
    }
    const response = await geminiHistoryResponse(prompt.prompt);
    await ctx.runMutation(internal.geminiBatchPodcast.saveGeminiResponse, {
      prompt_id: args.prompt_id,
      response: response,
    });
  }
});

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
  },

  handler: async (ctx, args) => {
    await ctx.db.patch(args.prompt_id, {
      response: args.response,
    });
  }
});

export function getEpisodesQueryForPrompt(ctx: MutationCtx, podcast_id: Id<"podcast">) {
  if (REDO_GEMINI_EPISODES) {
    return ctx.db.query("episode").filter((q) => q.eq(q.field("years"), undefined));
  }
  return ctx.db.query("episode")
      .withIndex("podcast_episode_number", (q) =>
        q.eq("podcast_id", podcast_id),
      )
      .filter((q) => q.eq(q.field("years"), undefined));
}
const REDO_GEMINI_EPISODES = true;

export async function geminiHistoryOnePodcast(podcast_id: Id<"podcast">, chart: string, ctx: MutationCtx) {
  const page_size = 50;
  console.log("geminiHistoryOnePodcast", podcast_id, chart, page_size);
  const podcast = await ctx.db.get(podcast_id);
  
  const episodes = await getEpisodesQueryForPrompt(ctx, podcast_id)
      .collect();

  if (episodes.length === 0) {
    console.log("No episodes found");
    return;
  }

  const items = episodes.map((episode) => ({
    id: episode._id,
    title: stripHtml(episode.title ?? "Untitled"),
    description: stripHtml(episode.episode_description ?? ""),
  }));

  if (!items || items.length === 0 || !podcast) {
    console.log("No items found");
    return [];
  }

  const prompt_ids: Id<"gemini_prompt">[] = [];
  // Process in batches of 50
  for (let i = 0; i < items.length; i += page_size) {
    const batch = items.slice(i, i + page_size);
    const prompt_string = await geminiPrompt(podcast, batch, chart);
    const prompt_id = await savePrompt(podcast_id, prompt_string, chart, ctx);
    prompt_ids.push(prompt_id);
  }

  console.log("prompt_ids", prompt_ids);
  return prompt_ids;
}

export async function savePrompt(podcast_id: Id<"podcast">, prompt: string, chart: string, ctx: MutationCtx) {
  console.log("savePrompt", podcast_id, chart);
  return await ctx.db.insert("gemini_prompt", {
    podcast_id: podcast_id,
    prompt: prompt,
    chart: chart,
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
//     Below is a description of a podcast and a list of episodes with title.
// For each episode, please respond with:
// {id: string,years: string[], geonames: string[]},
// every episode must have at least 1 year and 1 geoname.

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

export async function geminiHistoryResponse(prompt: string) {
  // console.log("geminiHistoryResponse", prompt);
  const genAI = new GoogleGenerativeAI(
    "AIzaSyDJA8p-kNXjviC_4jyuZljDhaGbjcoxxXU",
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
  const result = await model.generateContent(prompt);
  console.log("response", "...", result.response.text().substring(result.response.text().length - 200));
  return result.response.text();
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

    const responseJson = prompt.response.replace("```json", "").replace("```", "").trim();
    var first_char = "";
    var last_char = "";
    console.log("responseJson", responseJson.charAt(0), responseJson.charAt(responseJson.length - 1));
    if ("[" != responseJson.charAt(0)) {
      first_char = "[";
    }
    if ("]" != responseJson.charAt(responseJson.length - 1)) {
      last_char = "]";
    }
    console.log("responseJson", first_char, last_char, responseJson);
    const json = JSON.parse(first_char + responseJson + last_char);
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
    // insert years into episode
    items.map((item) => {
      if (item.years.length > 0) {
        ctx.db.patch(item.id, {
          years: item.years,
          geonames: item.geonames,
          status: "years_inserted",
        });
      } else {
        ctx.db.patch(item.id, {
          status: "failed to insert years",
        });
        console.log("failed to insert years episode:", item.id, "prompt:", prompt._id);
      }
    });
    console.log(items);
  },
});

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
    podcasts.map(async (podcast) => {
      console.log("updateTimelinePodcast", podcast._id, podcast.title);
      await ctx.scheduler.runAfter(0, internal.geminiBatchPodcast.updateTimelinePodcast, {
        podcast_id: podcast._id,
      });
    });
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
    episodes.map(async (episode) => {
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
      if (episode.years && episode.years.length > 0 && episode.geonames && episode.geonames.length > 0 && episode.chart && episode.rank && episode.episode_number) {
        totalInserted++;
        await ctx.db.insert("timeline", {
          podcast_id: episode.podcast_id,
          episode_id: episode._id,
          start: episode.years[0],
          end: episode.years[episode.years.length - 1],
          geoname: episode.geonames[0],
          chart: episode.chart,
          rank: episode.rank,
          episode_number: episode.episode_number,
        });
      }
      totalCount++;
    });
    console.log("totalCount", totalCount, "totalInserted", totalInserted, "totalWithYears", totalWithYears, "totalWithGeonames", totalWithGeonames, "totalWithChart", totalWithChart, "totalWithRank", totalWithRank, "totalWithEpisodeNumber", totalWithEpisodeNumber);
    return { totalCount, totalWithYears, totalWithGeonames, totalWithChart, totalWithRank, totalWithEpisodeNumber, totalInserted };
  },
});
